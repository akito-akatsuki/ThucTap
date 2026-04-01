import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Email của bạn (vd: admin@gmail.com)
    pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng (App Password)
  },
});
/* =========================
   GET USERS / GET ROLE
========================= */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const email = searchParams.get("email");

  if (id) {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", id)
      .single();

    if (error) {
      return Response.json({ role: null });
    }

    return Response.json({ role: data?.role ?? null });
  }

  if (email) {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("email", email)
      .single();

    if (error) {
      return Response.json({ role: null });
    }

    return Response.json({ role: data?.role ?? null });
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Users fetch error:", error);
    return Response.json({ data: [], error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}

/* =========================
   ADD EMPLOYEE (POST)
========================= */
export async function POST(req) {
  try {
    const { email, password, name } = await req.json();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Verify that the requester is an Admin
    const {
      data: { user: adminUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !adminUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminDoc } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (adminDoc?.role !== "admin") {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }
    const {
      data: { users },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = users?.find((u) => u.email === email);

    if (existingAuthUser) {
      // Delete the "ghost" user in Auth to allow re-creation
      await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
      console.log(`Deleted existing auth user: ${email}`);
    }
    // 2. Create User in Supabase Auth (System Level)
    const { data: authData, error: signUpError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email so staff can log in immediately
        user_metadata: { name },
      });

    if (signUpError) throw signUpError;

    // 3. Insert/Sync information into public.users table
    const { data, error: dbError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: authData.user.id, // Map Auth ID to Public Table ID
        email,
        name,
        role: "staff",
        created_by: adminUser.id, // Audit: who created this account
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 4. Send Email Notification via Nodemailer
    const mailOptions = {
      from: `"Inventory System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to the Team - Your Account Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
          <p>Your staff account has been successfully created. You can now log in to the Inventory Management System using the credentials below:</p>

          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0;"><strong>User ID / Email:</strong> ${email}</p>
            <p style="margin: 5px 0 0 0;"><strong>Temporary Password:</strong> <span style="color: #dc2626;">${password}</span></p>
          </div>

          <p style="margin-top: 20px;">For security reasons, we recommend changing your password after your first login.</p>

          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            Regards,<br/>
            <strong>Administration Team</strong>
          </p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">This is an automated system email. Please do not reply.</p>
        </div>
      `,
    };

    // We await the email to ensure it's sent before confirming success to the Admin
    await transporter.sendMail(mailOptions);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("Critical Error in ADD_EMPLOYEE:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
/* =========================
   UPDATE ROLE
========================= */
export async function PATCH(req) {
  const { id, role } = await req.json();

  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return Response.json({ error: "Unauthorized" });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (!user || authError) {
    return Response.json({ error: "Unauthorized" });
  }

  const { data: admin } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!admin || admin.role !== "admin") {
    return Response.json({ error: "Permission denied" });
  }

  if (user.id === id) {
    return Response.json({ error: "Cannot change yourself" });
  }

  const { error } = await supabase.from("users").update({ role }).eq("id", id);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({ success: true });
}

/* =========================
   DELETE USER (AUTH + TABLE)
========================= */
export async function DELETE(req) {
  try {
    const { id } = await req.json(); // ID này là UUID của User
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Kiểm tra quyền Admin (Sử dụng supabaseAdmin để bảo mật)
    const {
      data: { user: requester },
    } = await supabaseAdmin.auth.getUser(token);
    const { data: adminCheck } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", requester?.id)
      .single();

    if (adminCheck?.role !== "admin") {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    if (requester.id === id) {
      return Response.json(
        { error: "Cannot delete yourself" },
        { status: 400 },
      );
    }

    // 2. 🔥 QUAN TRỌNG: Xóa trong hệ thống AUTH trước
    // Điều này giúp giải phóng Email để có thể đăng ký lại sau này
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      console.log("User not found in Auth or already deleted.");
    }

    // 3. Xóa trong bảng public.users
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);
    if (dbError) throw dbError;

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
