import React from "react";
import { ArrowLeft } from "lucide-react";
import { formatToman } from "@/lib/utils";

interface HeroProps {
  restaurantName?: string;
  tagline?: string;
  ticketPrice?: number;
}

export function Hero({ ticketPrice }: HeroProps) {
  return (
    <section className="bg-[#f8f6ef] text-[#18382f]" aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:gap-20 lg:py-24">
        <div>
          <p className="mb-5 text-sm font-semibold text-[#7b6645]">بلیت ورودی · موسیقی زنده</p>
          <h1 id="hero-title" className="max-w-2xl text-4xl font-bold leading-[1.45] sm:text-5xl sm:leading-[1.45]">
            برای شنیدن موسیقی زنده،<br /> جای خود را با بلیت ورودی آماده کنید.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#52635a]">
            بلیت ورود به بخش موسیقی زنده رستوران را بدون ثبت‌نام تهیه کنید. هر بلیت برای یک نفر و فقط در روز کاری خرید معتبر است.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a href="#purchase-section" className="inline-flex min-h-12 items-center gap-4 rounded-md bg-[#18382f] px-7 py-3 font-bold text-white hover:bg-[#285244]">
              تهیه بلیت <ArrowLeft aria-hidden="true" size={19} />
            </a>
            <a href="#how-it-works" className="border-b border-[#879c8d] py-2 text-sm font-semibold">مراحل خرید و ورود</a>
          </div>
        </div>
        <div className="border border-[#b9c5b8] bg-[#edf0e7] p-6 sm:p-8" aria-label="اطلاعات بلیت">
          <div className="flex items-center justify-between border-b border-[#b9c5b8] pb-5 text-sm font-semibold">
            <span>بلیت ورودی</span><span>موسیقی زنده</span>
          </div>
          <p className="mt-8 text-sm text-[#52635a]">قیمت هر نفر</p>
          <p className="mt-2 text-2xl font-bold">{ticketPrice != null ? formatToman(ticketPrice) : "در حال حاضر نامشخص"}</p>
          <dl className="mt-8 space-y-4 border-t border-[#b9c5b8] pt-6 text-sm">
            <div className="flex justify-between gap-4"><dt>ظرفیت هر بلیت</dt><dd className="font-bold">یک نفر</dd></div>
            <div className="flex justify-between gap-4"><dt>اعتبار</dt><dd className="font-bold">روز کاری خرید</dd></div>
            <div className="flex justify-between gap-4"><dt>پذیرش</dt><dd className="font-bold">یک‌بار با کد بلیت</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
