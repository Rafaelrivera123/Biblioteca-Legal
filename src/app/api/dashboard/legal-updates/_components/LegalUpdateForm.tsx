"use client";

import { useRef } from "react";
import { createLegalUpdate, updateLegalUpdate } from "../actions";

type Document = { id: string; name: string };

type Post = {
  id: string;
  title: string;
  summary: string;
  type: "REFORM" | "NEW_LAW" | "REPEAL";
  gacetaNumber: string | null;
  content: string;
  status: string;
  relatedDocumentId: string | null;
};

type Props = { documents: Document[]; post?: Post };

export function LegalUpdateForm({ documents, post }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = post ? updateLegalUpdate.bind(null, post.id) : createLegalUpdate;

  return (
    <form ref={formRef} action={action} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1.5">Tipo</label>
        <select
          name="type"
          defaultValue={post?.type ?? "REFORM"}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          required
        >
          <option value="REFORM">Reforma</option>
          <option value="NEW_LAW">Nueva Ley</option>
          <option value="REPEAL">Derogación</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Título</label>
        <input
          name="title"
          defaultValue={post?.title}
          placeholder="Ej: Reforma al Artículo 99 de la Ley de Tránsito"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Resumen</label>
        <textarea
          name="summary"
          defaultValue={post?.summary}
          rows={3}
          placeholder="Descripción breve visible en la lista de actualizaciones"
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Número de Gaceta <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <input
          name="gacetaNumber"
          defaultValue={post?.gacetaNumber ?? ""}
          placeholder="Ej: 37,169"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Contenido (HTML)</label>
        <textarea
          name="content"
          defaultValue={post?.content}
          rows={14}
          placeholder="<p>El Decreto 31-2026 publicado en La Gaceta N° 37,099 reforma el artículo 99...</p>"
          className="w-full border rounded-lg px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Puedes usar etiquetas HTML: &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
        </p>
      </div>

      {documents.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Documento relacionado <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            name="relatedDocumentId"
            defaultValue={post?.relatedDocumentId ?? ""}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Sin documento relacionado</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Estado</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="status" value="draft" defaultChecked={!post || post.status === "draft"} className="accent-primary" />
            Borrador
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="status" value="published" defaultChecked={post?.status === "published"} className="accent-primary" />
            Publicado
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          {post ? "Guardar cambios" : "Crear actualización"}
        </button>
        <a href="/dashboard/legal-updates" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Cancelar
        </a>
      </div>
    </form>
  );
}
