import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("invoice_items")
    .select(
      `
      id,
      qty,
      price,
      invoice_id,
      invoices (
        id,
        created_at
      ),
      products (
        name
      )
    `,
    )
    .order("created_at", { foreignTable: "invoices", ascending: false });

  if (error) {
    console.log("Log API error:", error);
    return Response.json({ error: error.message });
  }

  return Response.json({
    data,
  });
}
