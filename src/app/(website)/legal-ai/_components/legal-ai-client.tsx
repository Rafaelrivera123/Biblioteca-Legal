"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Scale, Loader2, Paperclip, X, FileText, Image as ImageIcon, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  text: string;
  fileName?: string;
}

interface Props {
  isLoggedin: boolean;
  hasSubscription: boolean;
}

const DAILY_LIMIT = 20;

const LegalAiClient = ({ isLoggedin, hasSubscription }: Props) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hola, soy tu asistente legal con acceso a toda la legislación hondureña disponible en Biblioteca Legal HN. Puedes hacerme preguntas legales o subir un documento o imagen para análisis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number>(DAILY_LIMIT);
  const [limitReached, setLimitReached] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "pdf" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isFirstRender = useRef(true);

useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const isImage = selected.type.startsWith("image/");
    const isPdf = selected.type === "application/pdf";

    if (!isImage && !isPdf) {
      toast.error("Solo se permiten imágenes o PDFs");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error("El archivo no puede superar 5MB");
      return;
    }

    setFile(selected);
    setFileType(isImage ? "image" : "pdf");

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !file) || loading || limitReached) return;

    const userMessage: Message = {
      role: "user",
      text: text || (file ? `Analiza este archivo: ${file.name}` : ""),
      fileName: file?.name,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let body: FormData | string;
      let headers: Record<string, string> = {};

      if (file) {
        const formData = new FormData();
        formData.append("message", text || `Analiza este archivo`);
        formData.append("file", file);
        formData.append(
          "history",
          JSON.stringify(messages.slice(-8).map((m) => ({ role: m.role, text: m.text })))
        );
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          message: text,
          history: messages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
        });
      }

      const res = await fetch("/api/chat/legal-ai", {
        method: "POST",
        headers,
        body,
      });

      const data = await res.json();

      if (res.status === 429 || data.limitReached) {
        setLimitReached(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Has alcanzado tu límite de 20 consultas por hoy. Vuelve mañana para seguir consultando.",
          },
        ]);
        return;
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Ocurrió un error. Intenta de nuevo." },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      if (typeof data.remaining === "number") {
        setRemaining(data.remaining);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Ocurrió un error de conexión. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
      removeFile();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  if (!isLoggedin || !hasSubscription) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1E2A38]/10 flex items-center justify-center mb-6">
          <Scale className="w-8 h-8 text-[#1E2A38]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1E2A38] mb-3">Análisis Legal IA</h1>
        <p className="text-gray-500 max-w-md mb-2">
          Consulta toda la legislación hondureña disponible en Biblioteca Legal HN con inteligencia artificial.
        </p>
        <p className="text-gray-400 text-sm max-w-md mb-8">
          Esta función es exclusiva del Plan Personal. Obtén acceso ilimitado a leyes, códigos y decretos de Honduras.
        </p>
        <Button
          className="bg-[#1E2A38] text-white hover:bg-[#1E2A38]/90 rounded-full px-8"
          onClick={() => router.push("/subscriptions")}
        >
          Ver Plan Personal — USD $5.99/mes
        </Button>
        {!isLoggedin && (
          <p className="mt-4 text-sm text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <span
              className="text-[#1E2A38] cursor-pointer underline"
              onClick={() => router.push("/login")}
            >
              Inicia sesión
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-4 bg-white shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1E2A38]/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-[#1E2A38]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#1E2A38] leading-none">
              Análisis Legal IA
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Basado en la legislación hondureña de Biblioteca Legal HN
            </p>
          </div>
          <div className="ml-auto text-xs text-gray-400">
            {remaining} / {DAILY_LIMIT} consultas hoy
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[#1E2A38]/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Scale className="w-3.5 h-3.5 text-[#1E2A38]" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] text-[14px] leading-relaxed px-4 py-3 rounded-2xl",
                  msg.role === "user"
                    ? "bg-[#1E2A38] text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                )}
              >
                {msg.fileName && (
                  <div className="flex items-center gap-1 mb-2 text-xs opacity-70">
                    <FileText className="w-3 h-3" />
                    {msg.fileName}
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-[#1E2A38]/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Scale className="w-3.5 h-3.5 text-[#1E2A38]" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-white px-4 py-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          {file && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
              >
                {fileType === "image" && filePreview ? (
                  <img src={filePreview} alt="preview" className="w-8 h-8 rounded object-cover" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-500" />
                )}
                <span className="text-xs text-gray-600 flex-1 truncate">{file.name}</span>
                <button onClick={removeFile} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            </AnimatePresence>
          )}

          {limitReached ? (
            <p className="text-center text-sm text-gray-400 py-2">
              Límite diario alcanzado. Vuelve mañana.
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-400 hover:text-[#1E2A38] transition-colors p-2 shrink-0"
                aria-label="Subir archivo"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta sobre legislación hondureña o sube un documento..."
                rows={1}
                className="flex-1 resize-none text-[14px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#1E2A38]/40 transition-colors max-h-[120px] overflow-y-auto"
                style={{ lineHeight: "1.5" }}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !file)}
                size="icon"
                className="bg-[#1E2A38] hover:bg-[#1E2A38]/90 shrink-0 w-10 h-10 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalAiClient;
