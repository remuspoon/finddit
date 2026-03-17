import { createClient } from "@supabase/supabase-js";


export async function getOpenAIEmbedding(query: string, openaiApiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      input: query,
      model: "text-embedding-3-small",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI embeddings error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { data?: { embedding?: number[] }[] };
  const embedding = data.data?.[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error("OpenAI embeddings response missing embedding array");
  }

  return embedding;
}

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
  const { matchThreshold = 0.7, matchCount = 5 } = options ?? {};

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    throw error;
  }

  return data as { permalink?: string }[];
}