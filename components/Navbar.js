"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Menu,
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
  // Login form states
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const loginFormCardRef = useRef(null);

  /* =========================
      LOGIN (🔥 FIX 404)
  ========================= */
  const toggleLoginForm = () => {
    if (!showLoginForm) {
      setIsAnimating(true);
      setTimeout(() => setShowLoginForm(true), 50);
    } else {
      setIsAnimating(false);
      setTimeout(() => setShowLoginForm(false), 250);
    }
    setLoginError("");
  };

  const closeLoginForm = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowLoginForm(false);
      setEmail("");
      setPassword("");
      setLoginError("");
    }, 250);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      closeLoginForm();
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const googleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    closeLoginForm();
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

  // Click outside to close login form
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        loginFormCardRef.current &&
        !loginFormCardRef.current.contains(event.target)
      ) {
        closeLoginForm();
      }
    };

    if (showLoginForm) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showLoginForm]);

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-[100] w-full border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-8"
    >
      <div className="max-w-[1500px] mx-auto flex h-20 items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
            <span className="text-white text-xl">🤖</span>
          </div>
          <span className="text-xl font-black text-gray-900 dark:text-slate-100 tracking-tighter hidden sm:block">
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
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-900"
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
            <div className="relative">
              <button
                onClick={toggleLoginForm}
                className="px-6 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-bold rounded-2xl hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-200 transition-all duration-300 scale-100 hover:scale-105 active:scale-95 shadow-lg shadow-gray-200"
              >
                Login
              </button>

              {isAnimating && (
                <>
                  {/* Backdrop */}
                  <div
                    className={`fixed inset-0 z-[49] bg-black/40 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] opacity-0 ${showLoginForm ? "opacity-100 delay-150" : "opacity-0"}`}
                    style={{
                      animation: showLoginForm
                        ? "fadeIn 0.5s cubic-bezier(0.4,0,0.2,1) forwards"
                        : "fadeOut 0.4s cubic-bezier(0.4,0,0.2,1) forwards",
                    }}
                    onClick={closeLoginForm}
                  />

                  {/* Login Form */}
                  <div
                    className={`fixed inset-0 z-[60] flex min-h-screen items-center justify-center p-4 overflow-y-auto md:inset-auto md:absolute md:right-0 md:top-full md:mt-3 ${showLoginForm ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    onClick={(event) => {
                      if (event.target === event.currentTarget) {
                        closeLoginForm();
                      }
                    }}
                  >
                    <div
                      ref={loginFormCardRef}
                      className={`relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700 p-8 transition-all duration-300 ${showLoginForm ? "opacity-100 scale-100" : "opacity-0 scale-95"} max-h-[calc(100vh-4rem)] overflow-y-auto`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                          Đăng nhập
                        </h3>
                        <button
                          onClick={closeLoginForm}
                          className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm font-medium text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Nhập email của bạn"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">
                            Mật khẩu
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm font-medium text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                              placeholder="Nhập mật khẩu"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-100 p-1 transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>

                        {loginError && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
                            <p className="text-sm text-red-700 dark:text-red-200 font-medium">
                              {loginError}
                            </p>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all duration-300 shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300 text-sm"
                        >
                          Đăng nhập
                        </button>
                      </form>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="px-4 bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 font-bold">
                            Hoặc
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={googleLogin}
                        className="w-full py-3.5 px-6 border-2 border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-gray-900 dark:text-slate-100 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-950 hover:border-blue-300 hover:shadow-xl hover:shadow-white/20 transition-all duration-300 active:scale-95 shadow-lg shadow-gray-100 dark:shadow-none flex items-center justify-center gap-3 text-sm"
                      >
                        <span className="w-5 h-5 bg-[url('https://cdn-icons-png.flaticon.com/32/281/281764.png')] bg-cover bg-center bg-no-repeat" />
                        Đăng nhập với Google
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-900 p-1.5 pr-4 rounded-2xl border border-gray-100 dark:border-slate-700">
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-9 h-9 rounded-xl object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="hidden lg:block leading-tight">
                <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate max-w-[120px]">
                  {user.user_metadata?.full_name || "User"}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">
                  {role || "Member"}
                </p>
              </div>

              <button
                onClick={logout}
                className="ml-2 p-2 text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden p-2 text-gray-600 dark:text-slate-300"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 p-4 space-y-2 shadow-xl">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 p-4 rounded-2xl font-bold ${
                pathname === item.href
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300"
                  : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900"
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
