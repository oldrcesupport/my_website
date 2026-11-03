"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatToman, toPersianDigits, formatDateTime } from "@/lib/utils";
import { ShoppingBag, Search, Filter, Loader2, Eye, X } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    setErrorMsg("");
    const token = "";
    api.getAdminOrders(token, {
      search: search.trim() || undefined,
      status: statusFilter || undefined,
    })
      .then((data) => {
        setOrders(data || []);
        setErrorMsg("");
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.message || "خطا در دریافت لیست سفارش‌ها");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleViewDetail = (publicId: string) => {
    setDetailLoading(true);
    const token = "";
    api.getAdminOrderDetail(token, publicId)
      .then((data) => setSelectedOrder(data))
      .catch((err) => alert("خطا در بارگذاری جزئیات: " + err.message))
      .finally(() => setDetailLoading(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#246D7A]">مدیریت سفارش‌ها</h1>
          <p className="text-xs text-[#526A70] mt-1">
            مشاهده، جستجو و پیگیری وضعیت کلیه سفارش‌های خرید بلیت
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#A9453A]/10 border border-[#A9453A]/30 text-xs text-[#A9453A]">
          {errorMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#DCE9E8] flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام، شماره تلفن خریدار یا شناسه سفارش..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48] focus:outline-none focus:ring-1 focus:ring-[#246D7A]"
            />
            <Search className="w-4 h-4 text-[#526A70] absolute right-3.5 top-3" />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#246D7A] text-[#FFFFFF] text-xs font-bold hover:bg-[#195560]"
          >
            جستجو
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#526A70]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48] focus:outline-none"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="PAID">پرداخت شده</option>
            <option value="PENDING_PAYMENT">در انتظار پرداخت</option>
            <option value="PAID_LATE_REVIEW">بازبینی دیرهنگام</option>
            <option value="PAYMENT_FAILED">پرداخت ناموفق</option>
            <option value="CANCELLED">لغو شده</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#DCE9E8] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#246D7A] mx-auto mb-2" />
            <span className="text-xs text-[#526A70]">در حال دریافت لیست سفارش‌ها...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#526A70]">
            هیچ سفارشی مطابق با جستجوی شما یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F3F8F7]/80 text-[#526A70] border-b border-[#DCE9E8]">
                <tr>
                  <th className="py-3 px-4">شناسه سفارش</th>
                  <th className="py-3 px-4">نام خریدار</th>
                  <th className="py-3 px-4">تلفن همراه</th>
                  <th className="py-3 px-4">تعداد بلیت</th>
                  <th className="py-3 px-4">مبلغ کل</th>
                  <th className="py-3 px-4">روز کاری</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE9E8]/50">
                {orders.map((o) => (
                  <tr key={o.public_id} className="hover:bg-[#F3F8F7]/40">
                    <td className="py-3.5 px-4 font-mono font-medium" dir="ltr">
                      {o.public_id.substring(0, 8)}...
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#213F48]">{o.purchaser_name}</td>
                    <td className="py-3.5 px-4 font-mono text-[#526A70]" dir="ltr">{o.purchaser_phone}</td>
                    <td className="py-3.5 px-4">{toPersianDigits(o.quantity)} عدد</td>
                    <td className="py-3.5 px-4 font-bold text-[#246D7A]">{formatToman(o.total_price_toman)}</td>
                    <td className="py-3.5 px-4">{o.business_date}</td>
                    <td className="py-3.5 px-4">
                      {o.status === "PAID" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#246D7A]/10 text-[#246D7A]">
                          پرداخت شده
                        </span>
                      )}
                      {o.status === "PENDING_PAYMENT" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C85D3D]/20 text-[#A9453A]">
                          در انتظار درگاه
                        </span>
                      )}
                      {o.status === "PAID_LATE_REVIEW" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A9453A]/20 text-[#A9453A]">
                          بازبینی دیرهنگام
                        </span>
                      )}
                      {o.status === "PAYMENT_FAILED" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#526A70]/15 text-[#526A70]">
                          ناموفق
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleViewDetail(o.public_id)}
                        className="p-1.5 rounded-lg bg-[#246D7A]/5 text-[#246D7A] hover:bg-[#246D7A]/15 transition-colors"
                        title="مشاهده جزئیات سفارش و بلیت‌ها"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-[#173643]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-[#DCE9E8] shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCE9E8]">
              <h2 className="text-base font-bold text-[#246D7A]">
                جزئیات کامل سفارش: {selectedOrder.purchaser_name}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl hover:bg-[#DCE9E8] text-[#526A70]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#F3F8F7]/60">
                <span className="text-[#526A70] block">شناسه یکتا:</span>
                <span className="font-mono font-bold" dir="ltr">{selectedOrder.public_id}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F3F8F7]/60">
                <span className="text-[#526A70] block">شماره تماس:</span>
                <span className="font-mono font-bold" dir="ltr">{selectedOrder.purchaser_phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F3F8F7]/60">
                <span className="text-[#526A70] block">مبلغ کل:</span>
                <span className="font-bold text-[#246D7A]">{formatToman(selectedOrder.total_price_toman)}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F3F8F7]/60">
                <span className="text-[#526A70] block">وضعیت:</span>
                <span className="font-bold">{selectedOrder.status}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F3F8F7]/60">
                <span className="text-[#526A70] block">تاریخ ثبت:</span>
                <span>{formatDateTime(selectedOrder.created_at)}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F3F8F7]/60">
                <span className="text-[#526A70] block">تاریخ پرداخت:</span>
                <span>{selectedOrder.paid_at ? formatDateTime(selectedOrder.paid_at) : "ثبت نشده"}</span>
              </div>
            </div>

            {/* Tickets */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#246D7A]">بلیت‌های تابعه ({selectedOrder.tickets?.length || 0} عدد):</h3>
              <div className="space-y-2">
                {selectedOrder.tickets?.map((t: any) => (
                  <div key={t.id} className="p-3 rounded-xl bg-[#FFFFFF] border border-[#DCE9E8] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#246D7A] block" dir="ltr">{t.ticket_number}</span>
                      <span className="text-[11px] text-[#526A70]">وضعیت: {t.effective_status}</span>
                    </div>
                    {t.used_at && (
                      <span className="text-[11px] text-[#A9453A]">پذیرش: {formatDateTime(t.used_at)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment attempts */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#246D7A]">سوابق نشست درگاه پرداخت:</h3>
              <div className="space-y-2">
                {selectedOrder.payment_attempts?.map((p: any) => (
                  <div key={p.id} className="p-3 rounded-xl bg-[#F3F8F7]/60 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#526A70]">درگاه: {p.provider} ({p.status})</span>
                      <span className="font-bold text-[#246D7A]">{formatToman(p.amount_toman)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px] text-[#526A70]">
                      <span>کد Authority: {p.authority || "ندارد"}</span>
                      <span>RefID: {p.reference_id || "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

