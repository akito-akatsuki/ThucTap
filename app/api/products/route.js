import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";
import nodemailer from "nodemailer";

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
        category_id,
        categories (
          name
        ),
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
        category: data.categories?.name || null,
        stock,
      },
    });
  }

  /* =========================
  GET ALL PRODUCTS
  ========================= */

  const { data, error } = await supabase.from("products").select(`
      id,
      name,
      barcode,
      price,
      min_stock,
      category_id,
      categories (
        name
      ),
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
    const { name, price, category_id, user } = body;

    if (!name) {
      return Response.json({
        error: "Product name is required",
      });
    }

    const barcode = generateBarcode();

    /* =========================
       CREATE PRODUCT
    ========================= */

    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        price,
        barcode,
        category_id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({
        error: error.message,
      });
    }

    /* =========================
       CREATE INVENTORY
    ========================= */

    await supabase.from("inventory").insert({
      product_id: data.id,
      stock: 0,
    });

    /* =========================
       USER INFO
    ========================= */

    const email = user?.email || "unknown@email.com";
    const nameUser = user?.user_metadata?.name || "Unknown";
    const username = `${email} (${nameUser})`;

    /* =========================
       🔥 CREATE INVOICE (QUAN TRỌNG)
    ========================= */

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        total: 0,
        created_name: username,
      })
      .select()
      .single();

    if (invoiceError) {
      return Response.json({
        error: invoiceError.message,
      });
    }

    /* =========================
       🔥 CREATE LOG (CÓ invoice_id)
    ========================= */

    await supabase.from("stock_movements").insert({
      product_id: data.id,
      type: "create",
      quantity: 0,
      created_by: username,
      invoice_id: invoice.id, // ✅ FIX QUAN TRỌNG
    });

    /* =========================
       GENERATE QR
    ========================= */

    const qr = await QRCode.toDataURL(barcode.toString());

    /* =========================
       GET SELLERS
    ========================= */

    const { data: sellers } = await supabase
      .from("users")
      .select("email")
      .eq("role", "seller");

    /* =========================
       SEND EMAIL (BACKGROUND)
    ========================= */

    if (sellers && sellers.length > 0) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      setTimeout(async () => {
        try {
          await Promise.all(
            sellers.map((s) =>
              transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: s.email,
                subject: "New Product QR Code",
                html: `
                  <h2>${name}</h2>
                  <p>Barcode: ${barcode}</p>
                  <p>Scan this QR:</p>
                  <img src="${qr}" />
                `,
              }),
            ),
          );
        } catch (err) {
          console.log("Email error:", err);
        }
      }, 0);
    }

    return Response.json({
      data,
      qr,
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

/* =========================
UPDATE PRODUCT
========================= */

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, price, min_stock, category_id } = body;

    if (!id) {
      return Response.json({
        success: false,
        error: "Product id required",
      });
    }

    const { data, error } = await supabase
      .from("products")
      .update({
        name,
        price,
        min_stock,
        category_id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({
        success: false,
        error: error.message,
      });
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (err) {
    return Response.json({
      success: false,
      error: "Update failed",
    });
  }
}
