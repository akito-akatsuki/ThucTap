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
      text: `Product ${name} is low stock. Only ${stock} items left.`,
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
