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
  ChevronLeft,
  Loader2,
  ShieldAlert,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Skip auth check on login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    api.getMe("")
      .then((u) => {
        setUser(u);
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403) {
          router.push(`/admin/login?redirect=${pathname}`);
        } else {
          setAuthError("ارتباط با سرور برای بررسی نشست برقرار نشد. دوباره تلاش کنید.");
        }
      })
      .finally(() => setLoading(false));
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await api.logout("");
      router.push("/admin/login");
    } catch {
      window.alert("خروج انجام نشد. لطفاً اتصال را بررسی و دوباره تلاش کنید.");
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F8F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#246D7A]" />
      </div>
    );
  }

  if (authError) {
    return <div role="alert" className="min-h-screen p-8 text-center">{authError} <button className="underline" onClick={() => window.location.reload()}>تلاش مجدد</button></div>;
  }

  // If user is logged in as scanner-only staff, show clean role explanation with switch button
  if (user && !user.is_admin && !user.is_super_admin) {
    return (
      <div className="min-h-screen bg-[#F3F8F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FFFFFF] rounded-3xl p-8 border border-[#A9453A]/30 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#A9453A]/10 text-[#A9453A] mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-[#A9453A]" />
          </div>
          <h2 className="text-lg font-bold text-[#246D7A]">دسترسی محدود پرسنل گیت</h2>
          <p className="text-xs text-[#526A70] leading-relaxed">
            شما با حساب <strong>{user.display_name || user.username}</strong> (پرسنل گیت) وارد شده‌اید. این حساب فقط اجازه ثبت و اسکن بلیت در گیت ورودی را دارد و دسترسی به آمار مالی و سفارش‌ها را ندارد.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-[#246D7A] text-[#FFFFFF] text-xs font-bold hover:bg-[#195560] transition-colors"
            >
              خروج و ورود با حساب مدیر
            </button>
            <Link
              href="/staff/scanner"
              className="w-full py-3 rounded-xl bg-[#FFFFFF] text-[#246D7A] border border-[#DCE9E8] text-xs font-semibold hover:bg-[#F3F8F7] transition-colors"
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
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span><Ticket size={21} /></span><div><strong>مدیریت سالن</strong><small>موسیقی زنده</small></div><button type="button" className="admin-menu-toggle" aria-expanded={mobileNavOpen} aria-controls="admin-navigation" onClick={() => setMobileNavOpen(!mobileNavOpen)}>{mobileNavOpen ? "بستن" : "منو"}</button></div>
        <nav id="admin-navigation" className={`admin-navigation ${mobileNavOpen ? "is-open" : ""}`} aria-label="منوی مدیریت">
          <span className="admin-nav-caption">مدیریت</span>
          {navItems.map((item) => { const Icon = item.icon; const active = pathname === item.href; return <Link key={item.href} href={item.href} onClick={() => setMobileNavOpen(false)} aria-current={active ? "page" : undefined} className={`admin-nav-link ${active ? "is-active" : ""}`}><Icon size={18} /><span>{item.label}</span>{active && <ChevronLeft size={16} className="admin-nav-arrow" />}</Link>; })}
          <span className="admin-nav-caption admin-nav-separator">پذیرش</span><Link href="/staff/scanner" className="admin-nav-link" onClick={() => setMobileNavOpen(false)}><QrCode size={18}/><span>گیت ورود</span></Link>
        </nav>
        <div className={`admin-account ${mobileNavOpen ? "is-open" : ""}`}><div className="admin-avatar">{(user?.display_name || user?.username || "م").slice(0,1)}</div><div className="admin-account-text"><strong>{user?.display_name || user?.username}</strong><small>{user?.is_super_admin ? "مدیر ارشد" : "مدیر عملیات"}</small></div><button onClick={handleLogout} aria-label="خروج از حساب" title="خروج از حساب"><LogOut size={18}/></button></div>
      </aside>
      <main className="admin-main"><div className="admin-mobile-heading"><span>مدیریت سالن</span><span>موسیقی زنده</span></div><div className="admin-content">{children}</div></main>
    </div>
  );
}
