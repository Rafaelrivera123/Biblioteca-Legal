"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface Change {
  article_number: number;
  section: string;
  chapter: string;
  change_description: string;
  source: string;
}

interface DocumentResult {
  id: string;
  name: string;
  law_number: string;
  slug: string;
  updatedAt: string;
  up_to_date: boolean;
  changes: Change[];
  summary: string;
}

export default function ValidatePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DocumentResult[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleValidate = async () => {
    setLoading(true);
    setDone(false);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/validate-documents");
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setDone(true);
      } else {
        setError("Ocurrió un error al validar los documentos.");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const upToDate = results.filter((r) => r.up_to_date);
  const outdated = results.filter((r) => !r.up_to_date);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Validación de Documentos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verifica si tus leyes están al día con la legislación hondureña
            actual.
          </p>
        </div>
        <Button
          onClick={handleValidate}
          disabled={loading}
          className="bg-primary"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validando...
            </>
          ) : (
            "Validar ahora"
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 mb-4">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p>Analizando documentos con inteligencia artificial...</p>
          <p className="text-sm mt-1">Esto puede tardar varios minutos.</p>
        </div>
      )}

      {done && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="border-green-500">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {upToDate.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Al día</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-500">
              <CardContent className="p-4 flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-500">
                    {outdated.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Necesitan actualización
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {outdated.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-red-500 mb-3">
                Documentos que necesitan actualización
              </h2>
              <div className="space-y-4">
                {outdated.map((doc) => (
                  <Card key={doc.id} className="border-red-400">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold text-primary">
                          {doc.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {doc.law_number}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {doc.summary}
                      </p>
                      {doc.changes.length > 0 && (
                        <div className="space-y-2">
                          {doc.changes.map((change, i) => (
                            <div
                              key={i}
                              className="bg-muted rounded-md p-3 text-sm"
                            >
                              <p className="font-medium text-primary">
                                Artículo {change.article_number} — {change.section} / {change.chapter}
                              </p>
                              <p className="text-muted-foreground mt-1">
                                {change.change_description}
                              </p>
                              {change.source && (
                                <p className="text-xs text-blue-400 mt-1">
                                  Fuente: {change.source}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {upToDate.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-green-500 mb-3">
                Documentos al día
              </h2>
              <div className="space-y-2">
                {upToDate.map((doc) => (
                  <Card key={doc.id} className="border-green-400">
                    <CardContent className="p-3 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-primary">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.summary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
