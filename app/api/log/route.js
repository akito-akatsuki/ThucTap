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
        created_at,
        created_by,
        created_name
      ),
      products (
        name
      )
    `,
    )
    .order("id", { ascending: false });

  if (error) {
    console.log("API error:", error);
    return Response.json({ error: error.message });
  }

  return Response.json({ data });
}
