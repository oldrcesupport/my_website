"use client";

import React, { useRef, useState } from "react";
import { PublicRestaurantSettings } from "@/types";
import { formatToman, toPersianDigits } from "@/lib/utils";
import { api } from "@/lib/api";
import { Ticket, AlertCircle, ArrowLeft, Loader2, ShieldCheck, Clock3 } from "lucide-react";

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
  const submitting = useRef(false);
  const idempotencyKey = useRef<string | null>(null);

  const unitPrice = settings?.ticket_price_toman ?? 0;
  const totalPrice = unitPrice * quantity;
  const isCutoffActive = settings?.sales_cutoff_active || false;
  const isSalesDisabled = !settings || !settings.sales_enabled || settings.ticket_price_toman == null;

  const handleIncrement = () => {
    if (quantity < 10) setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
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

    submitting.current = true;
    setLoading(true);

    try {
      // Generate client idempotency key to prevent accidental double submission
      if (!idempotencyKey.current) {
        if (!globalThis.crypto?.randomUUID) throw new Error("مرورگر شما امکان ثبت امن سفارش را ندارد.");
        idempotencyKey.current = crypto.randomUUID();
      }

      const res = await api.createOrder(
        {
          purchaser_name: purchaserName.trim(),
          purchaser_phone: cleanPhone,
          purchaser_email: purchaserEmail.trim() || undefined,
          quantity,
        },
        idempotencyKey.current
      );

      // Redirect directly to ZarinPal Sandbox StartPay
      if (res.payment_redirect_url) {
        window.location.href = res.payment_redirect_url;
      } else {
        setErrorMessage("آدرس هدایت به درگاه پرداخت دریافت نشد.");
        setLoading(false);
        submitting.current = false;
      }
    } catch (err: any) {
      // These responses reject the request before an order is created. Network
      // and gateway failures remain ambiguous, so retain the key for safety.
      if ([400, 403, 422].includes(err.status)) idempotencyKey.current = null;
      setErrorMessage((err.message || "خطایی در ثبت سفارش رخ داد.") + " در صورت نامشخص بودن نتیجه، پیش از خرید مجدد وضعیت پرداخت را بررسی کنید.");
      setLoading(false);
      submitting.current = false;
    }
  };

  const unavailable = isCutoffActive || isSalesDisabled || loading;
  return (
    <section id="purchase-section" className="booking-section">
      <div className="wrap booking-layout">
        <div className="booking-intro"><p className="section-kicker">خرید آنلاین بلیت</p><h2>برای امشب آماده‌اید؟</h2><p>تعداد بلیت‌ها را انتخاب کنید و مشخصات خریدار را وارد کنید. بعد از تأیید پرداخت، بلیت‌ها در همین مرورگر نمایش داده می‌شوند.</p>
          <div className="booking-facts"><div><Ticket size={20}/><span><strong>یک بلیت، یک نفر</strong><small>برای هر مهمان یک کد جداگانه صادر می‌شود.</small></span></div><div><Clock3 size={20}/><span><strong>مخصوص روز خرید</strong><small>بلیت تا پایان روز کاری جاری اعتبار دارد.</small></span></div></div>
        </div>
        <div className="booking-card">
          <div className="booking-card-heading"><div><span>بلیت ورودی</span><h3>اطلاعات سفارش</h3></div><span className="card-icon"><Ticket size={22}/></span></div>
          {settings?.is_demo_price && settings.ticket_price_toman != null && <div className="notice notice-info"><AlertCircle size={19}/><p><strong>قیمت آزمایشی</strong> مبلغ نمایش‌داده‌شده آزمایشی است؛ وضعیت درگاه به تنظیمات محیط بستگی دارد.</p></div>}
          {isCutoffActive && <div className="notice notice-error" role="status"><Clock3 size={19}/><p><strong>فروش امروز پایان یافته است.</strong> به دلیل نزدیک شدن به پایان ساعت کاری، خرید آنلاین ممکن نیست.</p></div>}
          {!settings && <div className="notice notice-error" role="status"><AlertCircle size={19}/><p>دریافت تنظیمات سالن ممکن نیست. لطفاً صفحه را تازه‌سازی کنید.</p></div>}
          {settings && isSalesDisabled && !isCutoffActive && <div className="notice notice-error" role="status"><AlertCircle size={19}/><p>فروش آنلاین بلیت در حال حاضر غیرفعال است.</p></div>}
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="quantity-row"><div><strong>تعداد بلیت</strong><small>هر نفر {settings?.ticket_price_toman != null ? formatToman(unitPrice) : "نامشخص"}</small></div><div className="counter"><button type="button" onClick={handleDecrement} disabled={quantity <= 1 || unavailable} aria-label="کاهش تعداد">−</button><output aria-live="polite">{toPersianDigits(quantity)}</output><button type="button" onClick={handleIncrement} disabled={quantity >= 10 || unavailable} aria-label="افزایش تعداد">+</button></div></div>
            <div className="form-divider"/><div className="form-title"><h4>مشخصات خریدار</h4><span>بدون نیاز به ثبت‌نام</span></div>
            <div className="form-fields"><div className="field"><label htmlFor="purchaser_name">نام و نام خانوادگی <span>*</span></label><input id="purchaser_name" autoComplete="name" required value={purchaserName} onChange={e => setPurchaserName(e.target.value)} placeholder="نام خریدار" disabled={unavailable}/></div>
              <div className="field"><label htmlFor="purchaser_phone">شماره موبایل <span>*</span></label><input id="purchaser_phone" type="tel" dir="ltr" autoComplete="tel" required value={purchaserPhone} onChange={e => setPurchaserPhone(e.target.value)} placeholder="0912 123 4567" disabled={unavailable}/></div>
              <div className="field field-wide"><label htmlFor="purchaser_email">ایمیل <span className="optional">(اختیاری)</span></label><input id="purchaser_email" type="email" dir="ltr" autoComplete="email" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="name@example.com" disabled={unavailable}/></div></div>
            {errorMessage && <div className="notice notice-error" role="alert"><AlertCircle size={19}/><p>{errorMessage}</p></div>}
            <div className="order-total"><span>مبلغ قابل پرداخت <small>({toPersianDigits(quantity)} بلیت)</small></span><strong>{settings?.ticket_price_toman != null ? formatToman(totalPrice) : "نامشخص"}</strong></div>
            <button type="submit" disabled={unavailable} className="booking-submit">{loading ? <><Loader2 size={19} className="animate-spin"/> در حال انتقال به درگاه...</> : <>ادامه و پرداخت <ArrowLeft size={19}/></>}</button>
            <p className="secure-note"><ShieldCheck size={16}/> انتقال به درگاه پرداخت پس از ثبت سفارش</p>
          </form>
        </div>
      </div>
    </section>
  );
}
