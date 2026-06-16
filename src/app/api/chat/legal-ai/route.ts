async function detectDocumentFromQuery(
  query: string,
  history: { role: string; text: string }[]
): Promise<string | null> {
  try {
    // Solo usar el mensaje actual para detectar el documento
    // El historial contaminaba la detección con documentos de mensajes anteriores
    const contextToSearch = query;

    const documents = await prisma.document.findMany({
      select: { id: true, name: true, slug: true },
    });

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "");

    const contextNorm = normalize(contextToSearch);

    let bestMatch: { id: string; score: number } | null = null;

    for (const doc of documents) {
      const nameNorm = normalize(doc.name);
      const nameWords = nameNorm.split(" ").filter((w) => w.length > 3);
      if (nameWords.length === 0) continue;

      const matchCount = nameWords.filter((w) => contextNorm.includes(w)).length;
      const score = matchCount / nameWords.length;

      if (score >= 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { id: doc.id, score };
      }
    }

    if (bestMatch) {
      console.log("[legal-ai] document detected:", bestMatch.id, "score:", bestMatch.score);
      return bestMatch.id;
    }

    return null;
  } catch (err) {
    console.error("[legal-ai] detectDocumentFromQuery error:", err);
    return null;
  }
}
