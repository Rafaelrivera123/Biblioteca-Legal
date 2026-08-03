const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { embedding: number[]; expiresAt: number };
const embeddingCache = new Map<string, CacheEntry>();

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().slice(0, 2000);
}

/**
 * Generates a 768-dim query embedding with a short in-memory cache so repeat
 * chat questions do not re-hit OpenAI on every turn.
 */
export async function getQueryEmbedding(query: string): Promise<number[]> {
  const key = normalizeQuery(query);
  const cached = embeddingCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.embedding;
  }

  const res = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: key,
      dimensions: 768,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding error: ${err}`);
  }

  const data = await res.json();
  const embedding = data.data[0].embedding as number[];
  embeddingCache.set(key, {
    embedding,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return embedding;
}
