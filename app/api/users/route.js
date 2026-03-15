import { supabase } from "@/lib/supabase";

/* GET ROLE BY EMAIL (giữ nguyên của bạn) */

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    /* nếu không có email -> trả toàn bộ users */
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

/* UPDATE ROLE */

export async function PATCH(req) {
  const { id, role } = await req.json();

  if (!id || !role) {
    return Response.json({ error: "Missing fields" });
  }

  const { error } = await supabase.from("users").update({ role }).eq("id", id);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({
    success: true,
  });
}

/* DELETE USER */

export async function DELETE(req) {
  const { id } = await req.json();

  if (!id) {
    return Response.json({ error: "User id required" });
  }

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({
    success: true,
  });
}
