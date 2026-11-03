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

  const orderId = searchParams.get("order_id");

  const [orderData, setOrderData] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [fetchError, setFetchError] = useState<string>("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setFetchError("");
    setAccessDenied(false);

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
          setAccessDenied(err.status === 403);
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
  }, [orderId, retryCount]);

  const copyToClipboard = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Authoritative State: Strictly depend on verified database state from backend, NEVER query string alone
  const isVerifiedPaid = orderData?.status === "PAID";
  const isLateReview = orderData?.status === "PAID_LATE_REVIEW";
  const isPending = orderData?.status === "PENDING_PAYMENT";
  const statusUnavailable = !loading && !orderData;
  const isFailed =
    orderData?.status === "PAYMENT_FAILED" ||
    orderData?.status === "CANCELLED";

  const displayRefId = orderData?.reference_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9F9] flex flex-col justify-center items-center px-4 py-16">
        <div className="max-w-lg w-full bg-[#FFFFFF] rounded-3xl p-8 border border-[#DCE8E8] shadow-xl text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#173643] animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-[#173643]">در حال استعلام وضعیت قطعی پرداخت از سرور...</h2>
          <p className="text-xs text-[#536B73]">لطفاً چند لحظه شکیبا باشید.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9F9] flex flex-col justify-center items-center px-4 py-16">
      <div className="max-w-lg w-full bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DCE8E8] shadow-xl text-center space-y-6">
        {/* Status Icon */}
        {isVerifiedPaid && (
          <div className="w-20 h-20 mx-auto rounded-full bg-[#173643]/10 text-[#173643] flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-[#173643]" />
          </div>
        )}

        {isLateReview && (
          <div className="w-20 h-20 mx-auto rounded-full bg-[#24647B]/15 text-[#24647B] flex items-center justify-center">
            <Clock className="w-12 h-12 text-[#B34553]" />
          </div>
        )}

        {isPending && (
          <div className="w-20 h-20 mx-auto rounded-full bg-[#24647B]/15 text-[#24647B] flex items-center justify-center">
            <Clock className="w-12 h-12 text-[#24647B]" />
          </div>
        )}

        {statusUnavailable && (
          <div className="w-20 h-20 mx-auto rounded-full bg-[#FFF1EE] text-[#A9453A] flex items-center justify-center"><AlertCircle className="w-12 h-12" /></div>
        )}

        {isFailed && (
          <div className="w-20 h-20 mx-auto rounded-full bg-[#B34553]/10 text-[#B34553] flex items-center justify-center">
            <XCircle className="w-12 h-12 text-[#B34553]" />
          </div>
        )}

        {/* Title & Description */}
        <div>
          <h1 className="text-2xl font-bold text-[#173643]">
            {isVerifiedPaid && "پرداخت تأیید شد — صدور بلیت"}
            {isLateReview && "پرداخت ثبت شد (نیازمند بازبینی مدیریت)"}
            {isPending && "پرداخت در حال اعتبارسنجی است"}
            {statusUnavailable && "وضعیت پرداخت در دسترس نیست"}
            {isFailed && "پرداخت انجام نشد"}
          </h1>
          <p className="mt-2 text-sm text-[#536B73] leading-relaxed">
            {isVerifiedPaid &&
              "تراکنش بانکی با موفقیت در سیستم تأیید شد و بلیت‌های ورود به سالن موسیقی زنده صادر گردیدند."}
            {isLateReview &&
              "مبلغ کسر شده است، اما به دلیل عبور از ساعت پایان روز کاری سالن، بلیت صادر نگردید و سفارش جهت استرداد وجه به مدیریت ارجاع شد."}
            {isPending &&
              (fetchError ? "امکان دریافت وضعیت سفارش وجود ندارد. پیش از خرید دوباره، وضعیت را بررسی کنید." : "وضعیت قطعی پرداخت هنوز مشخص نیست. لطفاً دوباره بررسی کنید.")}
            {statusUnavailable && (accessDenied ? "دسترسی به این سفارش در این مرورگر تأیید نشد. از همان مرورگر و نشانی شروع خرید استفاده کنید. اگر مشکل ادامه داشت با پشتیبانی تماس بگیرید؛ پیش از خرید دوباره وضعیت پرداخت را بررسی کنید." : "امکان دریافت وضعیت سفارش وجود ندارد. اتصال را بررسی و دوباره تلاش کنید؛ پیش از خرید دوباره وضعیت پرداخت را بررسی کنید.")}
            {isFailed &&
              (fetchError ||
                "فرآیند پرداخت در درگاه بانکی تکمیل نشد یا توسط کاربر لغو گردید. هیچ بلیتی برای این سفارش صادر نشده است.")}
          </p>
        </div>

        {/* Order Details Receipt Card */}
        {orderId && orderData && (
          <div className="p-5 rounded-2xl bg-[#F6F9F9]/70 border border-[#DCE8E8] text-xs text-right space-y-3">
            <div className="font-bold text-sm text-[#173643] pb-2 border-b border-[#DCE8E8] flex items-center justify-between">
              <span>رسید الکترونیک سفارش</span>
              <span className="text-[11px] font-normal text-[#536B73]">
                {orderData.business_date ? `تاریخ: ${orderData.business_date}` : ""}
              </span>
            </div>

            {orderData.purchaser_name && (
              <div className="flex justify-between items-center">
                <span className="text-[#536B73]">نام خریدار:</span>
                <span className="font-bold text-[#173643]">{orderData.purchaser_name}</span>
              </div>
            )}

            {displayRefId && (
              <div className="flex justify-between items-center bg-[#FFFFFF] p-2.5 rounded-xl border border-[#24647B]/30">
                <span className="text-[#173643] font-semibold">شماره پیگیری بانک:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-[#173643] text-sm">
                    {displayRefId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(displayRefId, "ref")}
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
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-[#536B73]">تعداد بلیت:</span>
              <span className="font-bold text-[#173643]">
                {orderData.quantity.toLocaleString("fa-IR")} عدد (پذیرش انفرادی)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#536B73]">مبلغ کل:</span>
              <span className="font-bold text-[#173643] text-sm">
                {orderData.total_price_toman?.toLocaleString("fa-IR")} تومان
              </span>
            </div>

            {/* Order Public ID with Copy */}
            <div className="flex justify-between items-center pt-2 border-t border-[#DCE8E8]/60">
              <span className="text-[#536B73]">شناسه سفارش:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-[#173643]">
                  {orderId}
                </span>
                <button
                  onClick={() => copyToClipboard(orderId, "order")}
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
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          {statusUnavailable && orderId && <div className="p-3 rounded-xl bg-[#F6F9F9] text-sm text-[#536B73] break-all">شناسه سفارش: <span dir="ltr">{orderId}</span></div>}
          {statusUnavailable && orderId && <button type="button" onClick={() => setRetryCount(n => n + 1)} className="w-full py-3 px-6 rounded-2xl bg-[#246D7A] text-white font-bold text-sm">بررسی دوباره وضعیت</button>}
          {/* Strictly only display tickets if backend verified payment is true */}
          {isVerifiedPaid && orderId && (
            <Link
              href={`/tickets/${orderId}`}
              className="w-full py-4 px-6 rounded-2xl bg-[#173643] text-[#FFFFFF] hover:bg-[#24576A] font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Ticket className="w-5 h-5 text-[#24647B]" />
              <span>مشاهده و دریافت بلیت‌های ورودی (بارکد)</span>
            </Link>
          )}

          {isFailed && (
            <Link
              href="/#purchase-section"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#173643] text-[#FFFFFF] hover:bg-[#24576A] font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-[#24647B]" />
              <span>تلاش مجدد برای خرید بلیت</span>
            </Link>
          )}

          <Link
            href="/"
            className="w-full py-3 px-6 rounded-2xl bg-[#FFFFFF] text-[#536B73] hover:bg-[#F6F9F9] border border-[#DCE8E8] text-xs font-medium flex items-center justify-center gap-2 transition-all"
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
        <div className="min-h-screen bg-[#F6F9F9] flex items-center justify-center">
          در حال بارگذاری اطلاعات پرداخت...
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
