import React from "react";
import { Utensils, Music, CheckCircle2, Info } from "lucide-react";

export function LoungeExperience() {
  return (
    <section id="about-lounge" className="py-20 bg-[#F5F0E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C3A16A] block mb-2">
            تفکیک فضا و قوانین ورود
          </span>
          <h2 className="text-3xl font-extrabold text-[#203D33] sm:text-4xl">
            تجربه همزمان طعم اصیل و نوای زنده
          </h2>
          <p className="mt-4 text-base text-[#77756D]">
            برای درک بهتر فرآیند پذیرش، توجه به ساختار دوگانه مجموعه ما اهمیت دارد:
          </p>
        </div>

        {/* Dual Space Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Card 1: Regular Dining Area */}
          <div className="bg-[#FFFCF6] rounded-3xl p-8 border border-[#E6DED1] shadow-xs relative">
            <div className="w-12 h-12 rounded-2xl bg-[#E6DED1]/50 text-[#203D33] flex items-center justify-center mb-6">
              <Utensils className="w-6 h-6 text-[#203D33]" />
            </div>
            <h3 className="text-xl font-bold text-[#203D33] mb-3">
              ۱. سالن اصلی صرف غذا
            </h3>
            <p className="text-sm text-[#77756D] leading-relaxed mb-6">
              فضای رستورانی برای صرف ناهار و شام. کلیه سفارش‌های غذا و نوشیدنی به صورت حضوری در رستوران انجام شده و این وب‌سایت ارتباطی با منوی غذا یا رزرو میزهای غذاخوری ندارد.
            </p>
            <ul className="space-y-3 text-xs text-[#262A25]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#77756D]" />
                پذیرایی انواع غذاها و نوشیدنی‌های منوی رستوران
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#77756D]" />
                حضور در این سالن نیازی به تهیه بلیت موسیقی ندارد
              </li>
            </ul>
          </div>

          {/* Card 2: Live Music Lounge */}
          <div className="bg-[#FFFCF6] rounded-3xl p-8 border-2 border-[#203D33] shadow-md relative">
            <div className="absolute top-6 left-6 px-3 py-1 rounded-full bg-[#203D33] text-[#FFFCF6] text-xs font-semibold">
              بلیت ورودی اختصاصی
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#203D33] text-[#FFFCF6] flex items-center justify-center mb-6">
              <Music className="w-6 h-6 text-[#C3A16A]" />
            </div>
            <h3 className="text-xl font-bold text-[#203D33] mb-3">
              ۲. سالن اختصاصی موسیقی زنده
            </h3>
            <p className="text-sm text-[#77756D] leading-relaxed mb-6">
              فضایی تفکیک‌شده و آکوستیک داخل مجموعه که به اجرای زنده اختصاص یافته است. هر فرد برای ورود به این بخش موظف به تهیه بلیت ورودی معتبر همان روز است.
            </p>
            <ul className="space-y-3 text-xs text-[#203D33] font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C3A16A]" />
                یک بلیت برای هر نفر (پذیرش انفرادی با QR)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C3A16A]" />
                معتبر فقط برای روز کاری خرید بلیت
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C3A16A]" />
                یک‌بار مصرف (پس از پذیرش باطل می‌گردد)
              </li>
            </ul>
          </div>

        </div>

        {/* Clear Clarification Notice */}
        <div className="p-5 rounded-2xl bg-[#C3A16A]/10 border border-[#C3A16A]/30 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#A85E48] shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[#262A25] leading-relaxed">
            <strong>نکته مهم:</strong> مهمانان گرامی می‌توانند پس از صرف شام در رستوران تصمیم به حضور در سالن موسیقی گرفته و به صورت درجا با تلفن همراه خود بلیت ورودی را تهیه نمایند، یا مستقیماً تنها جهت استفاده از سالن موسیقی تشریف‌فرما شوند.
          </p>
        </div>

      </div>
    </section>
  );
}

