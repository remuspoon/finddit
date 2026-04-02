import { createClient } from "@supabase/supabase-js";
import { VDBMatchResult, QueryEventPayload, SubredditConfig } from "./types.js";

export function getSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  return createClient(supabaseUrl, supabaseKey);
}

export async function getSubredditConfig(
  supabase: ReturnType<typeof getSupabaseClient>,
  subreddit: string
): Promise<SubredditConfig | null> {
  const { data, error } = await supabase
    .from("configs")
    .select("subreddit, vdb_name, analytics_url, cta_id, cta:cta_id(intro, setup, outro)")
    .eq("subreddit", subreddit)
    .single();

  if (error || !data) {
    return null;
  }

  return data as SubredditConfig;
}

export async function querySupabaseVDB(
  supabase: ReturnType<typeof getSupabaseClient>,
  embedding: number[],
  options?: {
    matchThreshold?: number;
    matchCount?: number;
  }
) {
  const { matchThreshold = 0.5, matchCount = 20 } = options ?? {};

  const { data, error } = await supabase.rpc("match_documents_mental_health", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    throw error;
  }

  return data as VDBMatchResult[];
}

export async function logQueryEvent(
  supabase: ReturnType<typeof getSupabaseClient>,
  data: QueryEventPayload
) {
  const { error } = await supabase.rpc("log_query_event", {
    p_trigger_post_id: data.triggerPostId,
    p_subreddit: data.subreddit,
    p_trigger_post_flair: data.triggerPostFlair,
    p_candidates_count: data.candidatesCount,
    p_deleted_count: data.deletedCount,
    p_valid_count: data.validCount,
    p_comment_posted: data.commentPosted,
    p_matches: data.matches,
  });

  if (error) {
    throw error;
  }
}

export async function tagDeletedSupabasePosts(
  supabase: ReturnType<typeof getSupabaseClient>,
  postIds: string[],
) {
  const { error } = await supabase.rpc("tag_deleted_posts_mental_health", {
    post_ids: postIds,
  });

  if (error) {
    throw error;
  }
}