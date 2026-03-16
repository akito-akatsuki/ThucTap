import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { barcode } = await req.json();

    if (!barcode) {
      return Response.json({
        success: false,
        error: "No barcode",
      });
    }

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .single();

    if (error || !product) {
      return Response.json({
        success: false,
        error: "Product not found",
      });
    }

    return Response.json({
      success: true,
      product,
    });
  } catch (err) {
    console.log(err);

    return Response.json({
      success: false,
      error: "Scan failed",
    });
  }
}
