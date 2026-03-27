# Changelog

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
