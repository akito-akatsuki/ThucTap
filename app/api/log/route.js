import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      `
        id,
        quantity,
        price,
        type,
        created_at,
        created_by,
        invoice_id,
        products ( name ),
        invoices (
          id,
          created_at,
          created_name
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.log("LOG API ERROR:", error);
    return Response.json({ error: error.message });
  }

  return Response.json({ data });
}
