type LogLevel = "INFO" | "WARN" | "ERROR";

interface DiscordLoggerOptions {
  infoUrl?: string;
  errorUrl?: string;
}

export class DiscordLogger {
  private infoUrl: string | undefined;
  private errorUrl: string | undefined;

  constructor(options: DiscordLoggerOptions) {
    this.infoUrl = options.infoUrl;
    this.errorUrl = options.errorUrl;
  }

  async info(message: string): Promise<void> {
    await this.send("INFO", message, this.infoUrl);
  }

  async warn(message: string): Promise<void> {
    await this.send("WARN", message, this.errorUrl);
  }

  async error(message: string): Promise<void> {
    await this.send("ERROR", message, this.errorUrl);
  }

  private async send(level: LogLevel, message: string, url: string | undefined): Promise<void> {
    if (!url) return;
    const emoji = level === "ERROR" ? "🔴" : level === "WARN" ? "🟡" : "🟢";
    const content = `${emoji} **[${level}]** ${message}`;

    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch {
    }
  }
}
