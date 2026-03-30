import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const { email, password } = await req.json();

  // 1️⃣ Lấy user từ bảng users
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (fetchError || !user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.hashed_password) {
    return Response.json({ error: "Use Google login" }, { status: 400 });
  }

  // 2️⃣ So sánh mật khẩu
  const isValid = await bcrypt.compare(password, user.hashed_password);
  if (!isValid) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  // 3️⃣ Tạo session Supabase (jwt token) - dùng RLS/Policy nếu cần
  const { data: sessionData, error: sessionError } =
    await supabase.auth.admin.generateLink({
      email,
      type: "magiclink", // dùng magic link để tạo session tạm
    });

  if (sessionError) {
    console.error("Session error:", sessionError);
    return Response.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }

  // 4️⃣ Cập nhật last_login để log truy vết
  await supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", user.id);

  // 5️⃣ Xoá hashed_password trước khi trả
  const { hashed_password, ...safeUser } = user;

  return Response.json({
    success: true,
    user: safeUser,
    session: sessionData, // bạn có thể lưu access_token ở frontend
  });
}
