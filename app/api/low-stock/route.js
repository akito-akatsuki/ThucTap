import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { name, stock } = await req.json();

    console.log("LOW STOCK DETECTED");
    console.log("Product:", name);
    console.log("Stock left:", stock);

    /* GET ADMIN EMAILS */

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

    console.log("Admins:", adminEmails);

    /* MAIL TRANSPORT */

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmails.join(","), // gửi cho tất cả admin
      subject: "⚠ Low Stock Alert",
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
    <h2 style="color:#dc2626;margin-top:0">
      ⚠ Low Stock Alert
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
    console.log(info);

    return Response.json({
      success: true,
      message: "Email sent to admins",
    });
  } catch (err) {
    console.log("EMAIL ERROR");
    console.log(err);

    return Response.json({
      success: false,
      error: "Failed to send email",
    });
  }
}
