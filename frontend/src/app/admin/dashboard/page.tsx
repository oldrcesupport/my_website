"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { DashboardStats } from "@/types";
import { formatToman, toPersianDigits, formatTimeOnly } from "@/lib/utils";
import {
  Ticket,
  TrendingUp,
  UserCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("staff_token") || "" : "";
    api.getDashboardStats(token)
      .then((data) => {
        setStats(data);
        setError("");
      })
      .catch((err) => {
        console.error("Failed to load dashboard stats:", err);
        setError(err.message || "خطا در بارگذاری آمار داشبورد");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#203D33] mx-auto mb-2" />
        <span className="text-xs text-[#77756D]">در حال بارگذاری آمار روز جاری...</span>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="py-12 px-4 max-w-lg mx-auto text-center space-y-4">
        <div className="p-6 rounded-3xl bg-[#FFFCF6] border border-[#A85E48]/30 shadow-xs space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#A85E48] mx-auto" />
          <h2 className="text-base font-bold text-[#203D33]">خطا در دسترسی به داشبورد</h2>
          <p className="text-xs text-[#77756D] leading-relaxed">
            {error.includes("403") || error.includes("عدم دسترسی")
              ? "حساب کاربری فعلی شما دسترسی به داشبورد مدیریتی را ندارد. برای مشاهده گزارشات مالی و سفارش‌ها، لطفاً با نام کاربری admin وارد شوید."
              : error}
          </p>
          <div className="pt-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#203D33] text-[#FFFCF6] text-xs font-bold"
            >
              ورود با حساب مدیر ارشد (admin)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title & Date Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#203D33]">
            داشبورد عملیات زنده
          </h1>
          <p className="text-xs sm:text-sm text-[#77756D] mt-1">
            آمار واقعی فروش و پذیرش سالن موسیقی در روز کاری جاری
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFCF6] border border-[#E6DED1] text-xs font-semibold text-[#203D33] shadow-xs">
          <Calendar className="w-4 h-4 text-[#C3A16A]" />
          <span>تاریخ روز کاری:</span>
          <span className="font-mono text-sm">{stats?.current_business_date || "-"}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Paid Tickets Count */}
        <div className="bg-[#FFFCF6] rounded-3xl p-6 border border-[#E6DED1] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#77756D]">بلیت‌های فروخته‌شده امروز</span>
            <div className="w-10 h-10 rounded-xl bg-[#203D33]/10 text-[#203D33] flex items-center justify-center">
              <Ticket className="w-5 h-5 text-[#203D33]" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#203D33]">
            {toPersianDigits(stats?.today_paid_tickets_count || 0)}{" "}
            <span className="text-sm font-normal text-[#77756D]">عدد</span>
          </div>
          <p className="text-[11px] text-[#77756D]">تعداد کل نفرات پذیرفته‌شده برای امشب</p>
        </div>

        {/* Card 2: Today Revenue */}
        <div className="bg-[#FFFCF6] rounded-3xl p-6 border border-[#E6DED1] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#77756D]">درآمد تأییدشده امروز</span>
            <div className="w-10 h-10 rounded-xl bg-[#C3A16A]/15 text-[#C3A16A] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#A85E48]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#203D33]">
            {formatToman(stats?.today_revenue_toman || 0)}
          </div>
          <p className="text-[11px] text-[#77756D]">مجموع تسویه‌های قطعی درگاه بانکی</p>
        </div>

        {/* Card 3: Check-ins */}
        <div className="bg-[#FFFCF6] rounded-3xl p-6 border border-[#E6DED1] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#77756D]">ورودهای ثبت‌شده در گیت</span>
            <div className="w-10 h-10 rounded-xl bg-[#203D33] text-[#FFFCF6] flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[#C3A16A]" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#203D33]">
            {toPersianDigits(stats?.today_checkins_count || 0)}{" "}
            <span className="text-sm font-normal text-[#77756D]">نفر</span>
          </div>
          <p className="text-[11px] text-[#77756D]">مهمانانی که بارکدشان در ورودی اسکن و پذیرش شده</p>
        </div>

        {/* Card 4: Unused Valid Tickets */}
        <div className="bg-[#FFFCF6] rounded-3xl p-6 border border-[#E6DED1] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#77756D]">بلیت‌های معتبر باقی‌مانده</span>
            <div className="w-10 h-10 rounded-xl bg-[#C3A16A]/10 text-[#C3A16A] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#C3A16A]" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#203D33]">
            {toPersianDigits(stats?.today_unused_valid_tickets || 0)}{" "}
            <span className="text-sm font-normal text-[#77756D]">بلیت</span>
          </div>
          <p className="text-[11px] text-[#77756D]">خریدارانی که هنوز وارد سالن موسیقی نشده‌اند</p>
        </div>

        {/* Card 5: Late Review / Attention */}
        <div className="bg-[#FFFCF6] rounded-3xl p-6 border border-[#E6DED1] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#77756D]">سفارش‌های دیرهنگام (بازبینی)</span>
            <div className="w-10 h-10 rounded-xl bg-[#A85E48]/15 text-[#A85E48] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#A85E48]" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#A85E48]">
            {toPersianDigits(stats?.late_review_orders_count || 0)}{" "}
            <span className="text-sm font-normal text-[#77756D]">مورد</span>
          </div>
          <p className="text-[11px] text-[#77756D]">پرداخت پس از پایان ساعت کاری (نیازمند استرداد یا هماهنگی)</p>
        </div>

      </div>

      {/* Two Column Section: Recent Orders & Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-7 bg-[#FFFCF6] rounded-3xl p-6 border border-[#E6DED1] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#203D33]">
              آخرین سفارش‌های ثبت‌شده
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#203D33] hover:text-[#C3A16A] flex items-center gap-1"
            >
              <span>مشاهده همه</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#E6DED1] text-[#77756D]">
                  <th className="py-2.5 px-3">خریدار</th>
                  <th className="py-2.5 px-3">تماس</th>
                  <th className="py-2.5 px-3">تعداد</th>
                  <th className="py-2.5 px-3">مبلغ</th>
                  <th className="py-2.5 px-3">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DED1]/50">
                {!stats?.recent_orders || stats.recent_orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#77756D]">
                      هنوز هیچ سفارشی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  stats.recent_orders.map((o) => (
                    <tr key={o.public_id} className="hover:bg-[#F5F0E7]/40">
                      <td className="py-3 px-3 font-semibold text-[#262A25]">{o.purchaser_name}</td>
                      <td className="py-3 px-3 font-mono text-[#77756D]" dir="ltr">{o.purchaser_phone}</td>
                      <td className="py-3 px-3">{toPersianDigits(o.quantity)}</td>
                      <td className="py-3 px-3 font-semibold text-[#203D33]">
                        {formatToman(o.total_price_toman)}
                      </td>
                      <td className="py-3 px-3">
                        {o.status === "PAID" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#203D33]/10 text-[#203D33]">
                            پرداخت شده
                          </span>
                        )}
                        {o.status === "PENDING_PAYMENT" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C3A16A]/20 text-[#A85E48]">
                            در انتظار درگاه
                          </span>
                        )}
                        {o.status === "PAID_LATE_REVIEW" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A85E48]/20 text-[#A85E48]">
                            بازبینی دیرهنگام
                          </span>
                        )}
                        {o.status === "PAYMENT_FAILED" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#77756D]/15 text-[#77756D]">
                            ناموفق
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Entrance Check-ins */}
        <div className="lg:col-span-5 bg-[#FFFCF6] rounded-3xl p-6 border border-[#E6DED1] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#203D33]">
              ورودهای اخیر گیت
            </h3>
            <Link
              href="/staff/scanner"
              className="text-xs font-semibold text-[#203D33] hover:text-[#C3A16A] flex items-center gap-1"
            >
              <span>گیت اسکنر</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E6DED1]/50 max-h-80 overflow-y-auto">
            {!stats?.recent_checkins || stats.recent_checkins.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#77756D]">
                هنوز ترددی در گیت ورودی ثبت نشده است.
              </div>
            ) : (
              stats.recent_checkins.map((chk) => (
                <div key={chk.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#203D33] block" dir="ltr">
                      {chk.ticket_number || "بارکد نامعتبر"}
                    </span>
                    <span className="text-[11px] text-[#77756D]">
                      ثبت توسط: {chk.staff_username} ({formatTimeOnly(chk.scanned_at)})
                    </span>
                  </div>
                  <div>
                    {chk.result === "SUCCESS" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#203D33]/10 text-[#203D33]">
                        پذیرش شد
                      </span>
                    )}
                    {chk.result === "ALREADY_USED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A85E48]/15 text-[#A85E48]">
                        استفاده قبلی
                      </span>
                    )}
                    {chk.result !== "SUCCESS" && chk.result !== "ALREADY_USED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#77756D]/15 text-[#77756D]">
                        {chk.result}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

