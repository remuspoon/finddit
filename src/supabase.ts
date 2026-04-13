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
    .select("subreddit, vdb_name, analytics_url, cta_id, match_threshold, match_count, cta:cta_id(blocks, max_links)")
    .eq("subreddit", subreddit)
    .single();

  if (error || !data) {
    return null;
  }
  // Supabase returns foreign key joins as an array or plain object depending on relationship type.
  const cta = Array.isArray(data.cta) ? data.cta[0] ?? null : data.cta ?? null;
  return { ...data, cta } as SubredditConfig;
}

export async function querySupabaseVDB(
  supabase: ReturnType<typeof getSupabaseClient>,
  embedding: number[],
  config: SubredditConfig,
) {

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: config.match_threshold,
    match_count: config.match_count,
    vdb_name: config.vdb_name,
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
    p_cta_id: data.ctaId,
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
  config: SubredditConfig,
) {
  const { error } = await supabase.rpc("tag_deleted_posts", {
    post_ids: postIds,
    vdb_name: config.vdb_name,
  });

  if (error) {
    throw error;
  }
}