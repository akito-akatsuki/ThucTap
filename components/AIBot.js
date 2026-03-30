"use client";

import { useEffect, useState } from "react";

export default function AIBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      /* lấy product */

      const productRes = await fetch("/api/products");
      const productJson = await productRes.json();
      const products = productJson.data || [];

      if (!products.length) {
        setMessages(["No products found"]);
        return;
      }

      /* gọi AI */

      const aiRes = await fetch("/api/ai/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products,
        }),
      });

      const aiJson = await aiRes.json();
      const ai = aiJson.data || [];

      if (!ai.length) {
        setMessages(["AI has no predictions yet"]);
        return;
      }

      /* tạo cảnh báo */

      const alerts = ai.map((p) => {
        if (p.daysLeft <= 3) {
          return `🚨 ${p.name} will run out in ${p.daysLeft} days`;
        }

        if (p.daysLeft <= 5) {
          return `⚠ ${p.name} low stock (${p.daysLeft} days left)`;
        }

        return `📈 ${p.name} predicted sales today: ${p.prediction?.[0]}`;
      });

      setMessages(alerts);
    } catch (err) {
      console.log("bot error", err);
      setMessages(["AI system unavailable"]);
    }
  };

  return (
    <>
      {/* CHAT BOX */}

      {open && (
        <div className="fixed bottom-24 right-5 w-[320px] bg-white dark:bg-slate-900 rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.2)] overflow-hidden z-50">
          <div className="flex items-center justify-between bg-blue-600 dark:bg-blue-500 text-white px-4 py-3 font-bold">
            AI Inventory Alerts
            <button
              onClick={() => setOpen(false)}
              className="bg-transparent border-none text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-3 max-h-[220px] overflow-y-auto bg-slate-50 dark:bg-slate-950">
            {messages.map((m, i) => (
              <div
                key={i}
                className="bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2 mb-2 text-sm text-slate-700 dark:text-slate-100"
              >
                🤖 {m}
              </div>
            ))}
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
