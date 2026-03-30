import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Khởi tạo admin client với SERVICE_ROLE_KEY (để có quyền tạo user auth)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* =========================
   GET USERS / GET ROLE
========================= */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
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

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("email", email)
    .single();

  if (error) {
    return Response.json({ role: null });
  }

  return Response.json({ role: data.role });
}

/* =========================
   ADD EMPLOYEE (POST)
========================= */
export async function POST(req) {
  try {
    const { email, password, name } = await req.json();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Xác thực Admin đang gọi API
    const {
      data: { user: adminUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !adminUser)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminDoc } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (adminDoc?.role !== "admin") {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    // 2. Tạo User trong Supabase Auth (Để có Session/ID thực)
    const { data: authData, error: signUpError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Tự động xác thực email để nhân viên đăng nhập được luôn
        user_metadata: { name },
      });

    if (signUpError) throw signUpError;

    // 3. Cập nhật thông tin vào bảng public.users
    const { data, error: dbError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: authData.user.id, // Dùng chung ID với Auth
        email,
        name,
        role: "staff",
        created_by: adminUser.id, // Lưu lại ai là người tạo (cho việc audit/log)
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return Response.json({ success: true, data });
  } catch (err) {
    console.error(err);
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
   DELETE USER
========================= */
export async function DELETE(req) {
  const { id } = await req.json();

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
    return Response.json({ error: "Cannot delete yourself" });
  }

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({ success: true });
}
