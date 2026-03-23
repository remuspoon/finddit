import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  return createClient(supabaseUrl, supabaseKey);
}

export async function querySupabaseVDB(
  supabase: ReturnType<typeof getSupabaseClient>,
  embedding: number[],
  options?: {
    matchThreshold?: number;
    matchCount?: number;
  }
) {
  const { matchThreshold = 0.7, matchCount = 20 } = options ?? {};

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    throw error;
  }

  return data as { metadata?: { permalink?: string; post_id?: string } }[];
}
