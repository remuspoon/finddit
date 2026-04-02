import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { waitUntil } from '@vercel/functions';
import { discordLog } from './discord.js';

const router = Router();

router.get('/api/click', async (req: Request, res: Response) => {
  const { postId, position, permalink, source, cta } = req.query as Record<string, string | undefined>;

  if (!postId) {
    res.status(400).send('Missing postId');
    return;
  }

  const httpUrl = permalink
    ? `https://reddit.com${permalink}`
    : `https://reddit.com/comments/${postId.replace(/^t3_/, '')}`;

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
            cta_id: cta ? parseInt(cta, 10) : null,
          });
          console.log('Click logged successfully');
          if (webhookUrl) {
            await discordLog(webhookUrl, 'INFO', `Click event from: ${postId}`);
          }
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

  const ua = req.headers['user-agent'] ?? '';
  const isMobile = /iphone|ipad|ipod|android/i.test(ua);

  if (isMobile) {
    // On mobile, serve an HTML page that navigates to reddit:// to open the native app.
    // The meta-refresh is a fallback in case the scheme fails (e.g. app not installed).
    res.setHeader('Content-Type', 'text/html');
    res.send(
      `<!DOCTYPE html><html><head><meta charset="utf-8">` +
      `<script>window.location=${JSON.stringify(redditUrl)};</script>` +
      `<meta http-equiv="refresh" content="0;url=${httpUrl.replace(/"/g, '&quot;')}">` +
      `</head><body></body></html>`
    );
  } else {
    res.redirect(httpUrl);
  }
});

export default router;
