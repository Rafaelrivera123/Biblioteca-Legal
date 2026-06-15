"use client";
import { deleteLegalUpdate } from "@/actions/legal-update/delete";
import { publishLegalUpdate } from "@/actions/legal-update/publish";
import { regenerateReformWithGaceta } from "@/actions/legal-update/regenerate-with-gaceta";
import { unpublishLegalUpdate } from "@/actions/legal-update/unpublish";
import { updateLegalUpdate } from "@/actions/legal-update/update";
import AlertModal from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LegalUpdatePost, LegalUpdateType } from "@prisma/client";
import { Pencil, Trash, Eye, EyeOff, FileUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
const TYPE_LABEL: Record<LegalUpdateType, string> = {
  REFORM: "Reforma",
  NEW_LAW: "Nueva Ley",
  REPEAL: "Derogación",
};
interface Props {
  data: LegalUpdatePost & { relatedDocument: { name: string } | null };
}
const LegalUpdateCard = ({ data }: Props) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [gacetaOpen, setGacetaOpen] = useState(false);
  const [title, setTitle] = useState(data.title);
  const [summary, setSummary] = useState(data.summary);
  const [content, setContent] = useState(data.content);
  const [pending, startTransition] = useTransition();
  const [uploadingGaceta, setUploadingGaceta] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPublished = data.status === "published";
  const canUploadGaceta =
    data.type === "REFORM" && !!data.relatedDocumentId;
  const onDelete = () => {
    startTransition(() => {
      deleteLegalUpdate(data.id).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message);
        setDeleteOpen(false);
      });
    });
  };
  const onTogglePublish = () => {
    startTransition(() => {
      const action = isPublished
        ? unpublishLegalUpdate(data.id)
        : publishLegalUpdate(data.id);
      action.then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message);
      });
    });
  };
  const onSaveEdit = () => {
    startTransition(() => {
      updateLegalUpdate({ id: data.id, title, summary, content }).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message);
        setEditOpen(false);
      });
    });
  };
  const onSelectGacetaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Selecciona un archivo PDF.");
      return;
    }
    setUploadingGaceta(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const extractRes = await fetch("/api/legal-updates/extract-pdf", {
        method: "POST",
        body: formData,
      });
      const extractData = await extractRes.json();
      if (!extractRes.ok || !extractData.success) {
        toast.error(extractData.error ?? "No se pudo leer el PDF.");
        return;
      }
      const result = await regenerateReformWithGaceta(data.id, extractData.text);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setGacetaOpen(false);
    } catch {
      toast.error("Ocurrió un error procesando el PDF.");
    } finally {
      setUploadingGaceta(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  return (
    <>
      <div className="border-[1px] border-[#1E2A3866]/40 py-[15px] px-[20px] rounded-[8px] bg-white flex items-center justify-between gap-x-[20px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-primary/30 text-primary">
              {TYPE_LABEL[data.type]}
            </span>
            {data.gacetaNumber && (
              <span className="text-[11px] text-muted-foreground">
                La Gaceta N° {data.gacetaNumber}
              </span>
            )}
            <span
              className={
                isPublished
                  ? "text-[11px] font-semibold text-green-600"
                  : "text-[11px] font-semibold text-amber-600"
              }
            >
              {isPublished ? "Publicado" : "Borrador"}
            </span>
          </div>
          <p className="font-medium truncate">{data.title}</p>
          <p className="text-sm text-muted-foreground truncate">{data.summary}</p>
          {data.relatedDocument && (
            <p className="text-[11px] text-primary mt-1">
              Relacionado: {data.relatedDocument.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-x-1 shrink-0">
          {canUploadGaceta && (
            <Button
              size="icon"
              variant="link"
              title="Subir Gaceta (PDF)"
              onClick={() => setGacetaOpen(true)}
            >
              <FileUp />
            </Button>
          )}
          <Button size="icon" variant="link" title="Ver / Vista previa" asChild>
            <Link href={`/actualizaciones/${data.slug}`} target="_blank">
              <Eye />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="link"
            title={isPublished ? "Despublicar" : "Publicar"}
            onClick={onTogglePublish}
            disabled={pending}
          >
            {isPublished ? <EyeOff /> : <Eye />}
          </Button>
          <Button size="icon" variant="link" title="Editar" onClick={() => setEditOpen(true)}>
            <Pencil />
          </Button>
          <Button
            size="icon"
            variant="link"
            title="Eliminar"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash className="text-rose-500" />
          </Button>
        </div>
      </div>
      <AlertModal
        isOpen={deleteOpen}
        loading={pending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
      />
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar actualización legal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Resumen</label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Contenido (HTML)
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onSaveEdit} disabled={pending}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={gacetaOpen} onOpenChange={setGacetaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir La Gaceta (PDF)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sube el PDF de La Gaceta que contiene esta reforma. El sistema buscará el
              texto actual de cada artículo en la biblioteca y generará el &quot;antes&quot;
              y &quot;después&quot; comparando con el contenido del PDF.
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={onSelectGacetaFile}
              disabled={uploadingGaceta}
            />
            {uploadingGaceta && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando PDF, esto puede tardar un momento...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGacetaOpen(false)}
              disabled={uploadingGaceta}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default LegalUpdateCard;
