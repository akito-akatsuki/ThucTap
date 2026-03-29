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
        <div style={chatBox}>
          <div style={chatHeader}>
            AI Inventory Alerts
            <button onClick={() => setOpen(false)} style={closeBtn}>
              ✕
            </button>
          </div>

          <div style={chatBody}>
            {messages.map((m, i) => (
              <div key={i} style={message}>
                🤖 {m}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOT BUTTON */}

      <button onClick={() => setOpen(!open)} style={botButton}>
        🤖
      </button>
    </>
  );
}

/* STYLE */

const botButton = {
  position: "fixed",
  bottom: 20,
  right: 20,
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: "#2563eb",
  color: "white",
  fontSize: 26,
  border: "none",
  cursor: "pointer",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
};

const chatBox = {
  position: "fixed",
  bottom: 90,
  right: 20,
  width: 320,
  background: "white",
  borderRadius: 10,
  boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
  overflow: "hidden",
};

const chatHeader = {
  background: "#2563eb",
  color: "white",
  padding: 12,
  fontWeight: "bold",
  display: "flex",
  justifyContent: "space-between",
};

const chatBody = {
  padding: 12,
  maxHeight: 220,
  overflowY: "auto",
};

const message = {
  background: "#f1f5f9",
  padding: 8,
  borderRadius: 6,
  marginBottom: 6,
  fontSize: 14,
};

const closeBtn = {
  background: "transparent",
  border: "none",
  color: "white",
  cursor: "pointer",
};
