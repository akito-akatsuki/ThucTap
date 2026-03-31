"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { formatVND } from "../utils/currency";
import {
  ShoppingCart,
  CreditCard,
  Smartphone,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const router = useRouter();

  /* =========================
     LOAD CART - UNCHANGED LOGIC
  ========================= */
  useEffect(() => {
    const cart = localStorage.getItem("cart");
    if (cart) setItems(JSON.parse(cart));
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
      } else {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  if (checkingAuth) {
    return null;
  }

  /* =========================
     TOTAL - UNCHANGED
  ========================= */
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  /* =========================
     CHECKOUT - UNCHANGED LOGIC + MODERN TOASTS
  ========================= */
  const checkout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          user: user
            ? { id: user.id, email: user.email, name: user.user_metadata?.name }
            : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("🧾 Checkout success!");

        // Low-stock alerts (unchanged)
        for (const item of items) {
          const newStock = (item.stock ?? 0) - item.qty;
          await fetch("/api/low-stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              stock: newStock,
              min_stock: item.min_stock,
            }),
          });
        }

        localStorage.removeItem("cart");
        setItems([]);
        router.push("/scan");
      } else {
        toast.error(data.error || "Checkout failed");
      }
    } catch (err) {
      toast.error("Network error");
    }

    setLoading(false);
  };

  /* =========================
     MODERN DASHBOARD UI
  ========================= */
  return (
    <div className="dashboard-page bg-gradient-to-br from-slate-50 to-indigo-50/50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HERO TITLE */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-slate-700 to-gray-900 bg-clip-text text-transparent mb-4">
            🧾 Checkout
          </h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
            Review your cart and complete payment securely
          </p>
        </div>

        {/* MAIN CHECKOUT CARD */}
        <div className="stat-card max-h-[80vh] overflow-hidden flex flex-col">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex items-center gap-3 text-emerald-600 font-bold text-lg">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>Processing payment...</span>
              </div>
            </div>
          )}

          {/* ITEMS TABLE */}
          <div className="flex-1 overflow-auto px-6 py-8 pr-2 -mr-2">
            {items.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Cart is empty
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Scan products on the scanner page to add items to your cart
                </p>
                <button
                  onClick={() => router.push("/scan")}
                  className="mt-8 btn-success px-8 py-3 text-lg font-bold"
                >
                  👆 Go to Scanner
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-center">Unit Price</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="group hover:bg-white/60">
                        <td className="font-medium text-gray-900 group-hover:text-emerald-700">
                          {item.name}
                        </td>
                        <td className="text-center text-sm text-gray-600">
                          {formatVND(item.price || 0)}
                        </td>
                        <td className="text-center font-mono text-sm font-bold text-emerald-600">
                          {item.qty}
                        </td>
                        <td className="text-right font-bold text-xl text-gray-900">
                          {formatVND((item.price || 0) * item.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TOTAL & BUTTONS - STICKY */}
          <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pt-8 pb-6 px-8 rounded-b-3xl shadow-2xl sticky bottom-0 mt-auto border-t-4 border-emerald-200/50">
            {/* TOTAL */}
            <div className="flex items-center justify-between text-3xl font-black mb-8 px-4 py-4 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-3xl border border-emerald-200/50">
              <span className="bg-gradient-to-r from-gray-900 to-slate-800 bg-clip-text text-transparent tracking-tight">
                Grand Total
              </span>
              <span className="text-emerald-700 min-w-[180px] text-right font-black text-3xl drop-shadow-lg">
                {formatVND(total)}
              </span>
            </div>

            {/* PAYMENT BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                disabled={loading || items.length === 0}
                onClick={() => {
                  setPaymentMethod("cash");
                  checkout();
                }}
                className="flex-1 group btn-success flex items-center justify-center gap-3 py-5 px-6 text-lg font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl"
              >
                <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Cash
              </button>

              <button
                onClick={() => setShowQRModal(true)}
                disabled={loading}
                className="flex-1 group bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center gap-3 py-5 px-6 text-lg font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl"
              >
                <Smartphone className="w-6 h-6 group-hover:scale-110 transition-transform" />
                QR Pay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="stat-card max-w-md w-full mx-4 p-8 rounded-3xl shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col items-center text-center space-y-6 relative">
            {/* CLOSE */}
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute -top-4 -right-4 w-14 h-14 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl flex items-center justify-center hover:bg-white hover:shadow-3xl transition-all border border-gray-200"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>

            {/* TITLE */}
            <div>
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-slate-800 bg-clip-text text-transparent">
                Scan QR to Pay
              </h2>
              <p className="text-gray-600 mt-2">Show this to customer</p>
            </div>

            {/* QR CODE */}
            <div className="p-6 bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 w-full max-w-sm">
              <img
                src={`https://img.vietqr.io/image/VCB-1018309045-compact2.png?amount=${Math.round(total)}&addInfo=POS Checkout`}
                alt="QR Payment"
                className="w-full h-auto rounded-2xl shadow-2xl block mx-auto"
              />
            </div>

            {/* AMOUNT */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 rounded-3xl border border-emerald-200/30 backdrop-blur-sm shadow-xl">
              <p className="text-sm text-gray-600 uppercase font-bold tracking-wide mb-2">
                Amount to pay
              </p>
              <p className="text-3xl font-black text-emerald-700 drop-shadow-lg">
                {formatVND(total)}
              </p>
            </div>

            {/* CONFIRM BUTTON */}
            <button
              onClick={checkout}
              disabled={loading}
              className="w-full btn-success py-4 px-8 text-lg font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Confirm Payment
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Secure payment via VietQR. Bank will be notified instantly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
