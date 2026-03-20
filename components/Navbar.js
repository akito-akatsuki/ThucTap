"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const pathname = usePathname();
  const navRef = useRef(null);

  const [underline, setUnderline] = useState({
    left: 0,
    width: 0,
  });

  /* =========================
     DETECT MOBILE
  ========================= */
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
    };

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  /* =========================
     AUTH
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

    return () => subscription?.unsubscribe();
  }, []);

  /* =========================
     ROLE
  ========================= */
  useEffect(() => {
    const getRole = async () => {
      if (!user) return setRole(null);

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setRole(data?.role ?? null);
    };

    getRole();
  }, [user]);

  /* =========================
     UNDERLINE
  ========================= */
  useEffect(() => {
    if (isMobile) return;

    const activeEl = navRef.current?.querySelector('[data-active="true"]');

    if (activeEl) {
      setUnderline({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [pathname, role, isMobile]);

  /* =========================
     CLICK OUTSIDE (🔥 FIX)
  ========================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!navRef.current) return;

      if (!navRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* =========================
     ESC TO CLOSE (🔥 BONUS)
  ========================= */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

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
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

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
    <div ref={navRef} style={nav}>
      {/* LOGO */}
      <Link href="/" style={logo}>
        🤖 Inventory AI
      </Link>

      {/* ☰ MOBILE */}
      {isMobile && (
        <button onClick={() => setOpen(!open)} style={hamburger}>
          ☰
        </button>
      )}

      {/* MENU */}
      <div
        style={{
          ...menu,
          ...(isMobile ? (open ? mobileMenu : { display: "none" }) : {}),
        }}
      >
        {/* underline desktop */}
        {!isMobile && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              height: 3,
              background: "#2563eb",
              borderRadius: 2,
              transition: "all 0.3s",
              left: underline.left,
              width: underline.width,
            }}
          />
        )}

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
                color: isActive ? "#2563eb" : "var(--text)",
              }}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}

        {/* USER */}
        {!user ? (
          <button onClick={login} style={loginBtn}>
            Login
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
  background: "var(--card)",
  borderBottom: "1px solid var(--border)",
  padding: "12px 20px",
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

const hamburger = {
  fontSize: 24,
  background: "none",
  border: "none",
  cursor: "pointer",
};

const menu = {
  display: "flex",
  gap: 20,
  alignItems: "center",
  position: "relative",
};

const mobileMenu = {
  position: "absolute",
  top: 60,
  right: 10,
  flexDirection: "column",
  background: "var(--card)",
  padding: 15,
  borderRadius: 10,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  alignItems: "flex-start",
};

const link = {
  textDecoration: "none",
  fontWeight: 500,
};

const loginBtn = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: 6,
};

const logoutBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: 6,
};

const userBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const avatarStyle = {
  width: 28,
  height: 28,
  borderRadius: "50%",
};

const avatarFallback = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#6366f1",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nameStyle = {
  fontSize: 12,
};

const emailStyle = {
  fontSize: 10,
  color: "#888",
};

const roleStyle = {
  marginLeft: 4,
  fontSize: 11,
  color: "#888",
};
