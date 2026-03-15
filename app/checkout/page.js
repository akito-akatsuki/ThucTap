"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /* =========================
     LOAD CART
  ========================= */

  useEffect(() => {
    const cart = localStorage.getItem("cart");

    if (cart) {
      setItems(JSON.parse(cart));
    }
  }, []);

  /* =========================
     TOTAL
  ========================= */

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  /* =========================
     CHECKOUT
  ========================= */

  const checkout = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Checkout success");

        localStorage.removeItem("cart");
        setItems([]);

        router.push("/scan");
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Checkout failed");
    }

    setLoading(false);
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

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ textAlign: "left", padding: 12, width: "40%" }}>
                Product
              </th>

              <th style={{ textAlign: "center", width: "20%" }}>Price</th>

              <th style={{ textAlign: "center", width: "20%" }}>Qty</th>

              <th style={{ textAlign: "center", width: "20%" }}>Total</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: 30,
                    color: "#888",
                  }}
                >
                  Cart empty
                </td>
              </tr>
            )}

            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 12 }}>{item.name}</td>

                <td style={{ textAlign: "center" }}>${item.price}</td>

                <td style={{ textAlign: "center" }}>{item.qty}</td>

                <td style={{ textAlign: "center", fontWeight: "bold" }}>
                  ${item.price * item.qty}
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
          <span>${total}</span>
        </div>

        <button
          onClick={checkout}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "14px",
            background: loading ? "#94a3b8" : "#16a34a",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          {loading ? (
            <>
              <div className="loader"></div>
              Processing...
            </>
          ) : (
            "💳 Pay Now"
          )}
        </button>
      </div>

      {/* Loader CSS */}

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
