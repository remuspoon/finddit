import OpenAI from "openai";

export async function getOpenAIEmbedding(query: string, openaiApiKey: string): Promise<number[]> {
  const client = new OpenAI({ apiKey: openaiApiKey });

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
    dimensions: 512,
  });

  const embedding = response.data[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error("OpenAI embeddings response missing embedding array");
  }

  return embedding;
}
