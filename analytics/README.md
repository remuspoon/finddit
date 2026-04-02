# finddit-analytics

Stateless click-tracking backend for the finddit Devvit app. Built with Express, deployed on Vercel.

When a user clicks a result link in a finddit comment, they hit this backend first. It logs the click event to Supabase in the background and immediately redirects them to the Reddit post.

---

## Endpoints

### `GET /api/click`

Logs a click and redirects to the target Reddit post.

| Param | Required | Description |
|---|---|---|
| `postId` | yes | Reddit post ID of the matched result |
| `position` | no | Position in the result list (0–4) |
| `permalink` | no | Reddit permalink path (e.g. `/r/sub/comments/abc/title/`) |
| `source` | no | Post ID of the trigger post that caused the comment |

Redirects to `https://reddit.com{permalink}`, or `https://reddit.com/comments/{postId}` if no permalink is provided.

---

## Supabase setup

```sql
create table clicks (
  id              bigint generated always as identity primary key,
  clicked_post_id text        not null,
  position        smallint,
  source_post_id  text,
  permalink       text,
  user_agent      text,
  clicked_at      timestamptz not null default now()
);
```

---

## Environment variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `DISCORD_WEBHOOK_URL` | (optional) Discord webhook for error logging |

---

## Local development

```bash
npm install
npm run dev
```

---

## Deployment

Deploy to Vercel. Once deployed, update the `analytics_url` column for the relevant subreddit(s) in the `allowed_subreddits` Supabase table to your Vercel domain (e.g. `https://your-app.vercel.app`). The Devvit app fetches this URL dynamically per subreddit — there is no hardcoded URL in the app code.
