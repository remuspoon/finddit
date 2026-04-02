type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export async function discordLog(webhookUrl: string, level: LogLevel, message: string): Promise<void> {
  const emoji = level === 'ERROR' ? '🔴' : level === 'WARN' ? '🟡' : '🟢';
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `${emoji} **[${level}]** ${message}` }),
    });
  } catch {
    console.error(`Discord webhook failed: ${message}`);
  }
}
