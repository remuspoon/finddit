import { Devvit, RichTextBuilder, SettingScope } from "@devvit/public-api";
import { getOpenAIEmbedding } from "./openai.js";
import { getSupabaseClient, querySupabaseVDB } from "./supabase.js";

Devvit.configure({
  redditAPI: true,
  http: { domains: ["api.openai.com", "cjtfquaaqzpaustuniiy.supabase.co"] },
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
]);

Devvit.addTrigger({
  event: "PostCreate",
  onEvent: async (event, context) => {
    const postId = event.post?.id;
    if (!postId) {
      console.error("PostCreate event missing post id");
      return;
    }

    try {
      const supabaseUrl = (await context.settings.get("SUPABASE_URL"))?.toString()?.trim();
      const supabaseApiKey = (await context.settings.get("SUPABASE_API_KEY"))?.toString()?.trim();
      const openaiApiKey = (await context.settings.get("OPENAI_API_KEY"))?.toString()?.trim();
      if (!supabaseApiKey || !openaiApiKey || !supabaseUrl) {
        console.error("Missing SUPABASE_API_KEY or OPENAI_API_KEY in app settings");
        return;
      }

      const post = await context.reddit.getPostById(postId);
      const queryText = [post.title, post.body].filter(Boolean).join("\n\n").trim();
      if (!queryText) {
        console.log("Post has no title or body, skipping query");
        return;
      }

      // ------------------------------------------------------------
      // ------------------- Embedding and Query ---------------
      // ------------------------------------------------------------

      // 1) Get embedding from OpenAI
      let embedding: number[];
      try {
        embedding = await getOpenAIEmbedding(queryText, openaiApiKey);
      } catch (err) {
        console.error("Failed to get OpenAI embedding:", err);
        return;
      }

      // 2) Build Supabase client and query match_documents rpc
      const supabase = getSupabaseClient(supabaseUrl, supabaseApiKey);

      let matches: { metadata?: { permalink?: string; post_id?: string } }[] = [];
      try {
        matches = await querySupabaseVDB(supabase, embedding);
      } catch (err) {
        console.error("Supabase match_documents error:", err);
        return;
      }

      const candidates = Array.isArray(matches)
        ? matches.filter(
            (row) =>
              typeof row.metadata?.permalink === "string" &&
              row.metadata.permalink.trim().length > 0 &&
              typeof row.metadata?.post_id === "string"
          )
        : [];

      const validLinks: { title: string; url: string }[] = [];
      for (const row of candidates.slice(0, 5)) {
        try {
          const matchedPost = await context.reddit.getPostById(row.metadata!.post_id!);
          const author = matchedPost.authorName ?? "";
          const body = matchedPost.body ?? "";
          if (author === "[deleted]" || body === "[deleted]" || body === "[removed]") {
            continue;
          }
          const permalink = row.metadata!.permalink!;
          const url = permalink.startsWith("http")
            ? permalink
            : `https://www.reddit.com${permalink.startsWith("/") ? "" : "/"}${permalink}`;
          validLinks.push({ title: matchedPost.title || url, url });
        } catch {
          continue;
        }
      }

      console.log(`${postId}: ${candidates.length} candidates, ${candidates.length - validLinks.length} filtered, ${validLinks.length} valid`);

      if (validLinks.length === 0) {
        console.log(`No valid links for ${postId}, skipping comment`);
        return;
      }

      const richtext = new RichTextBuilder()
        .paragraph((p) => {
          p.text({ text: "Hey there! Thanks for sharing :)" });
        })
        .paragraph((p) => {
          p.text({ text: "While you wait for people to comment, I think you might find these posts relevant:" });
        })
        .list({ ordered: false }, (list) => {
          for (const { title, url } of validLinks) {
            list.item((item) => {
              item.paragraph((p) => {
                p.link({ text: title, url });
              });
            });
          }
        })
        .paragraph((p) => {
          p.text({
            text: "This is an automated message. If you have any feedback or issues, post in ",
            formatting: [[2, 0, 74]],
          });
          p.link({
            text: "r/finddit_app",
            url: "https://www.reddit.com/r/finddit_app/",
            formatting: [[2, 0, 13]],
          });
          p.text({
            text: ".",
            formatting: [[2, 0, 1]],
          });
        });

      await post.addComment({
        richtext,
        runAs: "APP",
      });
      console.log(`posted on ${postId} with ${validLinks.length} links`);
    } catch (err) {
      console.error("Failed to post welcome comment:", err);
    }
  },
});

export default Devvit;
