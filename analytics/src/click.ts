import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { waitUntil } from '@vercel/functions';
import { discordLog } from './discord.js';

const router = Router();

router.get('/api/click', async (req: Request, res: Response) => {
  const { postId, position, permalink, source } = req.query as Record<string, string | undefined>;

  if (!postId) {
    res.status(400).send('Missing postId');
    return;
  }

  const httpUrl = permalink
    ? `https://reddit.com${permalink}`
    : `https://reddit.com/comments/${postId.replace(/^t3_/, '')}`;

  // reddit:// triggers the native app from within WKWebView (iOS in-app browser).
  // https:// is used as the meta-refresh fallback for desktop/Android.
  const redditUrl = permalink
    ? `reddit://reddit.com${permalink}`
    : `reddit://reddit.com/comments/${postId.replace(/^t3_/, '')}`;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (supabaseUrl && supabaseKey) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    waitUntil(
      (async () => {
        try {
          console.log('Logging click to Supabase');
          await createClient(supabaseUrl, supabaseKey).from('clicks').insert({
            clicked_post_id: postId,
            position: position ? parseInt(position, 10) : null,
            source_post_id: source ?? null,
            permalink: permalink ?? null,
            user_agent: req.headers['user-agent'] ?? null,
          });
          console.log('Click logged successfully');
        } catch (err) {
          if (webhookUrl) {
            await discordLog(
              webhookUrl,
              'ERROR',
              `Failed to log click for ${postId}: ${err instanceof Error ? err.message : JSON.stringify(err)}`
            );
          }
          console.log(`Failed to log click for ${postId}: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
        }
      })()
    );
  }

  // Serve a minimal HTML page that immediately navigates to the reddit:// scheme.
  // On iOS this switches to the native Reddit app. The meta-refresh is a fallback
  // for desktop/Android where the custom scheme has no handler.
  res.setHeader('Content-Type', 'text/html');
  res.send(
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
    `<script>window.location=${JSON.stringify(redditUrl)};</script>` +
    `<meta http-equiv="refresh" content="0;url=${httpUrl.replace(/"/g, '&quot;')}">` +
    `</head><body></body></html>`
  );
});

export default router;
