import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { name, stock } = await req.json();

    /* ========================
    VALIDATE INPUT
    ======================== */
    if (!name || stock == null) {
      return Response.json({
        success: false,
        error: "Missing name or stock",
      });
    }

    console.log("LOW STOCK DETECTED:", name, stock);

    /* ========================
    GET PRODUCT (CHECK SPAM)
    ======================== */
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, last_alert_at")
      .eq("name", name)
      .single();

    if (productError || !product) {
      console.log("PRODUCT FETCH ERROR", productError);
      return Response.json({
        success: false,
        error: "Product not found",
      });
    }

    const now = new Date();
    const last = product.last_alert_at ? new Date(product.last_alert_at) : null;

    const ONE_HOUR = 60 * 60 * 1000;

    /* ========================
    PREVENT SPAM
    ======================== */
    if (last && now - last < ONE_HOUR) {
      console.log("ALREADY ALERTED RECENTLY");

      return Response.json({
        success: true,
        message: "Already alerted recently",
      });
    }

    /* ========================
    GET ADMIN EMAILS
    ======================== */
    const { data: admins, error } = await supabase
      .from("users")
      .select("email")
      .eq("role", "admin");

    if (error) {
      console.log("ADMIN FETCH ERROR", error);
      return Response.json({
        success: false,
        error: "Failed to get admins",
      });
    }

    const adminEmails = admins.map((a) => a.email);

    if (!adminEmails.length) {
      return Response.json({
        success: false,
        error: "No admin emails found",
      });
    }

    console.log("Admins:", adminEmails);

    /* ========================
    ALERT LEVEL
    ======================== */
    let level = "WARNING";
    let color = "#f59e0b";

    if (stock <= 5) {
      level = "CRITICAL";
      color = "#dc2626";
    }

    /* ========================
    SEND EMAIL
    ======================== */
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmails.join(","),
      subject: `⚠ ${level} Stock Alert`,
      html: `
<div style="font-family:Arial, sans-serif; background:#f8fafc; padding:30px">
  <div style="
      max-width:520px;
      margin:auto;
      background:white;
      border-radius:10px;
      padding:24px;
      box-shadow:0 4px 12px rgba(0,0,0,0.08)
  ">
    <h2 style="color:${color};margin-top:0">
      ⚠ ${level} Stock Alert
    </h2>

    <p style="font-size:15px;color:#333">
      The following product is running out of stock:
    </p>

    <div style="
        background:#f1f5f9;
        padding:16px;
        border-radius:8px;
        margin:16px 0
    ">
      <b>Product:</b> ${name} <br/>
      <b>Remaining stock:</b> ${stock}
    </div>

    <p style="font-size:14px;color:#555">
      Please restock this item soon to avoid inventory issues.
    </p>

    <a href="https://thuc-tap-cn.vercel.app/dashboard"
       style="
        display:inline-block;
        margin-top:15px;
        padding:10px 16px;
        background:#2563eb;
        color:white;
        text-decoration:none;
        border-radius:6px;
        font-weight:bold
       ">
       Open Inventory Dashboard
    </a>

    <hr style="margin:25px 0"/>

    <p style="font-size:12px;color:#888">
      Smart Inventory System • Auto Stock Monitoring
    </p>
  </div>
</div>
`,
    });

    console.log("EMAIL SENT SUCCESS");

    /* ========================
    UPDATE LAST ALERT TIME
    ======================== */
    await supabase
      .from("products")
      .update({ last_alert_at: new Date() })
      .eq("id", product.id);

    return Response.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (err) {
    console.log("EMAIL ERROR", err);

    return Response.json({
      success: false,
      error: "Failed to send email",
    });
  }
}
