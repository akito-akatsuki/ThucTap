"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // Lấy session từ URL hash
      const { data, error } = await supabase.auth.getSessionFromUrl({
        storeSession: true,
      });
      if (error) console.error(error.message);
      else if (data.session) router.replace("/dashboard"); // redirect sau login
    };
    handleAuth();
  }, [router]);

  return <div>Loading...</div>;
}
