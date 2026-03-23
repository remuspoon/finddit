type LogLevel = "INFO" | "WARN" | "ERROR";

export class DiscordLogger {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async info(message: string): Promise<void> {
    await this.send("INFO", message);
  }

  async warn(message: string): Promise<void> {
    await this.send("WARN", message);
  }

  async error(message: string): Promise<void> {
    await this.send("ERROR", message);
  }

  private async send(level: LogLevel, message: string): Promise<void> {
    const emoji = level === "ERROR" ? "🔴" : level === "WARN" ? "🟡" : "🟢";
    const content = `${emoji} **[${level}]** ${message}`;

    try {
      await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch {
      console.error(`Discord webhook failed: ${message}`);
    }
  }
}
