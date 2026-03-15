import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      `
      id,
      type,
      quantity,
      created_by,
      created_at,
      products (
        name
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({
    data,
  });
}
