"use client";

import React, { useEffect, useState, use } from "react";
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
  Music2,
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

  const fetchTickets = (showLoader = true) => {
    if (showLoader) setLoading(true);
    const searchParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const urlToken = searchParams?.get("token") || "";
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem(`token_${orderId}`) ||
          localStorage.getItem("last_guest_token") ||
          ""
        : "";
    const effectiveToken = urlToken || storedToken;

    if (urlToken && typeof window !== "undefined") {
      localStorage.setItem(`token_${orderId}`, urlToken);
      localStorage.setItem("last_guest_token", urlToken);
    }

    api
      .getOrderTickets(orderId, effectiveToken)
      .then((res) => {
        setData(res);
        if (res.guest_access_token && typeof window !== "undefined") {
          localStorage.setItem(`token_${orderId}`, res.guest_access_token);
          localStorage.setItem("last_guest_token", res.guest_access_token);
        }
      })
      .catch((err) => {
        if (showLoader) {
          setError(err.message || "خطا در بارگذاری بلیت‌ها یا عدم دسترسی.");
        }
      })
      .finally(() => {
        if (showLoader) setLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets(true);
    // Real-time status sync: polls quietly every 4 seconds
    const timer = setInterval(() => {
      fetchTickets(false);
    }, 4000);
    return () => clearInterval(timer);
  }, [orderId]);

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
      <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#203D33] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#77756D]">در حال بارگذاری بلیت‌های ورودی...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#FFFCF6] rounded-3xl p-8 border border-[#E6DED1] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#A85E48]/10 text-[#A85E48] mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#203D33]">خطا در دسترسی به بلیت‌ها</h2>
          <p className="text-sm text-[#77756D]">{error || "بلیت‌های این سفارش یافت نشد."}</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#203D33] text-[#FFFCF6] text-xs font-semibold"
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
    <div className="min-h-screen bg-[#F5F0E7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#77756D] hover:text-[#203D33] mb-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به صفحه اصلی
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#203D33]">
              بلیت‌های ورودی موسیقی زنده
            </h1>
            <p className="text-xs sm:text-sm text-[#77756D] mt-1">
              سفارش خریدار: <strong className="text-[#203D33]">{data.purchaser_name}</strong> ({toPersianDigits(data.tickets.length)} بلیت)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchTickets(false)}
              className="px-3.5 py-2.5 rounded-xl bg-[#FFFCF6] border border-[#E6DED1] hover:bg-[#E6DED1]/30 text-xs font-bold text-[#203D33] shadow-xs flex items-center gap-1.5 transition-colors"
              title="به‌روزرسانی وضعیت بلیت‌ها"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C3A16A]" />
              <span>به‌روزرسانی</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-[#FFFCF6] border border-[#E6DED1] hover:bg-[#E6DED1]/30 text-xs font-bold text-[#203D33] shadow-xs flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4 text-[#C3A16A]" />
              چاپ بلیت‌ها
            </button>
          </div>
        </div>

        {/* Order Details & Bank Reference Pill */}
        <div className="p-4 rounded-2xl bg-[#FFFCF6] border border-[#E6DED1] flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs no-print">
          <div className="flex items-center gap-2">
            <span className="text-[#77756D]">شناسه سفارش:</span>
            <span className="font-mono font-bold text-[#203D33]">{data.order_public_id}</span>
            <button
              onClick={() => copyToClipboard(data.order_public_id, "order")}
              className="p-1 rounded hover:bg-[#E6DED1]/50 text-[#77756D]"
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#203D33]/5 border border-[#203D33]/15">
              <span className="text-[#203D33] font-medium">شماره پیگیری بانک:</span>
              <span className="font-mono font-extrabold text-[#203D33]">{data.reference_id}</span>
              <button
                onClick={() => copyToClipboard(data.reference_id!, "ref")}
                className="p-1 rounded hover:bg-[#E6DED1]/50 text-[#77756D]"
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

          <div className="flex items-center gap-2 text-[#77756D]">
            <span>تاریخ اعتبار:</span>
            <span className="font-semibold text-[#203D33]">{data.business_date} (امروز)</span>
          </div>
        </div>

        {/* Safety & Instructions Banner */}
        <div className="p-4 rounded-2xl bg-[#FFFCF6] border border-[#E6DED1] flex items-start gap-3 text-xs text-[#262A25] shadow-xs no-print">
          <ShieldCheck className="w-5 h-5 text-[#203D33] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-[#203D33] block">راهنمای پذیرش در ورودی:</strong>
            <p className="text-[#77756D] leading-relaxed">
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
                className="ticket-card bg-[#FFFCF6] rounded-3xl border border-[#E6DED1] overflow-hidden shadow-md flex flex-col justify-between relative transition-all"
              >
                {/* Top Ticket Header */}
                <div className="p-6 bg-[#203D33] text-[#FFFCF6] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#C3A16A] text-[#203D33] flex items-center justify-center">
                      <Music2 className="w-5 h-5 text-[#203D33]" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#C3A16A] block font-semibold">
                        بلیت ورودی اختصاصی
                      </span>
                      <span className="text-sm font-bold text-[#FFFCF6] block">
                        بلیت شماره {toPersianDigits(index + 1)} از {toPersianDigits(data.tickets.length)}
                      </span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div>
                    {isValid && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFFCF6]/10 text-[#C3A16A] border border-[#C3A16A]/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        معتبر جهت ورود
                      </span>
                    )}
                    {isUsed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#A85E48]/20 text-[#FFFCF6] border border-[#A85E48]/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#A85E48]" />
                        استفاده شده
                      </span>
                    )}
                    {isExpired && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#77756D]/20 text-[#E6DED1]">
                        <Clock className="w-3.5 h-3.5" />
                        منقضی شده
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#A85E48] text-[#FFFCF6]">
                        <XCircle className="w-3.5 h-3.5" />
                        لغو شده
                      </span>
                    )}
                  </div>
                </div>

                {/* QR Code Centerpiece */}
                <div className="p-8 text-center space-y-4">
                  <div className="inline-block p-4 rounded-2xl bg-[#FFFCF6] border-2 border-[#E6DED1] shadow-inner relative">
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
                      <div className="w-48 h-48 bg-[#F5F0E7] flex items-center justify-center text-xs text-[#77756D]">
                        بارکد در دسترس نیست
                      </div>
                    )}

                    {/* Overlay if used or expired */}
                    {(isUsed || isExpired || isCancelled) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-4 py-2 rounded-xl bg-[#202823]/80 text-[#FFFCF6] font-extrabold text-sm backdrop-blur-xs">
                          {isUsed ? "استفاده شده" : isExpired ? "منقضی شده" : "باطل شده"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Ticket Serial Number */}
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#77756D] block">
                      شناسه اختصاصی بلیت
                    </span>
                    <span className="text-sm font-mono font-bold text-[#203D33] tracking-wider block" dir="ltr">
                      {ticket.ticket_number}
                    </span>
                  </div>
                </div>

                {/* Ticket Details Footer */}
                <div className="p-6 bg-[#F5F0E7]/60 border-t border-dashed border-[#E6DED1] space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[#77756D]">
                    <span>پذیرش:</span>
                    <span className="font-semibold text-[#203D33]">یک نفر (انفرادی)</span>
                  </div>
                  <div className="flex justify-between items-center text-[#77756D]">
                    <span>تاریخ اعتبار:</span>
                    <span className="font-semibold text-[#203D33]">{ticket.business_date}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#77756D]">
                    <span>پایان ساعت اعتبار:</span>
                    <span className="font-semibold text-[#203D33]">{formatDateTime(ticket.valid_until)}</span>
                  </div>
                  {ticket.used_at && (
                    <div className="flex justify-between items-center text-[#A85E48] pt-1 border-t border-[#E6DED1]/50">
                      <span>زمان ثبت ورود:</span>
                      <span className="font-bold">{formatDateTime(ticket.used_at)}</span>
                    </div>
                  )}
                </div>

                {/* Single Download button (no-print) */}
                <div className="px-6 py-3 bg-[#FFFCF6] border-t border-[#E6DED1] text-center no-print">
                  <a
                    href={`/api/v1/tickets/${ticket.public_id}/qr.png`}
                    download={`ticket-${ticket.ticket_number}.png`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#203D33] hover:text-[#294D40]"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C3A16A]" />
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

