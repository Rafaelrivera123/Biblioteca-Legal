const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || limitReached) return;

    const userMessage: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          documentName,
          documentId,
          history: messages.slice(-8),
        }),
      });
