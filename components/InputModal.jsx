"use client";

import { useState } from "react";

export default function InputModal({ type, product, onClose, onSubmit }) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price || "");
  const [minStock, setMinStock] = useState(product?.min_stock || 5);
  const [qty, setQty] = useState("");

  const submit = () => {
    if (type === "edit") {
      if (!name.trim()) {
        toast.error("Enter product name");
        return;
      }

      if (isNaN(price)) {
        toast.error("Price must be a number");
        return;
      }

      onSubmit({
        name,
        price: Number(price),
        min_stock: Number(minStock),
      });
    }

    if (type === "import") {
      if (!qty) {
        toast.error("Enter quantity");
        return;
      }

      if (isNaN(qty)) {
        toast.error("Quantity must be a number");
        return;
      }

      onSubmit({
        qty: Number(qty),
      });
    }
  };

  return (
    <div style={overlay}>
      <form
        style={modal}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h3>{type === "edit" ? "Edit Product" : "Import Stock"}</h3>

        {type === "edit" && (
          <>
            {" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                gap: "12px 10px",
                alignItems: "center",
              }}
            >
              <span>Name:</span>
              <input
                placeholder="Product name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={input}
              />

              <span>Price:</span>
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={input}
              />

              <span>Min stock:</span>
              <input
                type="number"
                placeholder="Minimum stock"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                style={input}
              />
            </div>
          </>
        )}

        {type === "import" && (
          <input
            type="number"
            placeholder="Quantity"
            autoFocus
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            style={input}
          />
        )}

        <div style={actions}>
          <button type="submit" style={saveBtn}>
            Save
          </button>

          <button type="button" onClick={onClose} style={cancelBtn}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/* STYLE */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modal = {
  background: "white",
  padding: 30,
  borderRadius: 10,
  width: 320,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const input = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  boxSizing: "border-box",
};

const actions = {
  display: "flex",
  gap: 10,
  marginTop: 10,
};

const saveBtn = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};

const cancelBtn = {
  background: "#aaa",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};
