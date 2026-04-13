# Changelog

## [1.2.4] - 2026-04-13
### Changed
- Update to `Devvit 0.12.18`
- `match_threshold` and `match_count` are now stored per-subreddit in the `configs` table and fetched as part of `SubredditConfig`, replacing the previous hardcoded defaults
- `querySupabaseVDB` and `tagDeletedSupabasePosts` now call generic RPCs (`match_documents`, `tag_deleted_posts`) that accept a `vdb_name` parameter, replacing the `_mental_health`-suffixed variants

## [1.2.2] - 2026-04-08
### Added
- `max_links` column on the `cta` table — controls how many matched links are included in the comment per subreddit. Defaults to 5 when null.

## [1.2.1] - 2026-04-08
### Added
- Block-based comment config — comment structure is now defined as a `blocks` JSON array stored in the `cta` table, replacing the fixed `intro`/`setup`/`outro` string columns. Supported block types: `text` (with optional bold/italic), `heading`, `divider`, `link`, `inline` (mixed text and links in one paragraph), `links` (dynamic matched posts list), `list`, and `quote`
- `InlinePart` named type for inline block parts
- `migrate_cta_blocks.sql` — migration script to add the `blocks` column and populate CTA id 1

### Changed
- Automated message footer moved from hardcoded function logic into `DEFAULT_BLOCKS` as an `inline` block, making it fully configurable per subreddit
- Supabase `getSubredditConfig` now normalises the `cta` join result, handling both array and plain object responses from PostgREST

## [1.2.0] - 2026-04-02
### Update dependencies
- Devvit 0.12.15 -> 0.12.17

### Added
- Per-subreddit configurable comment text — intro, setup, and outro paragraphs can now be overridden per subreddit via a `cta_id` foreign key on the `configs` table, pointing to a new `cta` table. Multiple subreddits can share one CTA version; changing a row updates all linked subreddits instantly with no redeploy
- Analytics click redirect now deep-links into the native Reddit app on iOS and Android via the `reddit://` URL scheme, avoiding the web overlay. Desktop users receive a plain redirect as before

### Changed
- `configs` table replaces `allowed_subreddits` as the subreddit config table name
- Comment text falls back to hardcoded defaults when `cta_id` is null

### Docs
- Privacy policy and terms updated to disclose click analytics (redirect links, `clicks` table, User-Agent collection)
- Privacy policy §2 expanded to list click interaction data collected on link click
- Privacy policy §4 (Supabase) updated with a third operation entry covering the `clicks` table
- Privacy policy §5 corrected — removed inaccurate "no tracking mechanisms" claim; replaced with accurate description of the click redirect
- Privacy policy §6 updated to cover deletion of click records on account deletion or request
- Terms §4 updated to note that result links route through a click-tracking redirect before landing on Reddit
- README updated to reflect click redirect behaviour in "How it works" and Fetch Domains sections

## [1.1.3] - 2026-03-30
- Replaced hardcoded subreddit allowlist with a Supabase `allowed_subreddits` table — adding a new subreddit no longer requires a redeploy
- Each subreddit now maps to a vector database name, allowing the app to support multiple subreddits backed by different databases
- RPC calls for vector search and deleted post tagging are now dynamic based on the subreddit's configured database

## [1.1.2] - 2026-03-27
- Store subreddit to query event log

## [1.1.1] - 2026-03-26
- Switched to 512 embedding length.
- Used the openai sdk instead of fetch request.
- Changed rpc's to hit the new 512 vector database.

## [1.0.3] - 2026-03-26
### Added
- Subreddit allowlist — the app now silently skips subreddits that haven't been approved, preventing unsupported installations from triggering the bot
- Flair filter — mods can now configure which post flairs the bot responds to via the subreddit app settings. Leaving it blank keeps the default behaviour (all posts)
- TypeScript types/interfaces for all major data structures
- Crosspost support — if a post has no body (i.e. it's a crosspost), the bot now fetches the original post's body to use as the query instead

### Changed
- Rich text comment builder moved to its own file (`comment.ts`)
- Error messages now correctly display the full error detail instead of `[object Object]`

## [1.0.2] - 2026-03-25
### Added
- Query event logging to Supabase — every trigger now writes a structured record including match counts, similarity scores, per-match outcomes, and whether a comment was posted

### Changed
- Updated privacy policy and terms

## [1.0.1] - 2026-03-24
### Added
- Deleted post tagging — posts found to be removed or deleted are now flagged in Supabase to prevent them appearing in future results
- Similarity scores are now logged per match

## [1.0.0] - 2026-03-22
### Added
- Initial public release
- `PostCreate` trigger — fires on new posts and automatically comments with up to 5 semantically similar historical posts
- OpenAI `text-embedding-3-small` integration for generating vector embeddings
- Supabase pgvector integration for nearest-neighbor similarity search
- Discord webhook logging for monitoring and debugging
- Configurable match threshold and result count
