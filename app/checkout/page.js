"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const router = useRouter();

  // load cart
  useEffect(() => {
    const cart = localStorage.getItem("cart");

    if (cart) {
      setItems(JSON.parse(cart));
    }
  }, []);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const checkout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Checkout success");

      localStorage.removeItem("cart");
      setItems([]);

      router.push("/scan");
    } else {
      alert(data.error);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>🧾 Checkout</h1>

      <table width="100%" border="1" cellPadding="10">
        <thead>
          <tr>
            <th align="left">Product</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan="4" align="center">
                No items
              </td>
            </tr>
          )}

          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td align="center">{item.price}</td>
              <td align="center">{item.qty}</td>
              <td align="center">{item.price * item.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 20 }}>Total: {total}</h2>

      <button
        onClick={checkout}
        style={{
          background: "black",
          color: "white",
          padding: "12px 25px",
          borderRadius: 8,
          marginTop: 20,
          cursor: "pointer",
        }}
      >
        💳 Pay
      </button>
    </div>
  );
}
