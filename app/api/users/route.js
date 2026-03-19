import { supabase } from "@/lib/supabase";

/* =========================
   GET USERS / GET ROLE
========================= */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  // 🔹 GET ALL USERS
  if (!email) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return Response.json({ data: [] });
    }

    return Response.json({ data });
  }

  // 🔹 GET ROLE BY EMAIL
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("email", email)
    .single();

  if (error) {
    console.log(error);
    return Response.json({ role: null });
  }

  return Response.json({
    role: data.role,
  });
}

/* =========================
   UPDATE ROLE (ADMIN ONLY)
========================= */
export async function PATCH(req) {
  const { id, role } = await req.json();

  if (!id || !role) {
    return Response.json({ error: "Missing fields" });
  }

  // 🔥 Lấy user thật từ auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" });
  }

  // 🔥 Check role người đang login
  const { data: admin } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!admin || admin.role !== "admin") {
    return Response.json({ error: "Permission denied" });
  }

  // ❗ Không cho sửa chính mình
  if (user.id === id) {
    return Response.json({
      error: "You cannot change your own role",
    });
  }

  const { error } = await supabase.from("users").update({ role }).eq("id", id);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({ success: true });
}

/* =========================
   DELETE USER (ADMIN ONLY)
========================= */
export async function DELETE(req) {
  const { id } = await req.json();

  if (!id) {
    return Response.json({ error: "Missing fields" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  // ❗ Không cho tự xoá
  if (user.id === id) {
    return Response.json({
      error: "You cannot delete yourself",
    });
  }

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({ success: true });
}
