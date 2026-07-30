const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

/**
 * Genera el embedding (768 dims) de un texto de consulta usando el mismo
 * modelo con el que se generaron los embeddings de cada Article
 * (ver /api/ai/generate-embeddings). Se usa tanto en el chat legal por
 * documento como en la búsqueda semántica global (/api/search).
 */
export async function getQueryEmbedding(query: string): Promise<number[]> {
  const res = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query.slice(0, 2000),
      dimensions: 768,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding error: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}
