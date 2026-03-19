import { Devvit, SettingScope } from "@devvit/public-api";
import { getOpenAIEmbedding, getSupabaseClient, querySupabaseVDB } from "./query.js";

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

      // 1) Get embedding from OpenAI via helper (keys come from settings)
      let embedding: number[];
      try {
        embedding = await getOpenAIEmbedding(queryText, openaiApiKey);
      } catch (err) {
        console.error("Failed to get OpenAI embedding:", err);
        return;
      }

      // 2) Build Supabase client via helper and query match_documents
      const supabase = getSupabaseClient(supabaseUrl, supabaseApiKey);

      let matches: { permalink?: string }[] = [];
      try {
        matches = await querySupabaseVDB(supabase, embedding, {
          matchThreshold: 0.7,
          matchCount: 5,
        });
      } catch (err) {
        console.error("Supabase match_documents error:", err);
        return;
      }

      const permalinks = Array.isArray(matches)
        ? matches
            .map((row) => row.permalink)
            .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
        : [];

      const linksSection =
        permalinks.length > 0
          ? permalinks
              .slice(0, 5)
              .map((p) =>
                p.startsWith("http") ? p : `https://www.reddit.com${p.startsWith("/") ? "" : "/"}${p}`
              )
              .join("\n\n")
          : "";

      const commentText =
        "Hey there! Thanks for sharing.\n\n" +
        "While you wait for people to comment, here are some related posts you might find helpful:\n\n" +
        (linksSection || "_No similar posts found._");

      await post.addComment({
        text: commentText,
        runAs: "APP",
      });
      console.log(`Welcome comment posted on ${postId} with ${permalinks.length} links`);
    } catch (err) {
      console.error("Failed to post welcome comment:", err);
    }
  },
});

export default Devvit;
