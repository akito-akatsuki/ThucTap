import { supabase } from "@/lib/supabase";

/* =========================
GET PRODUCTS / GET BY BARCODE
========================= */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const barcode = searchParams.get("barcode")?.trim();

  /* =========================
  SCAN BARCODE
  ========================= */
  if (barcode) {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        barcode,
        price,
        inventory (
          stock
        )
      `,
      )
      .eq("barcode", barcode)
      .single();

    if (error || !data) {
      return Response.json({
        success: false,
        error: "Product not found",
      });
    }

    /* FIX STOCK */
    const stock = data.inventory?.stock ?? data.inventory?.[0]?.stock ?? 0;

    if (stock <= 0) {
      return Response.json({
        success: false,
        error: "Out of stock",
      });
    }

    return Response.json({
      success: true,
      product: {
        id: data.id,
        name: data.name,
        price: data.price,
        barcode: data.barcode,
        stock: stock,
      },
    });
  }

  /* =========================
  GET ALL PRODUCTS (DASHBOARD)
  ========================= */

  const { data, error } = await supabase.from("products").select(`
      id,
      name,
      barcode,
      price,
      inventory (
        stock
      )
    `);

  if (error) {
    return Response.json({
      error: error.message,
    });
  }

  const products = data.map((p) => ({
    ...p,
    stock: p.inventory?.stock ?? p.inventory?.[0]?.stock ?? 0,
  }));

  return Response.json({
    data: products,
  });
}

/* =========================
GENERATE BARCODE
========================= */

function generateBarcode() {
  const random = Math.floor(100000000 + Math.random() * 900000000);
  return "893" + random;
}

/* =========================
ADD PRODUCT
========================= */

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, price } = body;

    if (!name) {
      return Response.json({
        error: "Product name is required",
      });
    }

    const barcode = generateBarcode();

    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        price,
        barcode,
      })
      .select()
      .single();

    if (error) {
      return Response.json({
        error: error.message,
      });
    }

    /* CREATE INVENTORY */

    await supabase.from("inventory").insert({
      product_id: data.id,
      stock: 0,
    });

    return Response.json({
      data,
    });
  } catch (err) {
    return Response.json({
      error: "Server error",
    });
  }
}

/* =========================
DELETE PRODUCT
========================= */

export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return Response.json({
        success: false,
        error: "Product id required",
      });
    }

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return Response.json({
        success: false,
        error: error.message,
      });
    }

    return Response.json({
      success: true,
    });
  } catch (err) {
    console.log(err);

    return Response.json({
      success: false,
      error: "Delete failed",
    });
  }
}
