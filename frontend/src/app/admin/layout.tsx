"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { StaffUser } from "@/types";
import {
  LayoutDashboard,
  ShoppingBag,
  Ticket,
  CreditCard,
  Settings,
  Users,
  QrCode,
  LogOut,
  Music2,
  ChevronLeft,
  Loader2,
  ShieldAlert,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Skip auth check on login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("staff_token") : "";
    if (!token) {
      router.push(`/admin/login?redirect=${pathname}`);
      return;
    }

    api.getMe(token)
      .then((u) => {
        setUser(u);
      })
      .catch(() => {
        localStorage.removeItem("staff_token");
        router.push(`/admin/login?redirect=${pathname}`);
      })
      .finally(() => setLoading(false));
  }, [pathname, isLoginPage, router]);

  const handleLogout = () => {
    const token = localStorage.getItem("staff_token") || "";
    if (token) {
      api.logout(token).catch(() => {});
    }
    localStorage.removeItem("staff_token");
    localStorage.removeItem("staff_user");
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#203D33]" />
      </div>
    );
  }

  // If user is logged in as scanner-only staff, show clean role explanation with switch button
  if (user && !user.is_admin && !user.is_super_admin) {
    return (
      <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FFFCF6] rounded-3xl p-8 border border-[#A85E48]/30 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#A85E48]/10 text-[#A85E48] mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-[#A85E48]" />
          </div>
          <h2 className="text-lg font-bold text-[#203D33]">دسترسی محدود پرسنل گیت</h2>
          <p className="text-xs text-[#77756D] leading-relaxed">
            شما با حساب <strong>{user.display_name || user.username}</strong> (پرسنل گیت) وارد شده‌اید. این حساب فقط اجازه ثبت و اسکن بلیت در گیت ورودی را دارد و دسترسی به آمار مالی و سفارش‌ها را ندارد.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-[#203D33] text-[#FFFCF6] text-xs font-bold hover:bg-[#294D40] transition-colors"
            >
              خروج و ورود با حساب مدیر ارشد (admin)
            </button>
            <Link
              href="/staff/scanner"
              className="w-full py-3 rounded-xl bg-[#FFFCF6] text-[#203D33] border border-[#E6DED1] text-xs font-semibold hover:bg-[#F5F0E7] transition-colors"
            >
              رفتن به گیت اسکنر ورود
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", label: "داشبورد عملیاتی", icon: LayoutDashboard },
    { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag },
    { href: "/admin/tickets", label: "بلیت‌ها", icon: Ticket },
    { href: "/admin/payments", label: "تراکنش‌های درگاه", icon: CreditCard },
    { href: "/admin/settings", label: "تنظیمات رستوران", icon: Settings },
    { href: "/admin/staff", label: "پرسنل و دسترسی‌ها", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E7] flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#203D33] text-[#FFFCF6] flex flex-col justify-between shrink-0 border-l border-[#294D40]">
        <div>
          {/* Brand Heading */}
          <div className="p-6 border-b border-[#294D40] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C3A16A] text-[#203D33] flex items-center justify-center font-bold">
              <Music2 className="w-5 h-5 text-[#203D33]" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#FFFCF6] block">پنل مدیریت سالن</span>
              <span className="text-xs text-[#C3A16A] block">موسیقی زنده</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? "bg-[#C3A16A] text-[#203D33] font-bold shadow-xs"
                      : "text-[#E6DED1]/80 hover:bg-[#FFFCF6]/10 hover:text-[#FFFCF6]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronLeft className="w-4 h-4" />}
                </Link>
              );
            })}

            <div className="pt-4 border-t border-[#294D40] mt-4">
              <Link
                href="/staff/scanner"
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#C3A16A] hover:bg-[#FFFCF6]/10 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>باز کردن گیت اسکنر ورود</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* User Badge & Logout */}
        <div className="p-4 border-t border-[#294D40] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#FFFCF6] block">
                {user?.display_name || user?.username}
              </span>
              <span className="text-[11px] text-[#C3A16A]">
                {user?.is_super_admin ? "مدیر ارشد" : "مدیر عملیات"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-[#FFFCF6]/10 hover:bg-[#A85E48] text-[#FFFCF6] transition-colors"
              title="خروج از حساب"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* Main Administrative Viewport */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}

