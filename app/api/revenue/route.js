// app/api/revenue/route.js
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // e.g., "1"
  const year = searchParams.get("year"); // e.g., "2026"

  let query = supabase.from("monthly_revenue").select("*");

  if (year) {
    query = query.eq("year", Number(year));
  }
  if (month) {
    query = query.eq("month", Number(month));
  }

  query = query
    .order("year", { ascending: true })
    .order("month", { ascending: true });

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  // trả về mảng rỗng nếu không có dữ liệu
  return new Response(JSON.stringify(data || []), { status: 200 });
}
