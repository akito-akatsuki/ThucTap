"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const getUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUser(session?.user ?? null);
  };

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // ✅ bắt buộc
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const avatar =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const name = user?.user_metadata?.full_name;
  const email = user?.email;
  const [role, setRole] = useState(null);
  useEffect(() => {
    const getRole = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data) {
        setRole(data.role);
      }
    };

    getRole();
  }, [user]);
  return (
    <div style={nav}>
      <Link href="/" style={logo}>
        🤖 Inventory AI
      </Link>

      <div style={menu}>
        <Link href="/" style={link}>
          Home
        </Link>
        <Link href="/dashboard" style={link}>
          Dashboard
        </Link>
        <Link href="/scan" style={link}>
          Scanner
        </Link>
        {role === "admin" && (
          <Link href="/employees" style={link}>
            Employees
          </Link>
        )}
        {!user ? (
          <button onClick={login} style={loginBtn}>
            Login Google
          </button>
        ) : (
          <div style={userBox}>
            {avatar ? (
              <img src={avatar} style={avatarStyle} />
            ) : (
              <div style={avatarFallback}>{email?.charAt(0).toUpperCase()}</div>
            )}

            <div>
              <div style={nameStyle}>
                {name}
                {role && <span style={roleStyle}>({role})</span>}
              </div>
              <div style={emailStyle}>{email}</div>
            </div>

            <button onClick={logout} style={logoutBtn}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const nav = {
  position: "sticky",
  top: 0,
  background: "white",
  borderBottom: "1px solid #eee",
  padding: "12px 40px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  zIndex: 1000,
};

const logo = {
  textDecoration: "none",
  background: "#2563eb",
  color: "white",
  padding: "6px 12px",
  borderRadius: 8,
  fontWeight: "bold",
};

const menu = {
  display: "flex",
  gap: 20,
  alignItems: "center",
};

const link = {
  textDecoration: "none",
  color: "#333",
  fontWeight: 500,
};

const loginBtn = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: 8,
  cursor: "pointer",
};

const logoutBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: 8,
  cursor: "pointer",
};

const userBox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const avatarStyle = {
  width: 32,
  height: 32,
  borderRadius: "50%",
};

const avatarFallback = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: "#6366f1",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
};

const nameStyle = {
  fontSize: 13,
  fontWeight: 600,
};

const emailStyle = {
  fontSize: 11,
  color: "#666",
};

const roleStyle = {
  marginLeft: 6,
  fontSize: 12,
  color: "#888",
  fontWeight: "normal",
};
