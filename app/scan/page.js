"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Scanner from "@/components/Scanner";
import toast from "react-hot-toast";
export default function ScanPage() {
  const router = useRouter();

  const lastScanRef = useRef(0);
  const scanningRef = useRef(false);

  /* ADD ALERT STATE */
  const alertRef = useRef(false);

  const [cart, setCart] = useState([]);
  const [scanning, setScanning] = useState(false);

  /* =========================
     HANDLE SCAN
  ========================= */

  const handleScan = async (barcode) => {
    const now = Date.now();

    if (now - lastScanRef.current < 1500) return;
    lastScanRef.current = now;

    if (scanningRef.current) return;
    scanningRef.current = true;

    try {
      const res = await fetch(`/api/products?barcode=${barcode}`);
      const data = await res.json();

      if (!data.success) {
        if (!alertRef.current) {
          toast.error(data.error);
          alertRef.current = true;

          setTimeout(() => {
            alertRef.current = false;
          }, 1500);
        }

        scanningRef.current = false;
        return;
      }

      const product = data.product;

      setCart((prev) => {
        const existing = prev.find((p) => p.id === product.id);

        if (existing) {
          if (existing.qty + 1 > existing.stock) {
            if (!alertRef.current) {
              toast.error("Out of stock");
              alertRef.current = true;

              setTimeout(() => {
                alertRef.current = false;
              }, 1500);
            }

            return prev;
          }

          return prev.map((p) =>
            p.id === product.id ? { ...p, qty: p.qty + 1 } : p,
          );
        }

        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            stock: product.stock,
            qty: 1,
          },
        ];
      });
    } catch (err) {
      console.error(err);
    }

    scanningRef.current = false;
  };

  /* =========================
     CART FUNCTIONS
  ========================= */

  const increaseQty = (id) => {
    const item = cart.find((p) => p.id === id);

    if (item && item.qty + 1 > item.stock) {
      if (!alertRef.current) {
        toast.error("Out of stock");
        alertRef.current = true;

        setTimeout(() => {
          alertRef.current = false;
        }, 1200);
      }
      return;
    }

    setCart((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: p.qty + 1 } : p)),
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev.map((p) =>
        p.id === id && p.qty > 1 ? { ...p, qty: p.qty - 1 } : p,
      ),
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  /* =========================
     TOTAL
  ========================= */

  const total = cart.reduce((sum, p) => sum + Number(p.price) * p.qty, 0);

  /* =========================
     CHECKOUT
  ========================= */

  const goCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart empty");
      return;
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    router.push("/checkout");
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
        fontFamily: "Inter, Arial",
      }}
    >
      <h1 style={{ marginBottom: 30 }}>🛒 POS Scanner</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 30,
        }}
      >
        {/* LEFT - SCANNER */}

        <div
          style={{
            background: "white",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginBottom: 15 }}>📷 Scan Barcode</h2>

          <div
            style={{
              borderRadius: 10,
              overflow: "hidden",
              border: "2px solid #eee",
            }}
          >
            <Scanner onScan={handleScan} />
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginBottom: 20 }}>🧾 Invoice</h2>

          <div
            style={{
              maxHeight: 350,
              overflowY: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ padding: 12, textAlign: "left", width: "40%" }}>
                    Product
                  </th>

                  <th style={{ textAlign: "center", width: "15%" }}>Price</th>

                  <th style={{ textAlign: "center", width: "20%" }}>Qty</th>

                  <th style={{ textAlign: "center", width: "15%" }}>Total</th>

                  <th style={{ width: "10%" }}></th>
                </tr>
              </thead>

              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12 }}>{item.name}</td>

                    <td style={{ textAlign: "center" }}>${item.price}</td>

                    <td
                      style={{
                        textAlign: "center",
                        padding: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <button
                          onClick={() => decreaseQty(item.id)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            background: "white",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          -
                        </button>

                        <span
                          style={{
                            minWidth: 30,
                            display: "inline-block",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {item.qty}
                        </span>

                        <button
                          onClick={() => increaseQty(item.id)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            background: "white",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {item.price * item.qty}VNĐ
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          width: 30,
                          height: 30,
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 15,
              padding: 12,
              background: "#f1f5f9",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            <span>Total</span>
            <span>{total}VNĐ</span>
          </div>

          <button
            onClick={goCheckout}
            style={{
              width: "100%",
              marginTop: 15,
              padding: "14px",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
