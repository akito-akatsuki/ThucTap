import { supabase } from "@/lib/supabase";

/* GET ROLE BY EMAIL */

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

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

/* UPDATE ROLE (ADMIN ONLY) */

export async function PATCH(req) {
  const { id, role, adminEmail } = await req.json();

  if (!id || !role || !adminEmail) {
    return Response.json({ error: "Missing fields" });
  }

  /* CHECK ADMIN */

  const { data: admin } = await supabase
    .from("users")
    .select("role")
    .eq("email", adminEmail)
    .single();

  if (!admin || admin.role !== "admin") {
    return Response.json({
      error: "Permission denied",
    });
  }

  const { error } = await supabase.from("users").update({ role }).eq("id", id);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({
    success: true,
  });
}

/* DELETE USER (ADMIN ONLY) */

export async function DELETE(req) {
  const { id, adminEmail } = await req.json();

  if (!id || !adminEmail) {
    return Response.json({ error: "Missing fields" });
  }

  /* CHECK ADMIN */

  const { data: admin } = await supabase
    .from("users")
    .select("role")
    .eq("email", adminEmail)
    .single();

  if (!admin || admin.role !== "admin") {
    return Response.json({
      error: "Permission denied",
    });
  }

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({
    success: true,
  });
}
