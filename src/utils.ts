import { VDBMatchResult } from "./types.js";

export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return JSON.stringify(err);
}

export function isValidMatch(
  row: VDBMatchResult
): row is VDBMatchResult & { metadata: { permalink: string; post_id: string } } {
  return (
    typeof row.metadata?.permalink === "string" &&
    row.metadata.permalink.trim().length > 0 &&
    typeof row.metadata?.post_id === "string"
  );
}
