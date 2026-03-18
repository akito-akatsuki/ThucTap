"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSessionFromUrl();
      if (error) console.error(error);
      else if (data.session) router.replace("/dashboard");
    };
    handleAuth();
  }, [router]);

  return <div>Loading...</div>;
}
