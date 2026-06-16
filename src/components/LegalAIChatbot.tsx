"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Scale, Loader2, Minus, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
const SubscribeModal = dynamic(() => import("./subscribe-modal"), { ssr: false });

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
            className={cn(
              "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors",
              hasSubscription
                ? "bg-[#1E2A38] hover:bg-[#1E2A38]/90"
