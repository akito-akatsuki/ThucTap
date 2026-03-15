import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("sales").select(`
      quantity,
      price,
      sold_at,
      products(name)
    `);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json(data);
}
