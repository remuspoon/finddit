import { Devvit } from "@devvit/public-api";
import "./settings.js";
import { buildCommentRichtext } from "./comment.js";
import { DiscordLogger } from "./services/discord.js";
import { getOpenAIEmbedding } from "./services/openai.js";
import { getSupabaseClient, getSubredditConfig, querySupabaseVDB, tagDeletedSupabasePosts, logQueryEvent } from "./services/supabase.js";
import { MatchCandidate, MatchLogEntry, ValidLink, VDBMatchResult } from "./types.js";
import { formatError, isValidMatch } from "./utils.js";

Devvit.addTrigger({
  event: "PostCreate",
  onEvent: async (event, context) => {
    const supabaseUrl = (await context.settings.get("SUPABASE_URL"))?.toString()?.trim();
    const supabaseApiKey = (await context.settings.get("SUPABASE_API_KEY"))?.toString()?.trim();
    const openaiApiKey = (await context.settings.get("OPENAI_API_KEY"))?.toString()?.trim();
    const infoUrl = (await context.settings.get("DISCORD_INFO_LOG_WEBHOOK_URL"))?.toString()?.trim();
    const errorUrl = (await context.settings.get("DISCORD_ERROR_LOG_WEBHOOK_URL"))?.toString()?.trim();
    const log = (infoUrl || errorUrl) ? new DiscordLogger({ infoUrl, errorUrl }) : null;

    if (!supabaseApiKey || !openaiApiKey || !supabaseUrl) {
      await log?.error("Missing SUPABASE_API_KEY or OPENAI_API_KEY in app settings");
      return;
    }

    const postId = event.post?.id;
    if (!postId) {
      return;
    }

    // Devvit delivers PostCreate at-least-once — deduplicate with Redis (SET NX is atomic)
    // 
    const dedupKey = `finddit:processed:${postId}`;
    const dedupResult = await context.redis.set(dedupKey, "1", { nx: true });
    if (!dedupResult) {
      return;
    }
    await context.redis.expire(dedupKey, 600);

    // ------------------------------
    // Subreddit allowlist + VDB config
    // ------------------------------

    const subreddit = event.subreddit?.name ?? "";
    await log?.info(`Processing post from subreddit: ${subreddit}`);
    const supabase = getSupabaseClient(supabaseUrl, supabaseApiKey);
    const subredditConfig = await getSubredditConfig(supabase, subreddit);
    if (!subredditConfig) {
      await log?.info(`Subreddit ${subreddit} not in allowlist, skipping`);
      return;
    }
  
    // ------------------------------
    // Flair filter (before any API calls)
    // ------------------------------

    const targetFlairsSetting = (await context.settings.get("TARGET_FLAIRS"))?.toString()?.trim();
    if (targetFlairsSetting) {
      const targetFlairs = targetFlairsSetting.split(",").map((f) => f.trim().toLowerCase());
      const postFlair = event.post?.linkFlair?.text?.toLowerCase() ?? "";
      if (!postFlair || !targetFlairs.includes(postFlair)) {
        return;
      }
    }

    try {
      await log?.info(`Processing new post: ${postId}`);
      const post = await context.reddit.getPostById(postId);

      // For crossposts the body is empty — fetch the parent post's body instead
      let postBody = post.body ?? "";
      if (!postBody && event.post?.crosspostParentId) {
        try {
          const parentId = event.post.crosspostParentId;
          const parentPost = await context.reddit.getPostById(parentId);
          postBody = parentPost.body ?? "";
        } catch {
          await log?.warn(`Failed to fetch parent post for ${postId}, skipping`);
        }
      }

      const queryText = [post.title, postBody].filter(Boolean).join("\n\n").trim();
      if (!queryText) {
        await log?.info(`Post ${postId} has no title or body, skipping`);
        return;
      }

      // ------------------------------
      // Embedding and Querying VDB
      // ------------------------------

      let embedding: number[];
      try {
        embedding = await getOpenAIEmbedding(queryText, openaiApiKey);
      } catch (err) {
        await log?.error(`Failed to get OpenAI embedding: ${formatError(err)}`);
        return;
      }

      let matches: VDBMatchResult[] = [];
      try {
        matches = await querySupabaseVDB(supabase, embedding, subredditConfig);
        await log?.info(`Supabase returned ${matches.length} matches`);
      } catch (err) {
        await log?.error(`Supabase match_documents error: ${formatError(err)}`);
        return;
      }

      // ------------------------------
      // Processing matches
      // ------------------------------

      const candidates: MatchCandidate[] = matches
        .filter(isValidMatch)
        .map((row) => ({
          similarity: row.similarity ?? 0,
          post_id: row.metadata.post_id,
          permalink: row.metadata.permalink,
        }));

      const validLinks: ValidLink[] = [];
      const deletedPostIds: string[] = [];
      const matchLog: MatchLogEntry[] = [];

      for (const { post_id: matchPostId, permalink, similarity } of candidates) {

        // Check if the post is deleted or removed
        try {
          const matchedPost = await context.reddit.getPostById(matchPostId);
          const author = matchedPost.authorName ?? "";
          const body = matchedPost.body ?? "";
          if (author === "[deleted]" || body === "[deleted]" || body === "[removed]") {
            deletedPostIds.push(matchPostId);
            matchLog.push({ post_id: matchPostId, permalink, similarity, status: "deleted" });
            continue;
          }
          const maxLinks = subredditConfig.cta?.max_links ?? 5;
          if (validLinks.length < maxLinks) {
            const ctaParam = subredditConfig.cta_id != null ? `&cta=${subredditConfig.cta_id}` : "";
            const clickUrl = `${subredditConfig.analytics_url}/api/click?postId=${encodeURIComponent(matchPostId)}&position=${validLinks.length}&permalink=${encodeURIComponent(permalink)}&source=${encodeURIComponent(postId)}${ctaParam}`;
            validLinks.push({ title: matchedPost.title || matchPostId, url: clickUrl, similarity });
            matchLog.push({ post_id: matchPostId, permalink, similarity, status: "valid" });
          } else {
            matchLog.push({ post_id: matchPostId, permalink, similarity, status: "overflow" });
          }
        } catch (err) {
          deletedPostIds.push(matchPostId);
          matchLog.push({ post_id: matchPostId, permalink, similarity, status: "deleted" });
          continue;
        }
      }

      // ------------------------------
      // Tag deleted posts in Supabase
      // ------------------------------

      if (deletedPostIds.length > 0) {
        try {
          await tagDeletedSupabasePosts(supabase, deletedPostIds, subredditConfig);
          await log?.info(`Tagged ${deletedPostIds.length} deleted posts`);
        } catch (err) {
          await log?.error(`Failed to tag deleted posts: ${formatError(err)}`);
        }
      }

      const scoresStr = validLinks.map((l) => l.similarity.toFixed(3)).join(", ");
      await log?.info(`${postId}: ${candidates.length} candidates, ${deletedPostIds.length} deleted, ${validLinks.length} valid — scores: [${scoresStr}]`);

      // ------------------------------
      // Posting comment
      // ------------------------------

      let commentPosted = false;
      
      if (validLinks.length === 0) {
        await log?.warn(`No valid links for ${postId}, skipping comment`);
      } else {
        const richtext = buildCommentRichtext(validLinks, subredditConfig.cta);
        await post.addComment({ richtext, runAs: "APP" });
        commentPosted = true;
        await log?.info(`Comment posted on ${postId} with ${validLinks.length} links`);
      }

      // ------------------------------
      // Log query event to Supabase
      // ------------------------------

      try {
        await logQueryEvent(supabase, {
          triggerPostId: postId,
          subreddit: subreddit,
          triggerPostFlair: event.post?.linkFlair?.text ?? null,
          ctaId: subredditConfig.cta_id,
          candidatesCount: candidates.length,
          deletedCount: deletedPostIds.length,
          validCount: validLinks.length,
          commentPosted,
          matches: matchLog,
        });
      } catch (err) {
        await log?.error(`Failed to log query event: ${formatError(err)}`);
      }
    } catch (err) {
      await log?.error(`Failed to post comment on ${postId}: ${formatError(err)}`);
    }
  },
});

export default Devvit;
