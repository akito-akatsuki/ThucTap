"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSessionFromUrl();
      if (error) {
        console.error(error.message);
      } else if (data.session) {
        // Session đã được set tự động trong Supabase client
        router.replace("/dashboard"); // redirect sau login
      }
    };
    handleAuth();
  }, [router]);

  return <div>Loading...</div>;
}
