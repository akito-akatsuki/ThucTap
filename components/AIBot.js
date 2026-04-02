"use client";

import { useState, useRef, useEffect } from "react";

export default function AIBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  /* ========================
  AUTO SCROLL
  ======================== */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ========================
  SEND MESSAGE
  ======================== */
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;

    // add user message
    setMessages((prev) => [...prev, { role: "user", text: userText }]);

    setInput("");
    setLoading(true);

    try {
      /* ===== GET CONTEXT ===== */
      const productRes = await fetch("/api/products");
      const productJson = await productRes.json();

      const context = {
        products: productJson.data || [],
      };

      /* ===== CALL AI ===== */
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          context, // ✅ FIX: gửi context
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.reply || "No response",
        },
      ]);
    } catch (err) {
      console.log("AI error:", err);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "⚠ AI is unavailable",
        },
      ]);
    }

    setLoading(false);
  };

  /* ========================
  ENTER TO SEND
  ======================== */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <>
      {/* CHAT BOX */}
      {open && (
        <div className="fixed bottom-24 right-5 w-[340px] bg-white dark:bg-slate-900 rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.2)] overflow-hidden z-50 flex flex-col">
          {/* HEADER */}
          <div className="flex items-center justify-between bg-blue-600 dark:bg-blue-500 text-white px-4 py-3 font-bold">
            AI Assistant
            <button
              onClick={() => setOpen(false)}
              className="bg-transparent border-none text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 p-3 max-h-[300px] overflow-y-auto bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 && (
              <div className="text-sm text-gray-400">
                🤖 Ask me about inventory, stock, revenue...
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-2 text-sm ${
                  m.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block px-3 py-2 rounded-xl whitespace-pre-line leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* LOADING */}
            {loading && (
              <div className="text-left text-sm text-gray-400">
                🤖 Thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="flex border-t p-2 bg-white dark:bg-slate-900">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI..."
              className="flex-1 px-2 py-1 rounded border dark:bg-slate-800 dark:border-slate-600 text-sm"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="ml-2 px-3 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* BOT BUTTON */}
      <button
        className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-2xl border-none cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
        onClick={() => setOpen(!open)}
      >
        🤖
      </button>
    </>
  );
}
