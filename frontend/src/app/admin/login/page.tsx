"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Lock, User, KeyRound, Loader2, AlertCircle, Music2 } from "lucide-react";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.login(username.trim(), password);
      localStorage.setItem("staff_token", res.token);
      localStorage.setItem("staff_user", JSON.stringify(res.user));
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || "نام کاربری یا رمز عبور نامعتبر است.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-[#FFFCF6] rounded-3xl p-8 border border-[#E6DED1] shadow-lg space-y-6">
        
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#203D33] text-[#FFFCF6] mx-auto flex items-center justify-center shadow-xs">
            <Music2 className="w-7 h-7 text-[#C3A16A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#203D33]">ورود به پرتال مدیریت و پرسنل</h1>
          <p className="text-xs text-[#77756D]">
            دسترسی به داشبورد، مدیریت بلیت‌ها، تنظیمات و گیت ورودی
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#A85E48]/10 border border-[#A85E48]/30 text-xs text-[#A85E48] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#262A25] mb-1.5">
              نام کاربری
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin یا نام کاربری پرسنل..."
                dir="ltr"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F0E7]/60 border border-[#E6DED1] text-sm text-[#262A25] focus:outline-none focus:ring-2 focus:ring-[#203D33]"
              />
              <User className="w-4 h-4 text-[#77756D] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#262A25] mb-1.5">
              رمز عبور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F0E7]/60 border border-[#E6DED1] text-sm text-[#262A25] focus:outline-none focus:ring-2 focus:ring-[#203D33]"
              />
              <KeyRound className="w-4 h-4 text-[#77756D] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#203D33] text-[#FFFCF6] hover:bg-[#294D40] text-sm font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C3A16A]" />
                <span>در حال بررسی اعتبار...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-[#C3A16A]" />
                <span>ورود به سیستم</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#E6DED1] text-center">
          <Link href="/" className="text-xs text-[#77756D] hover:text-[#203D33]">
            بازگشت به وب‌سایت اصلی رستوران
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center">در حال بارگذاری...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}

