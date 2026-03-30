import { Devvit, SettingScope } from "@devvit/public-api";
import { buildCommentRichtext } from "./comment.js";
import { DiscordLogger } from "./discord.js";
import { getOpenAIEmbedding } from "./openai.js";
import { getSupabaseClient, getSubredditConfig, querySupabaseVDB, tagDeletedSupabasePosts, logQueryEvent } from "./supabase.js";
import { MatchLogEntry, ValidLink, VDBMatchResult } from "./types.js";

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return JSON.stringify(err);
}

Devvit.configure({
  redditAPI: true,
  http: { domains: ["api.openai.com", "cjtfquaaqzpaustuniiy.supabase.co", "discord.com"] },
});

Devvit.addSettings([
  {
    type: "string",
    name: "SUPABASE_API_KEY",
    label: "Supabase API Key",
    scope: SettingScope.App,
    isSecret: true,
  },
  {
    type: "string",
    name: "SUPABASE_URL",
    label: "Supabase URL",
    scope: SettingScope.App,
    isSecret: false,
  },
  {
    type: "string",
    name: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    scope: SettingScope.App,
    isSecret: true,
  },
  {
    type: "string",
    name: "DISCORD_WEBHOOK_URL",
    label: "Discord Webhook URL",
    scope: SettingScope.App,
    isSecret: true,
  },
  {
    type: "string",
    name: "TARGET_FLAIRS",
    label: "Post flairs to trigger on (comma-separated). Leave blank to trigger on all posts.",
    scope: SettingScope.Installation,
  },
]);

Devvit.addTrigger({
  event: "PostCreate",
  onEvent: async (event, context) => {
    const discordWebhookUrl = (await context.settings.get("DISCORD_WEBHOOK_URL"))?.toString()?.trim();
    const supabaseUrl = (await context.settings.get("SUPABASE_URL"))?.toString()?.trim();
    const supabaseApiKey = (await context.settings.get("SUPABASE_API_KEY"))?.toString()?.trim();
    const openaiApiKey = (await context.settings.get("OPENAI_API_KEY"))?.toString()?.trim();
    const log = discordWebhookUrl ? new DiscordLogger(discordWebhookUrl) : null;

    if (!supabaseApiKey || !openaiApiKey || !supabaseUrl) {
      await log?.error("Missing SUPABASE_API_KEY or OPENAI_API_KEY in app settings");
      return;
    }

    const postId = event.post?.id;
    if (!postId) {
      console.error("PostCreate event missing post id");
      return;
    }

    // ------------------------------
    // Subreddit allowlist + VDB config
    // ------------------------------

    const subreddit = event.subreddit?.name ?? "";
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

      // 1) Get embedding from OpenAI
      let embedding: number[];
      try {
        embedding = await getOpenAIEmbedding(queryText, openaiApiKey);
      } catch (err) {
        await log?.error(`Failed to get OpenAI embedding: ${formatError(err)}`);
        return;
      }

      let matches: VDBMatchResult[] = [];
      try {
        matches = await querySupabaseVDB(supabase, embedding);
        await log?.info(`Supabase returned ${matches.length} matches`);
      } catch (err) {
        await log?.error(`Supabase match_documents error: ${formatError(err)}`);
        return;
      }

      // ------------------------------
      // Processing matches
      // ------------------------------

      const candidates = Array.isArray(matches)
        ? matches.filter(
            (row) =>
              typeof row.metadata?.permalink === "string" &&
              row.metadata.permalink.trim().length > 0 &&
              typeof row.metadata?.post_id === "string"
          )
        : [];

      const validLinks: ValidLink[] = [];
      const deletedPostIds: string[] = [];
      const matchLog: MatchLogEntry[] = [];

      for (const row of candidates) {
        const postId = row.metadata!.post_id!;
        const permalink = row.metadata!.permalink!;
        const similarity = row.similarity ?? 0;

        // Check if the post is deleted or removed
        try {
          const matchedPost = await context.reddit.getPostById(postId);
          const author = matchedPost.authorName ?? "";
          const body = matchedPost.body ?? "";
          if (author === "[deleted]" || body === "[deleted]" || body === "[removed]") {
            deletedPostIds.push(postId);
            matchLog.push({ post_id: postId, permalink, similarity, status: "deleted" });
            continue;
          }
          if (validLinks.length < 5) {
            const url = permalink.startsWith("http")
              ? permalink
              : `https://www.reddit.com${permalink.startsWith("/") ? "" : "/"}${permalink}`;
            validLinks.push({ title: matchedPost.title || url, url, similarity });
            matchLog.push({ post_id: postId, permalink, similarity, status: "valid" });
          } else {
            matchLog.push({ post_id: postId, permalink, similarity, status: "overflow" });
          }
        } catch {
          deletedPostIds.push(postId);
          matchLog.push({ post_id: postId, permalink, similarity, status: "deleted" });
          continue;
        }
      }

      // ------------------------------
      // Tag deleted posts in Supabase
      // ------------------------------

      if (deletedPostIds.length > 0) {
        try {
          await tagDeletedSupabasePosts(supabase, deletedPostIds);
          await log?.info(`Tagged ${deletedPostIds.length} deleted posts`);
        } catch (err) {
          await log?.error(`Failed to tag deleted posts: ${formatError(err)}`);
        }
      }

      const scoresStr = validLinks.map((l) => l.similarity.toFixed(3)).join(", ");
      await log?.info(`${postId}: ${candidates.length} candidates, ${deletedPostIds.length} deleted, ${validLinks.length} valid — scores: [${scoresStr}]`);

      // ------------------------------
      // Log query event to Supabase
      // ------------------------------

      try {
        await logQueryEvent(supabase, {
          triggerPostId: postId,
          subreddit: subreddit,
          triggerPostFlair: event.post?.linkFlair?.text ?? null,
          candidatesCount: candidates.length,
          deletedCount: deletedPostIds.length,
          validCount: validLinks.length,
          commentPosted: validLinks.length > 0,
          matches: matchLog,
        });
      } catch (err) {
        await log?.error(`Failed to log query event: ${formatError(err)}`);
      }

      // ------------------------------
      // Posting comment
      // ------------------------------

      if (validLinks.length === 0) {
        await log?.warn(`No valid links for ${postId}, skipping comment`);
        return;
      }

      const richtext = buildCommentRichtext(validLinks);

      await post.addComment({
        richtext,
        runAs: "APP",
      });

      await log?.info(`Comment posted on ${postId} with ${validLinks.length} links`);
    } catch (err) {
      await log?.error(`Failed to post welcome comment on ${postId}: ${formatError(err)}`);
    }
  },
});

export default Devvit;
