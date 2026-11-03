"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatToman, toPersianDigits, formatDateTime } from "@/lib/utils";
import { CreditCard, Search, Filter, Loader2, RotateCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [authoritySearch, setAuthoritySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const fetchPayments = () => {
    setLoading(true);
    setErrorMsg("");
    const token = "";
    api.getAdminPayments(token, {
      authority: authoritySearch.trim() || undefined,
      status: statusFilter || undefined,
    })
      .then((data) => {
        setPayments(data || []);
        setErrorMsg("");
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.message || "خطا در دریافت لیست تراکنش‌ها");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleRetryVerification = async (paymentId: number) => {
    setRetryingId(paymentId);
    const token = "";
    try {
      const res = await api.retryPaymentVerification(token, paymentId);
      alert(`نتیجه اعتبارسنجی: ${res.result} - ${res.message}`);
      fetchPayments();
    } catch (err: any) {
      alert("خطا در بازبینی تراکنش: " + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#246D7A]">سوابق تراکنش‌های درگاه پرداخت</h1>
        <p className="text-xs text-[#526A70] mt-1">
          رهگیری کدهای Authority زرین‌پال، مبالغ به ریال/تومان و امکان استعلام مجدد وضعیت
        </p>
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
              value={authoritySearch}
              onChange={(e) => setAuthoritySearch(e.target.value)}
              placeholder="جستجو بر اساس کد Authority یا شناسه سفارش..."
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
            <option value="VERIFIED">تأیید و تسویه شده</option>
            <option value="PENDING">در انتظار پرداخت</option>
            <option value="FAILED">ناموفق</option>
            <option value="CANCELLED">لغو شده</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#DCE9E8] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#246D7A] mx-auto mb-2" />
            <span className="text-xs text-[#526A70]">در حال دریافت سوابق تراکنش‌ها...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#526A70]">
            هیچ تراکنشی یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F3F8F7]/80 text-[#526A70] border-b border-[#DCE9E8]">
                <tr>
                  <th className="py-3 px-4">شناسه Authority</th>
                  <th className="py-3 px-4">خریدار</th>
                  <th className="py-3 px-4">مبلغ (تومان)</th>
                  <th className="py-3 px-4">مبلغ به ریال (درگاه)</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4">کد رهگیری (RefID)</th>
                  <th className="py-3 px-4">زمان ثبت</th>
                  <th className="py-3 px-4">استعلام مجدد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE9E8]/50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F3F8F7]/40">
                    <td className="py-3.5 px-4 font-mono font-medium" dir="ltr">
                      {p.authority ? `${p.authority.substring(0, 16)}...` : "-"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#213F48]">
                      {p.purchaser_name}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#246D7A]">
                      {formatToman(p.amount_toman)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#526A70]" dir="ltr">
                      {p.amount_rial?.toLocaleString("fa-IR")} ریال
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === "VERIFIED" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#246D7A]/10 text-[#246D7A]">
                          تأیید شده
                        </span>
                      )}
                      {p.status === "PENDING" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C85D3D]/20 text-[#A9453A]">
                          در انتظار
                        </span>
                      )}
                      {p.status === "FAILED" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#526A70]/15 text-[#526A70]">
                          ناموفق
                        </span>
                      )}
                      {p.status === "CANCELLED" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A9453A]/15 text-[#A9453A]">
                          لغو کاربر
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]" dir="ltr">
                      {p.reference_id || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[#526A70]">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status !== "VERIFIED" && p.authority && (
                        <button
                          onClick={() => handleRetryVerification(p.id)}
                          disabled={retryingId === p.id}
                          className="px-2.5 py-1 rounded-lg bg-[#246D7A]/10 hover:bg-[#246D7A]/20 text-[#246D7A] font-bold text-[11px] flex items-center gap-1"
                          title="استعلام وضعیت از سرور زرین‌پال"
                        >
                          {retryingId === p.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCw className="w-3 h-3" />
                          )}
                          استعلام
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

