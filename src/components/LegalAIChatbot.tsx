"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Scale, Loader2, Minus, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
const SubscribeModal = dynamic(() => import("@/app/(website)/collections/[id]/_components/subscribe-modal"), { ssr: false });

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  isLoggedin: boolean;
  hasSubscription: boolean;
}

const DAILY_LIMIT = 20;

const LegalAIChatbot = ({ isLoggedin, hasSubscription }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(DAILY_LIMIT);
  const [limitReached, setLimitReached] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: "Hola, soy tu asistente legal con acceso a toda la legislación hondureña disponible en Biblioteca Legal HN. Puedes hacerme preguntas legales sobre cualquier rama del derecho hondureño.",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isMinimized && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const lastMessage = container.lastElementChild;
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [messages, isMinimized]);

  const handleOpen = () => {
    if (!hasSubscription) {
      setShowSubscribeModal(true);
      return;
    }
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleMinimize = () => setIsMinimized((prev) => !prev);

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || limitReached) return;

    const userMessage: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/legal-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
        }),
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

      if (res.status === 401 || res.status === 403) {
        setShowSubscribeModal(true);
        setMessages((prev) => prev.slice(0, -1));
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
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">$1</a>')
      .replace(/\n/g, "<br/>");
  };

  return (
    <>
      <SubscribeModal
        open={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
      />

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#1E2A38] hover:bg-[#1E2A38]/90 transition-colors rounded-2xl shadow-xl px-4 py-3"
            aria-label="Abrir asistente legal IA"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-white font-semibold text-[13px] leading-none">
                  Asistente Legal IA
                </p>
                <Sparkles className="w-3 h-3 text-purple-300" />
              </div>
              <p className="text-white/60 text-[11px] mt-1 leading-tight max-w-[160px]">
                Consulta cualquier ley hondureña al instante
              </p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[340px] bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col overflow-hidden"
            style={{ height: isMinimized ? "56px" : "500px", transition: "height 0.2s ease" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1E2A38]/10 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-[#1E2A38]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1E2A38] leading-none">
                    Asistente Legal IA
                  </p>
                  {!isMinimized && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Basado en la legislación hondureña de Biblioteca Legal HN
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMinimize}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label={isMinimized ? "Expandir chat" : "Minimizar chat"}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Cerrar chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border-b border-purple-100">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <p className="text-[11px] text-purple-700">
                    Acceso a toda la legislación hondureña disponible
                  </p>
                </div>

                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
                >
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-full bg-[#1E2A38]/10 flex items-center justify-center shrink-0 mr-2 mt-1">
                          <Scale className="w-3 h-3 text-[#1E2A38]" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] text-[13px] leading-relaxed px-3 py-2 rounded-xl",
                          msg.role === "user"
                            ? "bg-[#1E2A38] text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        )}
                        dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
                      />
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="w-6 h-6 rounded-full bg-[#1E2A38]/10 flex items-center justify-center shrink-0 mr-2 mt-1">
                        <Scale className="w-3 h-3 text-[#1E2A38]" />
                      </div>
                      <div className="bg-gray-100 rounded-xl rounded-bl-sm px-3 py-2">
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-3 py-3 border-t border-gray-100 shrink-0">
                  {limitReached ? (
                    <p className="text-center text-[12px] text-gray-400 py-1">
                      Límite diario alcanzado. Vuelve mañana.
                    </p>
                  ) : (
                    <div className="flex items-end gap-2">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pregunta sobre legislación hondureña..."
                        rows={1}
                        className="flex-1 resize-none text-[13px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#1E2A38]/40 transition-colors max-h-[100px] overflow-y-auto"
                        style={{ lineHeight: "1.5" }}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        size="icon"
                        className="bg-[#1E2A38] hover:bg-[#1E2A38]/90 shrink-0 w-9 h-9 rounded-xl"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {!limitReached && hasSubscription && remaining !== null && (
                    <p className="text-right text-[11px] text-gray-400 mt-1">
                      {remaining} / {DAILY_LIMIT} consultas hoy
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LegalAIChatbot;
