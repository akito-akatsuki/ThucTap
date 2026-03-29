"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Scan,
  LayoutDashboard,
  Home,
} from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef(null);

  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  /* =========================
      LOGIN (🔥 FIX 404)
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
    const activeEl = navRef.current?.querySelector(`[data-path="${pathname}"]`);
    if (activeEl) {
      setUnderline({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [pathname, role]);

  /* =========================
      NAV ITEMS
  ========================= */
  const navItems = [
    { href: "/", label: "Home", icon: <Home size={18} /> },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    { href: "/scan", label: "Scanner", icon: <Scan size={18} /> },
    ...(role === "admin"
      ? [
          {
            href: "/employees",
            label: "Employees",
            icon: <ShieldCheck size={18} />,
          },
        ]
      : []),
  ];

  const avatar =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-[100] w-full border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 sm:px-8"
    >
      <div className="max-w-[1500px] mx-auto flex h-20 items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
            <span className="text-white text-xl">🤖</span>
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tighter hidden sm:block">
            INVENTORY<span className="text-blue-600">AI</span>
          </span>
        </Link>

        {/* NAV DESKTOP */}
        <div className="hidden md:flex items-center gap-1 relative h-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-path={item.href}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}

          {/* underline */}
          <div
            className="absolute bottom-4 h-1 bg-blue-600 rounded-full transition-all duration-300"
            style={{ left: underline.left, width: underline.width }}
          />
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {!user ? (
            <button
              onClick={login}
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition shadow-lg shadow-gray-200"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-gray-50 p-1.5 pr-4 rounded-2xl border border-gray-100">
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-9 h-9 rounded-xl object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="hidden lg:block leading-tight">
                <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
                  {user.user_metadata?.full_name || "User"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {role || "Member"}
                </p>
              </div>

              <button
                onClick={logout}
                className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 p-4 space-y-2 shadow-xl">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 p-4 rounded-2xl font-bold ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
