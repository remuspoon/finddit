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
