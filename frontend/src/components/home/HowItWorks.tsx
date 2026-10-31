import React from "react";
import { MousePointerClick, UserCheck, CreditCard, QrCode, DoorOpen } from "lucide-react";
import { toPersianDigits } from "@/lib/utils";

const steps = [
  {
    step: 1,
    title: "انتخاب تعداد بلیت",
    desc: "تعداد مهمانان را مشخص کنید. برای هر نفر یک بلیت مجزا صادر می‌شود.",
    icon: MousePointerClick,
  },
  {
    step: 2,
    title: "اطلاعات خریدار",
    desc: "نام و شماره همراه خود را وارد کنید؛ نیازی به ساخت حساب کاربری نیست.",
    icon: UserCheck,
  },
  {
    step: 3,
    title: "پرداخت در درگاه بانکی",
    desc: "مبلغ را از طریق درگاه پرداخت اینترنتی به صورت آنلاین تسویه نمایید.",
    icon: CreditCard,
  },
  {
    step: 4,
    title: "دریافت بارکدهای اختصاصی",
    desc: "بلافاصله بارکدهای QR هر بلیت را روی گوشی مشاهده یا ذخیره کنید.",
    icon: QrCode,
  },
  {
    step: 5,
    title: "ورود به سالن موسیقی",
    desc: "بارکد را در گیت ورودی سالن موسیقی به پرسنل پذیرش ارائه دهید.",
    icon: DoorOpen,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-[#FFFCF6] border-b border-[#E6DED1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C3A16A] block mb-2">
            مراحل ساده خرید و پذیرش
          </span>
          <h2 className="text-3xl font-extrabold text-[#203D33] sm:text-4xl">
            چگونه بلیت تهیه کنیم؟
          </h2>
          <p className="mt-3 text-base text-[#77756D]">
            فرآیند خرید کاملاً شفاف، سریع و بدون نیاز به نام‌نویسی پیچیده طراحی شده است.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-[#F5F0E7]/60 rounded-3xl p-6 border border-[#E6DED1] flex flex-col justify-between text-right relative hover:border-[#203D33]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-full bg-[#203D33] text-[#FFFCF6] flex items-center justify-center text-xs font-extrabold">
                      {toPersianDigits(item.step)}
                    </span>
                    <Icon className="w-5 h-5 text-[#C3A16A]" />
                  </div>
                  <h3 className="text-base font-bold text-[#203D33] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#77756D] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

