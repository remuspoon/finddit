# finddit

A Devvit app that runs on Reddit. When a new post is created, it fetches an OpenAI embedding for the post's title/body, queries a Supabase vector DB for similar posts, and replies with a comment linking to the most relevant ones. Primarily deployed to mental health subreddits.

## Architecture

### Devvit app (`src/`)
- `main.ts` — Devvit trigger (`PostCreate`). Orchestrates the full pipeline: settings → config → flair filter → embedding → VDB query → Reddit checks → comment.
- `supabase.ts` — All Supabase interactions: fetching subreddit config, querying the vector DB, logging query events, tagging deleted posts.
- `comment.ts` — Builds the richtext comment using Devvit's `RichTextBuilder`. Comment text is configurable per subreddit via the `cta` join on the configs table.
- `discord.ts` — `DiscordLogger` class. Sends INFO/WARN/ERROR messages to a Discord webhook. Used for observability.
- `openai.ts` — Fetches embeddings from OpenAI.
- `types.ts` — All shared TypeScript interfaces and types.

### Analytics service (`analytics/`)
A lightweight Express app deployed on Vercel. Handles click-tracking redirects from result links included in app comments.
- `index.ts` — Express app entry point.
- `src/click.ts` — `GET /api/click` route. Logs click events to the `clicks` Supabase table (clicked post ID, position, source post ID, permalink, User-Agent, CTA ID), then redirects the user to the Reddit post (HTTP redirect on desktop; `reddit://` deep-link page on mobile).
- `src/discord.ts` — Standalone `discordLog()` helper for the analytics service (separate from the Devvit `DiscordLogger` class).

## Conventions

- Keep all Supabase calls in `supabase.ts`, not `main.ts`.
- Use `formatError()` (defined in `main.ts`) for all error stringification.
- Use `log?.method()` pattern — logger is nullable when no webhook URL is configured.
- No `console.log` in production code (use `DiscordLogger` instead).
- All types live in `types.ts`.

## Supabase

- `configs` table — allowlist of subreddits with their VDB name, analytics URL, and optional CTA config (joined via `cta_id`).
- `clicks` table — written by the analytics service. Stores per-click records: clicked post ID, position (0–4), source post ID, permalink, User-Agent, and CTA ID. No usernames or Reddit user IDs.
- `match_documents_mental_health` RPC — vector similarity search. Returns `VDBMatchResult[]`.
- `log_query_event` RPC — logs each trigger event with match stats.
- `tag_deleted_posts_mental_health` RPC — marks posts as deleted in the VDB.

## Key behaviours

- Posts not in the `configs` allowlist are silently skipped.
- Flair filtering is optional; if `TARGET_FLAIRS` setting is set, only matching flairs are processed.
- For crossposts, the parent post's body is fetched as a fallback.
- Up to 5 valid links are included in the comment. Deleted/removed posts are tagged in Supabase and skipped.
- Click URLs are routed through `analytics_url` with `postId`, `position`, `permalink`, `source`, and optional `cta` params.
