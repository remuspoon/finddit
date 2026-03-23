# finddit

Many redditors on mental health subreddits seek advice/support for their experiences but get no replies, even in large subreddits.

Finddit is a Devvit app that listens for new posts and automatically comments with links to semantically similar posts on reddit from a vector database. The goal of this app is to help users find relevant mental health discussions while they wait for replies on their post.

[Full repository here](https://github.com/remuspoon/finddit)

---

## How it works

1. A new post is created in the subreddit.
2. The `PostCreate` trigger fires and fetches the post's title and body.
3. The combined text is sent to OpenAI to generate a vector embedding.
4. The embedding is used to run a nearest-neighbor search against the Supabase vector database of archived reddit posts.
    - To see the data source and set up of the database, go to [here](https://github.com/remuspoon/finddit/tree/master/setup)
5. Each matched post is fetched via the Reddit API to verify it hasn't been deleted or removed.
6. If valid links remain, they are posted as a rich-text comment with the post titles as clickable links, authored as the app account. If all matches were filtered out, no comment is posted.
7. Logging to a Discord channel via webhook (if configured).

---

## Fetch Domains

The following domains are requested for this app:

- `api.openai.com` — Used to generate text embeddings via the `text-embedding-3-small` model. These embeddings power semantic similarity search against the post vector database.

- `cjtfquaaqzpaustuniiy.supabase.co` — Used to query a Supabase vector database (`match_documents` RPC) for posts semantically similar to the new submission. Supabase is an approved cloud provider. This use case requires vector similarity search, which is not supported by the Devvit KV store.

- `discord.com` — Used to send log messages to a Discord channel via webhook for monitoring and debugging. Only post IDs and operational status messages are logged; no user-identifiable information (usernames, post content, etc.) is sent to Discord.

---

## Triggers

### `PostCreate`

Fires whenever a new post is submitted to an installed subreddit.

**What it does:**
- Reads `SUPABASE_URL`, `SUPABASE_API_KEY`, `OPENAI_API_KEY`, and `DISCORD_WEBHOOK_URL` from app settings.
- Fetches the post by ID to get title and body.
- Generates a vector embedding of the post text via OpenAI.
- Queries Supabase for up to 5 semantically similar posts.
- Validates each match via the Reddit API, filtering out deleted and removed posts.
- Posts a rich-text comment with linked post titles via `post.addComment({ richtext, runAs: "APP" })`.
- Logs every step to Discord via webhook.

**Skips silently if:**
- The post has no title or body.
- Any required app setting is missing.
- The OpenAI or Supabase request fails.
- All matched posts were deleted or removed.

---

## App Settings

| Setting | Type | Description |
|---------|------|-------------|
| `SUPABASE_URL` | string | Base URL of your Supabase project (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_API_KEY` | string (secret) | Supabase service role or anon key |
| `OPENAI_API_KEY` | string (secret) | OpenAI API key used for generating embeddings |
| `DISCORD_WEBHOOK_URL` | string (secret) | Discord webhook URL for logging (optional) |

---

## Terms

- [Terms and Conditions](https://github.com/remuspoon/finddit/blob/master/TERMS.md)
- [Privacy Policy](https://github.com/remuspoon/finddit/blob/master/PRIVACY.md)
