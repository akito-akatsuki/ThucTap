import { supabase } from "@/lib/supabase";

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
  const { email } = await req.json();

  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { headers: corsHeaders });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (!user || authError) {
    return Response.json({ error: "Unauthorized" }, { headers: corsHeaders });
  }

  const { data: admin } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!admin || admin.role !== "admin") {
    return Response.json(
      { error: "Permission denied" },
      { headers: corsHeaders },
    );
  }

  // Check if user already exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return Response.json(
      { error: "User already exists" },
      { headers: corsHeaders },
    );
  }

  // Create new user with seller role (assumes Supabase auth signup separate or upsert)
  const { data, error } = await supabase
    .from("users")
    .upsert({ email, role: "seller" })
    .select()
    .single();

  if (error) {
    console.error("Add user error:", error);
    return Response.json({ error: error.message }, { headers: corsHeaders });
  }

  return Response.json({ success: true, data }, { headers: corsHeaders });
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
