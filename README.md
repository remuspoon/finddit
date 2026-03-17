# finddit

A Devvit app that listens for new posts and automatically comments with semantically similar posts from the vector database. The goal of this app is to help users find relevant mental health discussions while they wait for replies on their post.

[Full repository here](https://github.com/remuspoon/finddit)

---

## How it works

1. A new post is created in the subreddit.
2. The `PostCreate` trigger fires and fetches the post's title and body.
3. The combined text is sent to OpenAI to generate a vector embedding.
4. The embedding is used to run a nearest-neighbor search against the Supabase vector database of archived reddit posts.
    - To see the data source and set up of the database, go to [here](https://github.com/remuspoon/finddit/tree/master/setup)
5. Up to 5 matching Reddit permalinks are posted as a welcome comment on the new post, authored as the app account.

---

## Fetch Domains

The following domains are requested for this app:

- `api.openai.com` — Used to generate text embeddings via the `text-embedding-3-small` model. These embeddings power semantic similarity search against the post vector database.

- `db.cjtfquaaqzpaustuniiy.supabase.co` — Used to query a Supabase vector database (`match_documents` RPC) for posts semantically similar to the new submission. Supabase is an approved cloud provider. This use case requires vector similarity search, which is not supported by the Devvit KV store.

---

## Triggers

### `PostCreate`

Fires whenever a new post is submitted to an installed subreddit.

**What it does:**
- Reads `SUPABASE_URL`, `SUPABASE_API_KEY`, and `OPENAI_API_KEY` from app settings.
- Fetches the post by ID to get title and body.
- Generates a vector embedding of the post text via OpenAI.
- Queries Supabase for up to 5 semantically similar posts (similarity threshold: 0.7).
- Formats the matching permalinks into a welcome comment and posts it via `post.addComment({ runAs: "APP" })`.

**Skips silently if:**
- The post has no title or body.
- Any app setting is missing.
- The OpenAI or Supabase request fails.

---

## App Settings

| Setting | Type | Description |
|---------|------|-------------|
| `SUPABASE_URL` | string | Base URL of your Supabase project (e.g. `https://db.xxxx.supabase.co`) |
| `SUPABASE_API_KEY` | string (secret) | Supabase service role or anon key |
| `OPENAI_API_KEY` | string (secret) | OpenAI API key used for generating embeddings |

---

## Terms

- [Terms and Conditions](https://github.com/remuspoon/finddit/blob/master/TERMS.md)
- [Privacy Policy](https://github.com/remuspoon/finddit/blob/master/PRIVACY.md)
