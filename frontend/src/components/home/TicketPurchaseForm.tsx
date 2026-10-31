"use client";

import React, { useState } from "react";
import { PublicRestaurantSettings } from "@/types";
import { formatToman, toPersianDigits } from "@/lib/utils";
import { api } from "@/lib/api";
import { Ticket, Users, AlertCircle, ArrowLeft, Loader2, ShieldCheck, Clock } from "lucide-react";

interface Props {
  settings: PublicRestaurantSettings | null;
}

export function TicketPurchaseForm({ settings }: Props) {
  const [quantity, setQuantity] = useState<number>(1);
  const [purchaserName, setPurchaserName] = useState<string>("");
  const [purchaserPhone, setPurchaserPhone] = useState<string>("");
  const [purchaserEmail, setPurchaserEmail] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const unitPrice = settings?.ticket_price_toman || 100000;
  const totalPrice = unitPrice * quantity;
  const isCutoffActive = settings?.sales_cutoff_active || false;
  const isSalesDisabled = !settings || !settings.sales_enabled;

  const handleIncrement = () => {
    if (quantity < 10) setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!purchaserName.trim()) {
      setErrorMessage("لطفاً نام و نام خانوادگی خریدار را وارد نمایید.");
      return;
    }

    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
    let cleanPhone = purchaserPhone.trim().replace(/[\s-]+/g, "");
    for (let i = 0; i < 10; i++) {
      cleanPhone = cleanPhone.replaceAll(persianDigits[i], i.toString()).replaceAll(arabicDigits[i], i.toString());
    }

    const iranianPhoneRegex = /^(\+98|0)?9\d{9}$/;
    if (!cleanPhone || !iranianPhoneRegex.test(cleanPhone)) {
      setErrorMessage("لطفاً شماره تلفن همراه معتبر ۱۱ رقمی وارد نمایید (مثال: ۰۹۱۲۳۴۵۶۷۸۹).");
      return;
    }

    if (isSalesDisabled || isCutoffActive) {
      setErrorMessage("در حال حاضر ثبت سفارش بلیت امکان‌پذیر نمی‌باشد.");
      return;
    }

    setLoading(true);

    try {
      // Generate client idempotency key to prevent accidental double submission
      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await api.createOrder(
        {
          purchaser_name: purchaserName.trim(),
          purchaser_phone: cleanPhone,
          purchaser_email: purchaserEmail.trim() || undefined,
          quantity,
        },
        idempotencyKey
      );

      if (res.guest_access_token) {
        localStorage.setItem(`token_${res.order_public_id}`, res.guest_access_token);
        localStorage.setItem("last_guest_token", res.guest_access_token);
        localStorage.setItem("last_order_id", res.order_public_id);
      }

      // Redirect directly to ZarinPal Sandbox StartPay
      if (res.payment_redirect_url) {
        window.location.href = res.payment_redirect_url;
      } else {
        setErrorMessage("آدرس هدایت به درگاه پرداخت دریافت نشد.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "خطایی در ثبت سفارش و اتصال به درگاه رخ داد.");
      setLoading(false);
    }
  };

  return (
    <section id="purchase-section" className="py-20 bg-[#FFFCF6] relative border-y border-[#E6DED1]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#203D33]/5 text-[#203D33] text-xs font-semibold mb-3">
            <Ticket className="w-3.5 h-3.5 text-[#C3A16A]" />
            پذیرش ویژه سالن موسیقی زنده
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#203D33] sm:text-4xl">
            تهیه بلیت ورودی
          </h2>
          <p className="mt-3 text-base text-[#77756D]">
            بلیت ورودی برای حضور در بخش موسیقی زنده رستوران. هر بلیت منحصراً متعلق به یک نفر بوده و برای روز کاری جاری معتبر است.
          </p>
        </div>

        {/* Demo Price Notice Banner */}
        {settings?.is_demo_price && (
          <div className="mb-8 p-4 rounded-2xl bg-[#C3A16A]/10 border border-[#C3A16A]/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#A85E48] shrink-0 mt-0.5" />
            <div className="text-sm text-[#262A25]">
              <span className="font-bold text-[#A85E48] block">محیط آزمایشی (Demo Mode):</span>
              نرخ فعلی ({formatToman(unitPrice)}) به عنوان مقدار نمایشی جهت تست سیستم تنظیم شده و درگاه روی بستر تستی زرین‌پال (Sandbox) فعالیت می‌کند.
            </div>
          </div>
        )}

        {/* Sales Cutoff Banner */}
        {isCutoffActive && (
          <div className="mb-8 p-4 rounded-2xl bg-[#A85E48]/10 border border-[#A85E48]/30 flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#A85E48] shrink-0 mt-0.5" />
            <div className="text-sm text-[#A85E48]">
              <span className="font-bold block">توقف فروش آنلاین امروز:</span>
              به دلیل نزدیک شدن به پایان ساعت کاری سالن، فروش بلیت آنلاین برای امروز پایان یافته است. پذیرش حضوری ممکن است همچنان برقرار باشد.
            </div>
          </div>
        )}

        {/* Sales Disabled Banner */}
        {!settings && (
          <div className="mb-8 p-4 rounded-2xl bg-[#A85E48]/10 border border-[#A85E48]/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#A85E48] shrink-0 mt-0.5" />
            <div className="text-sm text-[#A85E48]">
              امکان دریافت تنظیمات جاری سالن وجود ندارد. فروش آنلاین موقتاً غیرفعال است. لطفاً صفحه را تازه‌سازی نمایید.
            </div>
          </div>
        )}

        {settings && isSalesDisabled && !isCutoffActive && (
          <div className="mb-8 p-4 rounded-2xl bg-[#A85E48]/10 border border-[#A85E48]/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#A85E48] shrink-0 mt-0.5" />
            <div className="text-sm text-[#A85E48]">
              فروش بلیت آنلاین موقتاً توسط مدیریت غیرفعال شده است.
            </div>
          </div>
        )}

        {/* Main Purchase Card */}
        <div className="bg-[#F5F0E7]/60 rounded-3xl p-6 sm:p-10 border border-[#E6DED1] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Quantity Selector & Pricing */}
            <div className="pb-8 border-b border-[#E6DED1]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#203D33] mb-1">
                    تعداد بلیت ورودی
                  </label>
                  <span className="text-xs text-[#77756D]">
                    نرخ هر بلیت: <span className="font-semibold text-[#203D33]">{formatToman(unitPrice)}</span> (برای هر نفر یک بلیت مجزا)
                  </span>
                </div>

                {/* Counter Control */}
                <div className="inline-flex items-center gap-3 bg-[#FFFCF6] p-1.5 rounded-2xl border border-[#E6DED1] self-start sm:self-auto shadow-xs">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || isCutoffActive || isSalesDisabled}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-[#203D33] hover:bg-[#F5F0E7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="کاهش تعداد"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-lg font-bold text-[#203D33]">
                    {toPersianDigits(quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= 10 || isCutoffActive || isSalesDisabled}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-[#203D33] hover:bg-[#F5F0E7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="افزایش تعداد"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="mt-6 p-4 rounded-2xl bg-[#FFFCF6] border border-[#E6DED1] flex items-center justify-between">
                <span className="text-sm font-medium text-[#77756D]">
                  مبلغ قابل پرداخت ({toPersianDigits(quantity)} بلیت):
                </span>
                <span className="text-xl font-extrabold text-[#203D33]">
                  {formatToman(totalPrice)}
                </span>
              </div>
            </div>

            {/* Step 2: Guest Purchaser Information */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#203D33]">
                مشخصات خریدار (خرید مهمان)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="purchaser_name" className="block text-xs font-semibold text-[#262A25] mb-1.5">
                    نام و نام خانوادگی <span className="text-[#A85E48]">*</span>
                  </label>
                  <input
                    id="purchaser_name"
                    type="text"
                    required
                    value={purchaserName}
                    onChange={(e) => setPurchaserName(e.target.value)}
                    placeholder="مثال: علی محمدی"
                    disabled={isCutoffActive || isSalesDisabled || loading}
                    className="w-full px-4 py-3 rounded-xl bg-[#FFFCF6] border border-[#E6DED1] text-sm text-[#262A25] placeholder:text-[#77756D]/50 focus:outline-none focus:ring-2 focus:ring-[#203D33] focus:border-transparent transition-all"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label htmlFor="purchaser_phone" className="block text-xs font-semibold text-[#262A25] mb-1.5">
                    شماره تلفن همراه <span className="text-[#A85E48]">*</span>
                  </label>
                  <input
                    id="purchaser_phone"
                    type="tel"
                    dir="ltr"
                    required
                    value={purchaserPhone}
                    onChange={(e) => setPurchaserPhone(e.target.value)}
                    placeholder="09121234567"
                    disabled={isCutoffActive || isSalesDisabled || loading}
                    className="w-full px-4 py-3 rounded-xl bg-[#FFFCF6] border border-[#E6DED1] text-sm text-[#262A25] text-left placeholder:text-[#77756D]/50 focus:outline-none focus:ring-2 focus:ring-[#203D33] focus:border-transparent transition-all"
                  />
                </div>

                {/* Email (Optional) */}
                <div className="sm:col-span-2">
                  <label htmlFor="purchaser_email" className="block text-xs font-semibold text-[#262A25] mb-1.5">
                    آدرس ایمیل <span className="text-xs text-[#77756D] font-normal">(اختیاری - جهت دریافت نسخه دیجیتال بلیت)</span>
                  </label>
                  <input
                    id="purchaser_email"
                    type="email"
                    dir="ltr"
                    value={purchaserEmail}
                    onChange={(e) => setPurchaserEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isCutoffActive || isSalesDisabled || loading}
                    className="w-full px-4 py-3 rounded-xl bg-[#FFFCF6] border border-[#E6DED1] text-sm text-[#262A25] text-left placeholder:text-[#77756D]/50 focus:outline-none focus:ring-2 focus:ring-[#203D33] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-[#A85E48]/10 border border-[#A85E48]/30 text-sm text-[#A85E48] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#77756D] pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#203D33]" />
                اتصال امن به درگاه پرداخت
              </span>
              <span className="flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#C3A16A]" />
                صدور آنی بارکد اختصاصی ورود
              </span>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading || isCutoffActive || isSalesDisabled}
              className="w-full py-4 px-6 rounded-2xl bg-[#203D33] text-[#FFFCF6] hover:bg-[#294D40] disabled:bg-[#77756D]/40 disabled:cursor-not-allowed font-bold text-base shadow-md flex items-center justify-center gap-3 transition-all transform active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#C3A16A]" />
                  <span>در حال انتقال به درگاه پرداخت...</span>
                </>
              ) : (
                <>
                  <span>تأیید و پرداخت {formatToman(totalPrice)}</span>
                  <ArrowLeft className="w-5 h-5 text-[#C3A16A]" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

