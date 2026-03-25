// A raw match returned from the Supabase vector DB
export interface VDBMatchResult {
  similarity?: number;
  metadata?: {
    permalink?: string;
    post_id?: string;
  };
}

// A candidate that has passed the permalink/post_id validation filter
export interface MatchCandidate {
  similarity: number;
  post_id: string;
  permalink: string;
}

// The outcome of a candidate after checking it against the Reddit API
export type MatchStatus = "valid" | "deleted" | "overflow";

export interface MatchLogEntry {
  post_id: string;
  permalink: string;
  similarity: number;
  status: MatchStatus;
}

// A link that passed all filters and will be included in the comment
export interface ValidLink {
  title: string;
  url: string;
  similarity: number;
}

// Payload sent to the log_query_event RPC
export interface QueryEventPayload {
  triggerPostId: string;
  triggerPostFlair: string | null;
  candidatesCount: number;
  deletedCount: number;
  validCount: number;
  commentPosted: boolean;
  matches: MatchLogEntry[];
}
