"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Ticket,
  Home,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { OrderStatusResponse } from "@/types";

function PaymentReturnContent() {
  const searchParams = useSearchParams();

  const urlStatus = searchParams.get("status")?.toLowerCase() || "";
  const orderId = searchParams.get("order_id");
  const authority = searchParams.get("auth");
  const urlRefId = searchParams.get("ref_id");

  const [orderData, setOrderData] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [fetchError, setFetchError] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setFetchError("");

    // Authoritative server-side status check using secure HttpOnly cookie
    api
      .getOrderStatus(orderId)
      .then((data) => {
        if (isMounted) {
          setOrderData(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(err.message || "امکان بررسی وضعیت سفارش از سرور وجود ندارد.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const copyToClipboard = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Authoritative State: Strictly depend on verified database state from backend, NEVER query string alone
  const isVerifiedPaid = orderData?.status === "PAID";
  const isLateReview = orderData?.status === "PAID_LATE_REVIEW" || urlStatus === "late_review";
  const isPending = orderData?.status === "PENDING_PAYMENT";
  const isFailed =
    (!loading && !isVerifiedPaid && !isLateReview && !isPending) ||
    orderData?.status === "PAYMENT_FAILED" ||
    orderData?.status === "CANCELLED" ||
    Boolean(fetchError);

  const displayRefId = orderData?.reference_id || urlRefId;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E7] flex flex-col justify-center items-center px-4 py-16">
        <div className="max-w-lg w-full bg-[#FFFCF6] rounded-3xl p-8 border border-[#E6DED1] shadow-xl text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#203D33] animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-[#203D33]">در حال استعلام وضعیت قطعی پرداخت از سرور...</h2>
          <p className="text-xs text-[#77756D]">لطفاً چند لحظه شکیبا باشید.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E7] flex flex-col justify-center items-center px-4 py-16">
      <div className="max-w-lg w-full bg-[#FFFCF6] rounded-3xl p-6 sm:p-8 border border-[#E6DED1] shadow-xl text-center space-y-6">
        {/* Status Icon */}
        {isVerifiedPaid && (
          <div className="w-20 h-20 mx-auto rounded-full bg-[#203D33]/10 text-[#203D33] flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-[#203D33]" />
          </div>
        )}

        {isLateReview && (
          <div className="w-20 h-20 mx-auto rounded-full bg-[#C3A16A]/15 text-[#C3A16A] flex items-center justify-center">
            <Clock className="w-12 h-12 text-[#A85E48]" />
          </div>
        )}

        {isPending && (
          <div className="w-20 h-20 mx-auto rounded-full bg-[#C3A16A]/15 text-[#C3A16A] flex items-center justify-center">
            <Clock className="w-12 h-12 text-[#C3A16A]" />
          </div>
        )}

        {isFailed && (
          <div className="w-20 h-20 mx-auto rounded-full bg-[#A85E48]/10 text-[#A85E48] flex items-center justify-center">
            <XCircle className="w-12 h-12 text-[#A85E48]" />
          </div>
        )}

        {/* Title & Description */}
        <div>
          <h1 className="text-2xl font-bold text-[#203D33]">
            {isVerifiedPaid && "پرداخت تأیید شد — صدور بلیت"}
            {isLateReview && "پرداخت ثبت شد (نیازمند بازبینی مدیریت)"}
            {isPending && "پرداخت در حال اعتبارسنجی است"}
            {isFailed && "پرداخت انجام نشد"}
          </h1>
          <p className="mt-2 text-sm text-[#77756D] leading-relaxed">
            {isVerifiedPaid &&
              "تراکنش بانکی با موفقیت در سیستم تأیید شد و بلیت‌های ورود به سالن موسیقی زنده صادر گردیدند."}
            {isLateReview &&
              "مبلغ کسر شده است، اما به دلیل عبور از ساعت پایان روز کاری سالن، بلیت صادر نگردید و سفارش جهت استرداد وجه به مدیریت ارجاع شد."}
            {isPending &&
              "تراکنش شما در حال حاضر در حال پردازش در شبکه بانکی است. لطفاً صفحه را تازه‌سازی نمایید."}
            {isFailed &&
              (fetchError ||
                "فرآیند پرداخت در درگاه بانکی تکمیل نشد یا توسط کاربر لغو گردید. هیچ بلیتی برای این سفارش صادر نشده است.")}
          </p>
        </div>

        {/* Order Details Receipt Card */}
        {orderId && orderData && (
          <div className="p-5 rounded-2xl bg-[#F5F0E7]/70 border border-[#E6DED1] text-xs text-right space-y-3">
            <div className="font-bold text-sm text-[#203D33] pb-2 border-b border-[#E6DED1] flex items-center justify-between">
              <span>رسید الکترونیک سفارش</span>
              <span className="text-[11px] font-normal text-[#77756D]">
                {orderData.business_date ? `تاریخ: ${orderData.business_date}` : ""}
              </span>
            </div>

            {orderData.purchaser_name && (
              <div className="flex justify-between items-center">
                <span className="text-[#77756D]">نام خریدار:</span>
                <span className="font-bold text-[#203D33]">{orderData.purchaser_name}</span>
              </div>
            )}

            {displayRefId && (
              <div className="flex justify-between items-center bg-[#FFFCF6] p-2.5 rounded-xl border border-[#C3A16A]/30">
                <span className="text-[#203D33] font-semibold">شماره پیگیری بانک:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-[#203D33] text-sm">
                    {displayRefId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(displayRefId, "ref")}
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
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-[#77756D]">تعداد بلیت:</span>
              <span className="font-bold text-[#203D33]">
                {orderData.quantity.toLocaleString("fa-IR")} عدد (پذیرش انفرادی)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#77756D]">مبلغ کل:</span>
              <span className="font-bold text-[#203D33] text-sm">
                {orderData.total_price_toman?.toLocaleString("fa-IR")} تومان
              </span>
            </div>

            {/* Order Public ID with Copy */}
            <div className="flex justify-between items-center pt-2 border-t border-[#E6DED1]/60">
              <span className="text-[#77756D]">شناسه سفارش:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-[#203D33]">
                  {orderId}
                </span>
                <button
                  onClick={() => copyToClipboard(orderId, "order")}
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
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          {/* Strictly only display tickets if backend verified payment is true */}
          {isVerifiedPaid && orderId && (
            <Link
              href={`/tickets/${orderId}`}
              className="w-full py-4 px-6 rounded-2xl bg-[#203D33] text-[#FFFCF6] hover:bg-[#294D40] font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Ticket className="w-5 h-5 text-[#C3A16A]" />
              <span>مشاهده و دریافت بلیت‌های ورودی (بارکد)</span>
            </Link>
          )}

          {isFailed && (
            <Link
              href="/#purchase-section"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#203D33] text-[#FFFCF6] hover:bg-[#294D40] font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-[#C3A16A]" />
              <span>تلاش مجدد برای خرید بلیت</span>
            </Link>
          )}

          <Link
            href="/"
            className="w-full py-3 px-6 rounded-2xl bg-[#FFFCF6] text-[#77756D] hover:bg-[#F5F0E7] border border-[#E6DED1] text-xs font-medium flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>بازگشت به صفحه اصلی</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center">
          در حال بارگذاری اطلاعات پرداخت...
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
