"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase"; // 🔥 THÊM

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  const router = useRouter();

  /* =========================
     LOAD CART
  ========================= */
  useEffect(() => {
    const cart = localStorage.getItem("cart");
    if (cart) setItems(JSON.parse(cart));
  }, []);

  /* =========================
     TOTAL
  ========================= */
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  /* =========================
     CHECKOUT (FIXED)
  ========================= */
  const checkout = async () => {
    if (loading) return;

    setLoading(true);

    try {
      // 🔥 LẤY USER TỪ CLIENT
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          user: user
            ? {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name,
              }
            : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Checkout success");

        localStorage.removeItem("cart");
        setItems([]);

        router.push("/scan");
      } else {
        toast.error(data.error || "Checkout failed");
      }
    } catch (err) {
      console.log(err);
      toast.error("Checkout failed");
    }

    setLoading(false);
  };

  /* =========================
     STYLES
  ========================= */
  const btn = {
    flex: 1,
    padding: "14px",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    background: "#16a34a",
    cursor: "pointer",
  };

  const qrModal = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  };

  const qrBox = {
    background: "white",
    padding: 30,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 15,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  };

  /* =========================
     UI
  ========================= */
  return (
    <div
      style={{
        padding: 40,
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "auto",
          background: "white",
          padding: 25,
          borderRadius: 12,
          boxShadow: "0 3px 15px rgba(0,0,0,0.05)",
        }}
      >
        <h1 style={{ marginBottom: 20 }}>🧾 Checkout</h1>

        {loading && (
          <div
            style={{ display: "flex", justifyContent: "center", margin: 20 }}
          >
            <div className="loader" />
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ textAlign: "left", padding: 12 }}>Product</th>
              <th style={{ textAlign: "center" }}>Price</th>
              <th style={{ textAlign: "center" }}>Qty</th>
              <th style={{ textAlign: "center" }}>Total</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: 30 }}>
                  Cart empty
                </td>
              </tr>
            )}

            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 12 }}>{item.name}</td>
                <td style={{ textAlign: "center" }}>{item.price}VNĐ</td>
                <td style={{ textAlign: "center" }}>{item.qty}</td>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>
                  {item.price * item.qty}VNĐ
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            marginTop: 20,
            padding: 15,
            background: "#f1f5f9",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          <span>Total</span>
          <span>{total}VNĐ</span>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            disabled={loading}
            onClick={() => {
              setPaymentMethod("cash");
              checkout();
            }}
            style={btn}
          >
            {loading ? "Processing..." : "💵 Cash"}
          </button>

          <button onClick={() => setPaymentMethod("qr")} style={btn}>
            📱 QR Pay
          </button>

          <button
            disabled={loading}
            onClick={() => {
              setPaymentMethod("card");
              checkout();
            }}
            style={{ ...btn, background: "#7c3aed" }}
          >
            {loading ? "Processing..." : "💳 Card"}
          </button>
        </div>

        {paymentMethod === "qr" && (
          <div style={qrModal}>
            <div style={qrBox}>
              <h2>Scan to Pay</h2>

              <img
                src={`https://img.vietqr.io/image/VCB-1018309045-compact.png?amount=${total}`}
                width="220"
              />

              <p style={{ fontWeight: "bold" }}>Total: {total}VNĐ</p>

              <button onClick={checkout} style={btn} disabled={loading}>
                {loading ? "Processing..." : "✓ Confirm Payment"}
              </button>

              <button
                onClick={() => setPaymentMethod(null)}
                style={{ ...btn, background: "#94a3b8" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .loader {
          width: 20px;
          padding: 4px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: white;

          --_m:
            conic-gradient(#0000 10%, #000),
            linear-gradient(#000 0 0) content-box;

          -webkit-mask: var(--_m);
          mask: var(--_m);

          -webkit-mask-composite: source-out;
          mask-composite: subtract;

          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          to {
            transform: rotate(1turn);
          }
        }
      `}</style>
    </div>
  );
}
