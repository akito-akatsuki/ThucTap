"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Scanner from "@/components/Scanner";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { formatVND } from "../utils/currency";

export default function ScanPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const lastScanRef = useRef(0);
  const scanningRef = useRef(false);
  const alertRef = useRef(false);

  const [cart, setCart] = useState([]);
  const [scanning, setScanning] = useState(false);

  // HANDLE SCAN
  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      setCheckingAuth(false);
    };

    check();
  }, [router]);

  if (checkingAuth) {
    return null;
  }

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

  // CART FUNCTIONS
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

  const handleInputQty = (id, value) => {
    if (value === "") {
      setCart((prev) => prev.map((p) => (p.id === id ? { ...p, qty: "" } : p)));
      return;
    }

    let qty = Number(value);

    if (isNaN(qty) || qty < 1) qty = 1;

    const item = cart.find((p) => p.id === id);
    if (!item) return;

    if (qty > item.stock) {
      if (!alertRef.current) {
        toast.error("Out of stock");
        alertRef.current = true;
        setTimeout(() => {
          alertRef.current = false;
        }, 1200);
      }
      qty = item.stock;
    }

    setCart((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)));
  };

  // TOTAL
  const total = cart.reduce((sum, p) => sum + Number(p.price) * p.qty, 0);

  // CHECKOUT
  const goCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart empty");
      return;
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    router.push("/checkout");
  };

  return (
    <div
      className={
        "dashboard-page bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-950 dark:to-slate-900/70 min-h-screen py-8 px-4 sm:px-6 lg:px-8"
      }
    >
      <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 to-slate-800 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-12 animate-fade-in-up">
        🛒 POS Scanner
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-8 max-w-7xl mx-auto">
        {/* SCANNER CARD */}
        <div className="stat-card bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-700/40 shadow-2xl rounded-3xl p-8 hover:shadow-3xl transition-all duration-500 order-2 lg:order-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            📷 Scan Barcode
          </h2>
          <div className="w-full h-96 lg:h-80 border-4 border-dashed border-gray-200/50 dark:border-slate-700/40 rounded-2xl overflow-hidden bg-gradient-to-b from-white/50 to-white/20 dark:from-slate-900/50 dark:to-slate-900/70 hover:border-emerald-300/50 transition-all duration-300">
            <Scanner onScan={handleScan} />
          </div>
          <p className="mt-6 text-sm text-gray-500 dark:text-slate-400 text-center animate-pulse">
            Point camera at barcode
          </p>
        </div>

        {/* INVOICE CARD */}
        <div className="dashboard-card shadow-2xl rounded-3xl p-8 max-h-[600px] flex flex-col hover:shadow-3xl transition-all duration-500 order-1 lg:order-2">
          <div className="dashboard-card-header mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent flex items-center gap-3">
              🧾 Invoice ({cart.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto mb-8 pr-2 -mr-2">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🛒</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Cart is empty
                </h3>
                <p className="text-gray-500 dark:text-slate-400">
                  Scan products to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-950/80 border border-gray-100/50 dark:border-slate-700/50 hover:border-emerald-200/50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-start lg:items-center justify-between gap-4 lg:gap-6">
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-emerald-700 truncate mb-1">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          Unit: {formatVND(item.price)}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right hidden sm:block">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatVND(item.price * item.qty)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-slate-400 line-through">
                          {formatVND(item.price)}
                        </div>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-3 ml-auto sm:ml-0">
                        <div className="flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-xl p-2 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                          <button
                            onClick={() => decreaseQty(item.id)}
                            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white font-bold transition-all duration-200 hover:scale-110"
                            disabled={item.qty <= 1}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.qty}
                            min={1}
                            max={item.stock}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              handleInputQty(item.id, e.target.value)
                            }
                            onWheel={(e) => e.target.blur()}
                            className="w-20 text-center border-0 bg-transparent font-bold text-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2 py-1"
                          />
                          <button
                            onClick={() => increaseQty(item.id)}
                            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-emerald-600 font-bold transition-all duration-200 hover:scale-110"
                          >
                            +
                          </button>
                        </div>

                        {/* Mobile Price */}
                        <div className="text-right sm:hidden text-lg font-bold text-gray-900 dark:text-white">
                          {formatVND(item.price * item.qty)}
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-12 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl flex items-center justify-center text-white font-bold text-lg transition-all duration-300 hover:scale-110 hover:rotate-5 active:scale-95"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Stock Warning */}
                    {item.qty >= item.stock && (
                      <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded-xl">
                        <span className="text-xs font-medium text-orange-800">
                          ⚠️ Max stock reached
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TOTAL & CHECKOUT - STICKY */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-slate-700/50 pt-8 pb-2 rounded-2xl shadow-2xl sticky bottom-0 mt-auto">
            <div className="flex items-center justify-between text-2xl font-black mb-6 px-2">
              <span className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent">
                Total
              </span>
              <span className="text-emerald-700 dark:text-emerald-300 min-w-[150px] text-right">
                {formatVND(total)}
              </span>
            </div>
            <button
              onClick={goCheckout}
              disabled={cart.length === 0}
              className="w-full btn-success text-lg py-4 px-8 font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-1 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {cart.length === 0
                ? "Add items to checkout"
                : `Checkout ${cart.length} items`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
