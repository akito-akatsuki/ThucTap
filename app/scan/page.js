"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Scanner from "@/components/Scanner";

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
          alert(data.error);
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
              alert("Out of stock");
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
    setCart((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          if (p.qty + 1 > p.stock) {
            if (!alertRef.current) {
              alert("Out of stock");
              alertRef.current = true;

              setTimeout(() => {
                alertRef.current = false;
              }, 1200);
            }

            return p;
          }

          return { ...p, qty: p.qty + 1 };
        }

        return p;
      }),
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
      alert("Cart empty");
      return;
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    router.push("/checkout");
  };

  /* =========================
     UI
  ========================= */

  return (
    <>
      <div style={{ padding: 30, fontFamily: "Arial" }}>
        <h2>📷 Scan Barcode</h2>

        <div
          style={{
            width: 320,
            margin: "20px auto",
            borderRadius: 10,
            overflow: "hidden",
            border: "2px solid #eee",
          }}
        >
          <Scanner onScan={handleScan} />
        </div>

        <h2>🧾 Invoice</h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            background: "white",
          }}
        >
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
              <th style={{ padding: 12, textAlign: "left", width: "40%" }}>
                Product
              </th>

              <th style={{ width: "15%", textAlign: "center" }}>Price</th>

              <th style={{ width: "20%", textAlign: "center" }}>Qty</th>

              <th style={{ width: "15%", textAlign: "center" }}>Total</th>

              <th style={{ width: "10%" }}></th>
            </tr>
          </thead>

          <tbody>
            {cart.map((item) => (
              <tr key={item.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 12 }}>{item.name}</td>

                <td style={{ textAlign: "center" }}>${item.price}</td>

                <td
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
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      border: "1px solid #ddd",
                      cursor: "pointer",
                    }}
                  >
                    -
                  </button>

                  <span
                    style={{
                      width: 40,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {item.qty}
                  </span>

                  <button
                    onClick={() => increaseQty(item.id)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      border: "1px solid #ddd",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </td>

                <td style={{ textAlign: "center" }}>
                  ${item.price * item.qty}
                </td>

                <td style={{ textAlign: "center" }}>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={{ marginTop: 20 }}>Total: ${total}</h2>

        <button
          onClick={goCheckout}
          style={{
            marginTop: 20,
            padding: "12px 25px",
            background: "green",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Checkout
        </button>
      </div>
    </>
  );
}
