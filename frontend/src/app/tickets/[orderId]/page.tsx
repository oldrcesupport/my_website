"use client";

import React, { useEffect, useState, use, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { OrderTicketsResponse, TicketPass } from "@/types";
import { formatTimeOnly, formatDateTime, toPersianDigits } from "@/lib/utils";
import {
  Ticket,
  Printer,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function TicketPassesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const [data, setData] = useState<OrderTicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const stopPollingRef = useRef(false);

  const fetchTickets = useCallback(
    async (showLoader = false) => {
      if ((document.hidden && !showLoader) || (stopPollingRef.current && !showLoader)) return;
      if (showLoader) setLoading(true);

      try {
        // Authenticated via secure HttpOnly cookie sent automatically with credentials: include
        const res = await api.getOrderTickets(orderId);
        setData(res);
        setError("");

        // Check if all tickets have reached terminal state (all used or expired)
        if (res.tickets && res.tickets.length > 0) {
          const allTerminal = res.tickets.every(
            (t) =>
              t.effective_status === "USED" ||
              t.effective_status === "EXPIRED" ||
              t.effective_status === "CANCELLED"
          );
          if (allTerminal) {
            stopPollingRef.current = true;
          }
        }
      } catch (err: any) {
        const msg = err.message || "خطا در بارگذاری بلیت‌ها یا عدم دسترسی.";
        setError(msg);
        // If 403 Forbidden or 404 Not Found, stop continuous polling
        if (msg.includes("دسترسی") || msg.includes("یافت نشد")) {
          stopPollingRef.current = true;
        }
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    fetchTickets(true);

    const timer = setInterval(() => {
      fetchTickets(false);
    }, 4000);

    return () => clearInterval(timer);
  }, [fetchTickets]);

  const copyToClipboard = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9F9] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#173643] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#536B73]">در حال بارگذاری بلیت‌های ورودی...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F6F9F9] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#FFFFFF] rounded-3xl p-8 border border-[#DCE8E8] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#B34553]/10 text-[#B34553] mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#173643]">خطا در دسترسی به بلیت‌ها</h2>
          <p className="text-sm text-[#536B73]">{error || "بلیت‌های این سفارش یافت نشد."}</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#173643] text-[#FFFFFF] text-xs font-semibold"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9F9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {error && (
          <p role="status" className="rounded-lg border border-[#B34553] bg-white p-4 text-sm text-[#733c2d]">
            به‌روزرسانی وضعیت بلیت ممکن نشد: {error}
          </p>
        )}
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#536B73] hover:text-[#173643] mb-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به صفحه اصلی
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173643]">
              بلیت‌های ورودی موسیقی زنده
            </h1>
            <p className="text-xs sm:text-sm text-[#536B73] mt-1">
              سفارش خریدار: <strong className="text-[#173643]">{data.purchaser_name}</strong> ({toPersianDigits(data.tickets.length)} بلیت)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchTickets(false)}
              className="px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DCE8E8] hover:bg-[#DCE8E8]/30 text-xs font-bold text-[#173643] shadow-xs flex items-center gap-1.5 transition-colors"
              title="به‌روزرسانی وضعیت بلیت‌ها"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#24647B]" />
              <span>به‌روزرسانی</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DCE8E8] hover:bg-[#DCE8E8]/30 text-xs font-bold text-[#173643] shadow-xs flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4 text-[#24647B]" />
              چاپ بلیت‌ها
            </button>
          </div>
        </div>

        {/* Order Details & Bank Reference Pill */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCE8E8] flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs no-print">
          <div className="flex items-center gap-2">
            <span className="text-[#536B73]">شناسه سفارش:</span>
            <span className="font-mono font-bold text-[#173643]">{data.order_public_id}</span>
            <button
              onClick={() => copyToClipboard(data.order_public_id, "order")}
              className="p-1 rounded hover:bg-[#DCE8E8]/50 text-[#536B73]"
              title="کپی شناسه سفارش"
            >
              {copiedField === "order" ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {data.reference_id && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#173643]/5 border border-[#173643]/15">
              <span className="text-[#173643] font-medium">شماره پیگیری بانک:</span>
              <span className="font-mono font-extrabold text-[#173643]">{data.reference_id}</span>
              <button
                onClick={() => copyToClipboard(data.reference_id!, "ref")}
                className="p-1 rounded hover:bg-[#DCE8E8]/50 text-[#536B73]"
                title="کپی شماره پیگیری"
              >
                {copiedField === "ref" ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-[#536B73]">
            <span>تاریخ اعتبار:</span>
            <span className="font-semibold text-[#173643]">{data.business_date} (امروز)</span>
          </div>
        </div>

        {/* Safety & Instructions Banner */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCE8E8] flex items-start gap-3 text-xs text-[#243E46] shadow-xs no-print">
          <ShieldCheck className="w-5 h-5 text-[#173643] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-[#173643] block">راهنمای پذیرش در ورودی:</strong>
            <p className="text-[#536B73] leading-relaxed">
              لطفاً تصویر هر بلیت را همراه داشته باشید و در ورودی سالن موسیقی زنده به مسئول پذیرش نشان دهید تا اسکن شود. هر بارکد مخصوص یک نفر است و پس از یک‌بار اسکن باطل می‌گردد.
            </p>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.tickets.map((ticket, index) => {
            const isUsed = ticket.effective_status === "USED";
            const isExpired = ticket.effective_status === "EXPIRED";
            const isCancelled = ticket.effective_status === "CANCELLED";
            const isValid = ticket.effective_status === "VALID";

            return (
              <div
                key={ticket.id}
                className="ticket-card bg-[#FFFFFF] rounded-3xl border border-[#DCE8E8] overflow-hidden shadow-md flex flex-col justify-between relative transition-all"
              >
                {/* Top Ticket Header */}
                <div className="p-6 bg-[#173643] text-[#FFFFFF] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#24647B] text-[#173643] flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-[#173643]" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#24647B] block font-semibold">
                        بلیت ورودی اختصاصی
                      </span>
                      <span className="text-sm font-bold text-[#FFFFFF] block">
                        بلیت شماره {toPersianDigits(index + 1)} از {toPersianDigits(data.tickets.length)}
                      </span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div>
                    {isValid && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFFFFF]/10 text-[#24647B] border border-[#24647B]/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        معتبر جهت ورود
                      </span>
                    )}
                    {isUsed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#B34553]/20 text-[#FFFFFF] border border-[#B34553]/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#B34553]" />
                        استفاده شده
                      </span>
                    )}
                    {isExpired && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#536B73]/20 text-[#DCE8E8]">
                        <Clock className="w-3.5 h-3.5" />
                        منقضی شده
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#B34553] text-[#FFFFFF]">
                        <XCircle className="w-3.5 h-3.5" />
                        لغو شده
                      </span>
                    )}
                  </div>
                </div>

                {/* QR Code Centerpiece */}
                <div className="p-8 text-center space-y-4">
                  <div className="inline-block p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#DCE8E8] shadow-inner relative">
                    {/* QR Image */}
                    {ticket.qr_data_uri ? (
                      <img
                        src={ticket.qr_data_uri}
                        alt={`QR Code for Ticket ${ticket.ticket_number}`}
                        className={`w-48 h-48 mx-auto transition-opacity ${
                          isUsed || isExpired || isCancelled ? "opacity-30 grayscale" : "opacity-100"
                        }`}
                      />
                    ) : (
                      <div className="w-48 h-48 bg-[#F6F9F9] flex items-center justify-center text-xs text-[#536B73]">
                        بارکد در دسترس نیست
                      </div>
                    )}

                    {/* Overlay if used or expired */}
                    {(isUsed || isExpired || isCancelled) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-4 py-2 rounded-xl bg-[#173643]/80 text-[#FFFFFF] font-extrabold text-sm backdrop-blur-xs">
                          {isUsed ? "استفاده شده" : isExpired ? "منقضی شده" : "باطل شده"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Ticket Serial Number */}
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#536B73] block">
                      شناسه اختصاصی بلیت
                    </span>
                    <span className="text-sm font-mono font-bold text-[#173643] tracking-wider block" dir="ltr">
                      {ticket.ticket_number}
                    </span>
                  </div>
                </div>

                {/* Ticket Details Footer */}
                <div className="p-6 bg-[#F6F9F9]/60 border-t border-dashed border-[#DCE8E8] space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[#536B73]">
                    <span>پذیرش:</span>
                    <span className="font-semibold text-[#173643]">یک نفر (انفرادی)</span>
                  </div>
                  <div className="flex justify-between items-center text-[#536B73]">
                    <span>تاریخ اعتبار:</span>
                    <span className="font-semibold text-[#173643]">{ticket.business_date}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#536B73]">
                    <span>پایان ساعت اعتبار:</span>
                    <span className="font-semibold text-[#173643]">{formatDateTime(ticket.valid_until)}</span>
                  </div>
                  {ticket.used_at && (
                    <div className="flex justify-between items-center text-[#B34553] pt-1 border-t border-[#DCE8E8]/50">
                      <span>زمان ثبت ورود:</span>
                      <span className="font-bold">{formatDateTime(ticket.used_at)}</span>
                    </div>
                  )}
                </div>

                {/* Single Download button (no-print) */}
                <div className="px-6 py-3 bg-[#FFFFFF] border-t border-[#DCE8E8] text-center no-print">
                  <a
                    href={`/api/v1/tickets/${ticket.public_id}/qr.png`}
                    download={`ticket-${ticket.ticket_number}.png`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173643] hover:text-[#24576A]"
                  >
                    <Download className="w-3.5 h-3.5 text-[#24647B]" />
                    ذخیره تصویر بارکد (PNG)
                  </a>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

