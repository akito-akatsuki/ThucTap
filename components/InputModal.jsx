"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function InputModal({ type, product, onClose, onSubmit }) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price || "");
  const [minStock, setMinStock] = useState(product?.min_stock || 5);
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState(product?.category_id || "");
  const [categories, setCategories] = useState([]);

  /* LOAD CATEGORIES */
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/categories");
      const json = await res.json();
      setCategories(json.data || []);
    };

    load();
  }, []);

  /* =========================
     SUBMIT (FIXED)
  ========================= */
  const submit = async () => {
    if (loading) return;

    /* IMPORT */
    if (type === "import") {
      if (!qty) {
        toast.error("Enter quantity");
        return;
      }

      if (isNaN(qty)) {
        toast.error("Quantity must be a number");
        return;
      }

      try {
        setLoading(true);

        await onSubmit({
          qty: Number(qty),
        });

        onClose(); // 🔥 đóng ngay
      } catch (err) {
        console.log(err);
        toast.error("Import failed");
      } finally {
        setLoading(false);
      }
    }

    /* EDIT */
    if (type === "edit") {
      if (!name.trim()) {
        toast.error("Enter product name");
        return;
      }

      if (isNaN(price)) {
        toast.error("Price must be a number");
        return;
      }

      try {
        setLoading(true);

        await onSubmit({
          name,
          price: Number(price),
          min_stock: Number(minStock),
          category_id: category,
        });

        onClose();
      } catch (err) {
        console.log(err);
        toast.error("Update failed");
      } finally {
        setLoading(false);
      }
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

        {/* EDIT FORM */}
        {type === "edit" && (
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={input}
            />

            <span>Price:</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={input}
            />

            <span>Min stock:</span>
            <input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              style={input}
            />

            <span>Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={input}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* IMPORT FORM */}
        {type === "import" && (
          <input
            type="number"
            placeholder="Quantity"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            style={input}
            autoFocus
          />
        )}

        {/* ACTIONS */}
        <div style={actions}>
          <button type="submit" style={saveBtn} disabled={loading}>
            {loading ? "Saving..." : "Save"}
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
