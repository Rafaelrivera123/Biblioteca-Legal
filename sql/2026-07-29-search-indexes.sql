-- Índices para el buscador unificado (/api/search).
-- Ejecutar UNA VEZ contra la base de datos de Neon (SQL editor de Neon o psql).
-- Todas las sentencias son idempotentes (IF NOT EXISTS), se pueden correr de nuevo sin riesgo.

-- Ya deberían existir (se usan en similarity() y en el embedding), pero se
-- declaran aquí también por si esta base de datos se restaura desde cero.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- Búsqueda de leyes por título, número de decreto y descripción corta.
CREATE INDEX IF NOT EXISTS document_name_trgm_idx
  ON "Document" USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS document_law_number_trgm_idx
  ON "Document" USING GIN (law_number gin_trgm_ops);

CREATE INDEX IF NOT EXISTS document_short_description_trgm_idx
  ON "Document" USING GIN (short_description gin_trgm_ops);

-- Full-text search sobre el contenido real de cada artículo.
-- Este es el índice que faltaba: sin él, cualquier búsqueda por palabra o
-- frase dentro de un artículo obligaría a Postgres a leer cada fila una por
-- una (secuencial) en vez de usar un índice.
CREATE INDEX IF NOT EXISTS article_content_fts_idx
  ON "Article" USING GIN (to_tsvector('spanish', "contentPlainText"));

-- Búsqueda exacta por número de artículo en toda la biblioteca (antes solo
-- existía este lookup dentro de un documento a la vez, en el dashboard).
CREATE INDEX IF NOT EXISTS article_number_idx
  ON "Article" ("articleNumber");
