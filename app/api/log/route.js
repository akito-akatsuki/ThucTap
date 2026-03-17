import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    },
  );

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
