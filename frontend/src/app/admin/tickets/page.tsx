"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toPersianDigits, formatDateTime } from "@/lib/utils";
import { Ticket, Search, Filter, Loader2, Ban, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchTickets = () => {
    setLoading(true);
    setErrorMsg("");
    const token = "";
    api.getAdminTickets(token, {
      search: search.trim() || undefined,
      status: statusFilter || undefined,
    })
      .then((data) => {
        setTickets(data || []);
        setErrorMsg("");
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.message || "خطا در دریافت لیست بلیت‌ها");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleCancelTicket = async (ticketId: number, ticketNumber: string) => {
    if (!confirm(`آیا از لغو و باطل کردن بلیت ${ticketNumber} اطمینان دارید؟ این عمل غیرقابل بازگشت است.`)) {
      return;
    }

    const token = "";
    try {
      await api.cancelAdminTicket(token, ticketId);
      alert(`بلیت ${ticketNumber} با موفقیت لغو شد.`);
      fetchTickets();
    } catch (err: any) {
      alert("خطا در لغو بلیت: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#203D33]">مدیریت بلیت‌های صادرشده</h1>
        <p className="text-xs text-[#77756D] mt-1">
          فهرست کلیه بلیت‌های انفرادی صادرشده، وضعیت پذیرش و امکان ابطال
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#A85E48]/10 border border-[#A85E48]/30 text-xs text-[#A85E48]">
          {errorMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFCF6] rounded-2xl p-4 border border-[#E6DED1] flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس شماره بلیت، نام خریدار یا شماره تلفن..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#F5F0E7]/60 border border-[#E6DED1] text-xs text-[#262A25] focus:outline-none focus:ring-1 focus:ring-[#203D33]"
            />
            <Search className="w-4 h-4 text-[#77756D] absolute right-3.5 top-3" />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#203D33] text-[#FFFCF6] text-xs font-bold hover:bg-[#294D40]"
          >
            جستجو
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#77756D]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#F5F0E7]/60 border border-[#E6DED1] text-xs text-[#262A25] focus:outline-none"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="ISSUED">صادر شده (معتبر)</option>
            <option value="USED">استفاده شده</option>
            <option value="CANCELLED">لغو شده</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-[#FFFCF6] rounded-3xl border border-[#E6DED1] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#203D33] mx-auto mb-2" />
            <span className="text-xs text-[#77756D]">در حال دریافت لیست بلیت‌ها...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#77756D]">
            هیچ بلیتی یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F5F0E7]/80 text-[#77756D] border-b border-[#E6DED1]">
                <tr>
                  <th className="py-3 px-4">شماره بلیت</th>
                  <th className="py-3 px-4">خریدار</th>
                  <th className="py-3 px-4">تاریخ روز کاری</th>
                  <th className="py-3 px-4">پایان اعتبار</th>
                  <th className="py-3 px-4">وضعیت پذیرش</th>
                  <th className="py-3 px-4">زمان استفاده</th>
                  <th className="py-3 px-4">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DED1]/50">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F5F0E7]/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#203D33]" dir="ltr">
                      {t.ticket_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold block text-[#262A25]">{t.purchaser_name}</span>
                      <span className="font-mono text-[#77756D] text-[11px]" dir="ltr">{t.purchaser_phone}</span>
                    </td>
                    <td className="py-3.5 px-4">{t.business_date}</td>
                    <td className="py-3.5 px-4 text-[11px] text-[#77756D]">{formatDateTime(t.valid_until)}</td>
                    <td className="py-3.5 px-4">
                      {t.effective_status === "VALID" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#203D33]/10 text-[#203D33]">
                          <CheckCircle2 className="w-3 h-3 text-[#203D33]" />
                          معتبر جهت ورود
                        </span>
                      )}
                      {t.effective_status === "USED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A85E48]/20 text-[#A85E48]">
                          <CheckCircle2 className="w-3 h-3 text-[#A85E48]" />
                          استفاده شده
                        </span>
                      )}
                      {t.effective_status === "EXPIRED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#77756D]/15 text-[#77756D]">
                          <Clock className="w-3 h-3" />
                          منقضی شده
                        </span>
                      )}
                      {t.effective_status === "CANCELLED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A85E48] text-[#FFFCF6]">
                          <XCircle className="w-3 h-3" />
                          لغو شده
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[#77756D]">
                      {t.used_at ? formatDateTime(t.used_at) : "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.status === "ISSUED" && t.effective_status !== "USED" && (
                        <button
                          onClick={() => handleCancelTicket(t.id, t.ticket_number)}
                          className="px-2.5 py-1 rounded-lg bg-[#A85E48]/10 text-[#A85E48] hover:bg-[#A85E48]/20 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="لغو و ابطال این بلیت"
                        >
                          <Ban className="w-3 h-3" />
                          ابطال
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

