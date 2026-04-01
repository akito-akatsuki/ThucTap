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

  /* SYNC PRODUCT WHEN EDITING */
  useEffect(() => {
    setName(product?.name || "");
    setPrice(product?.price || "");
    setMinStock(product?.min_stock || 5);
    setCategory(product?.category_id || "");
  }, [product]);

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

        onClose();
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

      if (price === "" || isNaN(Number(price))) {
        toast.error("Price must be a number");
        return;
      }

      try {
        setLoading(true);

        await onSubmit({
          name,
          price: Number(price),
          min_stock: Number(minStock),
          category_id: category || null,
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-8 w-[320px] flex flex-col gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h3 className="text-xl font-semibold">
          {type === "edit" ? "Edit Product" : "Import Stock"}
        </h3>

        {/* EDIT FORM */}
        {type === "edit" && (
          <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
            <span>Name:</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
            />

            <span>Price:</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
            />

            <span>Min stock:</span>
            <input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
            />

            <span>Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
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
            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
            autoFocus
          />
        )}

        {/* ACTIONS */}
        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-400 text-white py-3 font-semibold hover:bg-slate-500 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
