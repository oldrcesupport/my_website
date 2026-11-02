import React from "react";

export function LoungeExperience() {
  return (
    <section id="about-lounge" className="bg-[#18382f] px-5 py-16 text-[#f8f6ef] sm:px-8 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_1.4fr] md:gap-20">
        <div>
          <p className="text-sm text-[#d7c29c]">پیش از خرید</p>
          <h2 className="mt-4 text-3xl font-bold leading-relaxed">آنچه باید درباره بلیت بدانید</h2>
        </div>
        <div className="divide-y divide-white/20 border-y border-white/20">
          <div className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr]"><h3 className="font-bold">برای هر نفر</h3><p className="leading-7 text-[#e2e8e0]">هر بلیت برای ورود یک نفر است؛ در یک سفارش می‌توانید چند بلیت تهیه کنید.</p></div>
          <div className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr]"><h3 className="font-bold">برای همان روز</h3><p className="leading-7 text-[#e2e8e0]">اعتبار بلیت در پایان روز کاری خرید به پایان می‌رسد.</p></div>
          <div className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr]"><h3 className="font-bold">در ورودی</h3><p className="leading-7 text-[#e2e8e0]">پس از تأیید پرداخت، کد هر بلیت را به مسئول پذیرش نشان دهید. هر کد یک‌بار پذیرفته می‌شود.</p></div>
        </div>
      </div>
    </section>
  );
}
