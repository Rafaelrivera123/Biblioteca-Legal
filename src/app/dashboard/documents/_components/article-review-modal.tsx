"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface Article {
  id: string;
  articleNumber: number;
  articleLabel: string | null;
  display: string;
  section: string;
  chapter: string;
}

interface Props {
  documentId: string;
  documentName: string;
  open: boolean;
  onClose: () => void;
}

const ArticleReviewModal = ({ documentId, documentName, open, onClose }: Props) => {
  const { data, isLoading } = useQuery<{ success: boolean; data: Article[] }>({
    queryKey: ["articles-review", documentId],
    queryFn: () =>
      fetch(`/api/documents/${documentId}/articles`).then((res) => res.json()),
    enabled: open && !!documentId,
  });

  const articles = data?.data ?? [];

  // Detectar saltos en numeración
  const issues: string[] = [];
  const numbers = articles.map((a) => a.articleNumber);
  for (let i = 1; i < numbers.length; i++) {
    const prev = numbers[i - 1];
    const curr = numbers[i];
    if (curr - prev > 1) {
      issues.push(`Salto detectado: después del artículo ${prev} viene el ${curr}`);
    }
  }

  // Agrupar por sección
  const grouped = articles.reduce((acc, article) => {
    const key = article.section;
    if (!acc[key]) acc[key] = [];
    acc[key].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-[20px]">
            Revisión de artículos — {documentName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen */}
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div className="text-[28px] font-bold text-primary">{articles.length}</div>
              <div className="text-gray-500 text-[14px]">artículos en total</div>
              {issues.length === 0 ? (
                <div className="ml-auto flex items-center gap-2 text-green-600 text-[13px]">
                  <CheckCircle size={16} />
                  Sin problemas detectados
                </div>
              ) : (
                <div className="ml-auto flex items-center gap-2 text-red-500 text-[13px]">
                  <AlertTriangle size={16} />
                  {issues.length} problema(s) detectado(s)
                </div>
              )}
            </div>

            {/* Problemas */}
            {issues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-red-600 text-[14px] flex items-center gap-2">
                  <AlertTriangle size={16} /> Posibles artículos faltantes
                </p>
                {issues.map((issue, i) => (
                  <p key={i} className="text-[13px] text-red-500">{issue}</p>
                ))}
                <p className="text-[12px] text-red-400 mt-2">
                  Si hay artículos con sufijo (ej: 29-A, 29-B) pueden causar saltos. Verifica abajo si están correctamente etiquetados.
                </p>
              </div>
            )}

            {/* Lista por sección */}
            {Object.entries(grouped).map(([section, sectionArticles]) => (
              <div key={section}>
                <p className="font-semibold text-primary text-[14px] mb-2 border-b pb-1">{section}</p>
                <div className="flex flex-wrap gap-2">
                  {sectionArticles.map((article) => (
                    <span
                      key={article.id}
                      className={`px-2 py-1 rounded text-[12px] font-medium border ${
                        article.articleLabel
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      Art. {article.display}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={onClose} className="text-primary hover:text-primary/80">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ArticleReviewModal;
