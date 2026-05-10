import { Devvit, SettingScope } from "@devvit/public-api";

Devvit.configure({
  redditAPI: true,
  redis: true,
  http: { domains: ["api.openai.com", "cjtfquaaqzpaustuniiy.supabase.co", "discord.com"] },
});

Devvit.addSettings([
  {
    type: "string",
    name: "SUPABASE_API_KEY",
    label: "Supabase API Key",
    scope: SettingScope.App,
    isSecret: true,
  },
  {
    type: "string",
    name: "SUPABASE_URL",
    label: "Supabase URL",
    scope: SettingScope.App,
    isSecret: false,
  },
  {
    type: "string",
    name: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    scope: SettingScope.App,
    isSecret: true,
  },
  // Deprecated: Delete in next release after all users have updated
  {
    type: "string",
    name: "DISCORD_WEBHOOK_URL",
    label: "Discord Webhook URL",
    scope: SettingScope.App,
    isSecret: true,
  },
  {
    type: "string",
    name: "DISCORD_INFO_LOG_WEBHOOK_URL",
    label: "Discord Webhook URL for info logs",
    scope: SettingScope.App,
    isSecret: true,
  },
  {
    type: "string",
    name: "DISCORD_ERROR_LOG_WEBHOOK_URL",
    label: "Discord Webhook URL for error logs",
    scope: SettingScope.App,
    isSecret: true,
  },
  {
    type: "string",
    name: "TARGET_FLAIRS",
    label: "Post flairs to trigger on (comma-separated). Leave blank to trigger on all posts.",
    scope: SettingScope.Installation,
  },
]);
