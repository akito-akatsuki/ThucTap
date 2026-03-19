"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const pathname = usePathname();
  const navRef = useRef(null);

  const [underline, setUnderline] = useState({
    left: 0,
    width: 0,
  });

  /* =========================
     AUTH LISTENER
  ========================= */
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe(); // ✅ FIX crash
    };
  }, []);

  /* =========================
     GET ROLE
  ========================= */
  useEffect(() => {
    const getRole = async () => {
      if (!user) {
        setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) console.error(error);

      setRole(data?.role ?? null);
    };

    getRole();
  }, [user]);

  /* =========================
     SYNC USER (AUTO RE-CREATE)
  ========================= */
  useEffect(() => {
    const syncUser = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!data) {
        const { error } = await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name,
          role: "seller",
        });

        if (error) console.error("SYNC ERROR:", error);
        else console.log("User re-created!");
      }
    };

    syncUser();
  }, [user]);

  /* =========================
     UPDATE UNDERLINE
  ========================= */
  useEffect(() => {
    const activeEl = navRef.current?.querySelector('[data-active="true"]');

    if (activeEl) {
      setUnderline({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [pathname, role]);

  /* =========================
     AUTH ACTIONS
  ========================= */
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  /* =========================
     USER INFO
  ========================= */
  const avatar =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const name = user?.user_metadata?.full_name;
  const email = user?.email;

  /* =========================
     NAV ITEMS
  ========================= */
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/scan", label: "Scanner" },
    ...(role === "admin" ? [{ href: "/employees", label: "Employees" }] : []),
  ];

  return (
    <div style={nav}>
      <Link href="/" style={logo}>
        🤖 Inventory AI
      </Link>

      <div style={menu} ref={navRef}>
        {/* 🔥 SLIDE UNDERLINE */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            height: 3,
            background: "#2563eb",
            borderRadius: 2,
            transition: "all 0.3s ease",
            left: underline.left,
            width: underline.width,
          }}
        />

        {/* NAV LINKS */}
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive}
              style={{
                ...link,
                color: isActive ? "#2563eb" : "#333",
              }}
            >
              {item.label}
            </Link>
          );
        })}

        {/* USER */}
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
                {name} {role && <span style={roleStyle}>({role})</span>}
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

/* =========================
   STYLES
========================= */

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
  position: "relative", // 🔥 quan trọng cho underline
};

const link = {
  textDecoration: "none",
  fontWeight: 500,
  paddingBottom: 6,
  position: "relative",
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
