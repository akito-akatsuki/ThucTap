import { supabase } from "@/lib/supabase";

/* =========================
HELPERS
========================= */
const smooth = (arr) =>
  arr.map((v, i, a) => {
    const prev = a[i - 1] ?? v;
    const next = a[i + 1] ?? v;
    return Math.round((prev + v + next) / 3);
  });

/* =========================
MAIN
========================= */
export async function POST(req) {
  try {
    const body = await req.json();
    const products = body.products || [];
    const mode = body.mode || "week";

    const DAYS = mode === "month" ? 30 : 7;

    if (!products.length) {
      return Response.json({ data: [] });
    }

    /* =========================
    GET SALES LAST 30 DAYS
    ========================= */
    const { data: sales, error } = await supabase
      .from("sales")
      .select("product_id, quantity, created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      );

    if (error) {
      console.error(error);
      return Response.json({ data: [] });
    }

    /* =========================
    GROUP SALES BY PRODUCT + DAY
    ========================= */
    const map = {};

    sales.forEach((s) => {
      const day = new Date(s.created_at).toISOString().slice(0, 10);

      if (!map[s.product_id]) map[s.product_id] = {};
      if (!map[s.product_id][day]) map[s.product_id][day] = 0;

      map[s.product_id][day] += s.quantity;
    });

    /* =========================
    BUILD PREDICTION
    ========================= */
    const result = products.map((p) => {
      const history = Object.values(map[p.id] || {});

      // 🔥 BASE (trung bình bán)
      const base =
        history.length > 0
          ? Math.round(history.reduce((a, b) => a + b, 0) / history.length)
          : Math.floor(Math.random() * 5) + 1;

      /* =========================
      PREDICT FUTURE
      ========================= */
      const rawPrediction = Array.from({ length: DAYS }).map((_, i) => {
        const trend = i * 0.2; // tăng nhẹ theo ngày
        const variation = Math.floor(base * 0.3);

        return Math.max(
          0,
          base + trend + (Math.random() * variation - variation / 2),
        );
      });

      const prediction = smooth(rawPrediction).map((n) => Math.round(n));

      return {
        name: p.name,
        prediction,
        predictedSales: prediction.reduce((a, b) => a + b, 0),
        daysLeft: Math.max(
          1,
          Math.floor((p.inventory?.stock || 10) / (base || 1)),
        ),
      };
    });

    return Response.json({ data: result });
  } catch (err) {
    console.error("Predict error:", err);

    return Response.json({
      data: [],
      error: err.message,
    });
  }
}
