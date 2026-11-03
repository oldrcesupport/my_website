"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Lock, User, KeyRound, Loader2, AlertCircle, Ticket } from "lucide-react";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPath = searchParams.get("redirect") || "";
  const redirectPath = requestedPath.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/admin/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.login(username.trim(), password);
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || "نام کاربری یا رمز عبور نامعتبر است.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8F7] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-[#FFFFFF] rounded-3xl p-8 border border-[#DCE9E8] shadow-lg space-y-6">
        
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#246D7A] text-[#FFFFFF] mx-auto flex items-center justify-center shadow-xs">
            <Ticket className="w-7 h-7 text-[#C85D3D]" />
          </div>
          <h1 className="text-2xl font-bold text-[#246D7A]">ورود به پرتال مدیریت و پرسنل</h1>
          <p className="text-xs text-[#526A70]">
            دسترسی به داشبورد، مدیریت بلیت‌ها، تنظیمات و گیت ورودی
          </p>
        </div>

        {error && (
          <div role="alert" className="p-4 rounded-xl bg-[#A9453A]/10 border border-[#A9453A]/30 text-xs text-[#A9453A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="staff-username" className="block text-xs font-semibold text-[#213F48] mb-1.5">
              نام کاربری
            </label>
            <div className="relative">
              <input
                id="staff-username"
                autoComplete="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin یا نام کاربری پرسنل..."
                dir="ltr"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-sm text-[#213F48] focus:outline-none focus:ring-2 focus:ring-[#246D7A]"
              />
              <User className="w-4 h-4 text-[#526A70] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label htmlFor="staff-password" className="block text-xs font-semibold text-[#213F48] mb-1.5">
              رمز عبور
            </label>
            <div className="relative">
              <input
                id="staff-password"
                autoComplete="current-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-sm text-[#213F48] focus:outline-none focus:ring-2 focus:ring-[#246D7A]"
              />
              <KeyRound className="w-4 h-4 text-[#526A70] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#246D7A] text-[#FFFFFF] hover:bg-[#195560] text-sm font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C85D3D]" />
                <span>در حال بررسی اعتبار...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-[#C85D3D]" />
                <span>ورود به سیستم</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#DCE9E8] text-center">
          <Link href="/" className="text-xs text-[#526A70] hover:text-[#246D7A]">
            بازگشت به وب‌سایت اصلی رستوران
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3F8F7] flex items-center justify-center">در حال بارگذاری...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}

