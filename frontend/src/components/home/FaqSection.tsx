"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "آیا هر بلیت ورودی برای یک نفر است؟",
    a: "بله، هر بلیت منحصراً برای ورود یک فرد صادر می‌شود. چنانچه به همراه دوستان یا خانواده تشریف می‌آورید، کافی است تعداد مورد نیاز را در بخش خرید مشخص نمایید تا به تعداد نفرات، بلیت‌های مجزا با بارکد اختصاصی صادر شود.",
  },
  {
    q: "آیا می‌توانم برای روزهای آینده بلیت رزرو کنم؟",
    a: "خیر، بلیت‌های سالن موسیقی تنها برای همان روز کاری که در آن خریداری شده‌اند معتبر هستند و امکان پیش‌خرید برای روزهای بعد وجود ندارد.",
  },
  {
    q: "اعتبار بلیت تا چه ساعتی ادامه دارد؟",
    a: "اعتبار بلیت تا لحظه پایان روز کاری سالن در همان شب (ساعت برش روز کاری رستوران) معتبر است. پس از پایان ساعت کاری روز جاری، بلیت منقضی شده و قابل پذیرش نخواهد بود.",
  },
  {
    q: "آیا امکان استفاده مجدد از بلیت پس از یک‌بار ورود وجود دارد؟",
    a: "خیر، به محض اسکن و پذیرش در گیت ورودی سالن موسیقی، وضعیت بلیت به صورت دائمی به «استفاده شده» تغییر یافته و امکان پذیرش مجدد با همان بارکد وجود ندارد.",
  },
  {
    q: "آیا خرید بلیت شامل صرف غذا یا رزرو میز می‌شود؟",
    a: "خیر، این بلیت منحصراً مربوط به حق ورود به بخش اجرای زنده موسیقی است. سفارش‌های غذا و نوشیدنی به طور جداگانه در سالن رستوران انجام می‌شوند.",
  },
  {
    q: "چگونه به بارکدها دسترسی پیدا کنم اگر صفحه را ببندم؟",
    a: "پس از پرداخت، مشخصات بلیت‌ها در دستگاه شما ثبت می‌شود و با همان مرورگر می‌توانید صفحه را مجدداً باز نمایید. همچنین در صورت نیاز، پرسنل پذیرش با استعلام شماره همراه خریدار می‌توانند سوابق خرید شما را بررسی کنند.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-[#F5F0E7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C3A16A] block mb-2">
            پاسخ به سوالات شما
          </span>
          <h2 className="text-3xl font-extrabold text-[#203D33] sm:text-4xl">
            پرسش‌های متداول
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#FFFCF6] border border-[#E6DED1] overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-right flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-bold text-[#203D33]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#C3A16A] shrink-0 transition-transform duration-200 ${
                      isOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-[#77756D] leading-relaxed border-t border-[#E6DED1]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

