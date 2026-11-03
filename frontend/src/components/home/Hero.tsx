import React from "react";
import { ArrowLeft, ArrowUpLeft, Clock3, UsersRound } from "lucide-react";
import { formatToman } from "@/lib/utils";

interface HeroProps { restaurantName?: string; tagline?: string; ticketPrice?: number; }

export function Hero({ ticketPrice }: HeroProps) {
  return (
    <section className="intro" aria-labelledby="hero-title">
      <div className="intro-inner wrap">
        <div className="intro-copy">
          <p className="eyebrow"><span /> بلیت ورودی سالن موسیقی زنده</p>
          <h1 id="hero-title">قرار امشب،<br /><em>با موسیقی زنده.</em></h1>
          <p className="intro-description">برای یک شب خوش کنار موسیقی، بلیت ورودتان را آنلاین تهیه کنید. ساده، سریع و بدون نیاز به ثبت‌نام.</p>
          <div className="intro-actions"><a href="#purchase-section" className="button-primary">خرید بلیت <ArrowLeft size={19} /></a><a href="#about-lounge" className="button-link">درباره بلیت <ArrowUpLeft size={17} /></a></div>
          <div className="intro-notes"><span><UsersRound size={17} aria-hidden="true" /> هر بلیت برای یک نفر</span><span><Clock3 size={17} /> معتبر در روز کاری خرید</span></div>
        </div>
        <div className="intro-visual">
          <div className="intro-art" role="img" aria-label="تصویرسازی فضای اجرای موسیقی زنده" />
          <div className="intro-price"><div><span>بلیت ورودی · هر نفر</span><strong>{ticketPrice != null ? formatToman(ticketPrice) : "قیمت در دسترس نیست"}</strong></div><a href="#purchase-section" aria-label="رفتن به خرید بلیت"><ArrowLeft size={20} aria-hidden="true" /></a></div>
        </div>
      </div>
    </section>
  );
}
