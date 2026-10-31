import React from "react";
import { Ticket, Sparkles, Music, Shield, ArrowDown } from "lucide-react";
import { formatToman } from "@/lib/utils";

interface HeroProps {
  restaurantName?: string;
  tagline?: string;
  ticketPrice?: number;
}

export function Hero({
  restaurantName = "نام رستوران",
  tagline = "تجربه زنده موسیقی در فضایی صمیمی و دلنشین",
  ticketPrice = 100000,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C3A16A]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#203D33]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Main Editorial Text Column */}
          <div className="lg:col-span-7 space-y-6 text-right">
            
            {/* Elegant Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFCF6] border border-[#E6DED1] text-xs font-medium text-[#203D33] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C3A16A]" />
              <span>پذیرش اختصاصی سالن موسیقی زنده</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C3A16A]" />
              <span className="text-[#77756D]">ورودی مجزا از رستوران</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#203D33] leading-[1.25]">
              طنین زنده موسیقی در <br />
              <span className="text-[#C3A16A] inline-block mt-2">فضایی صمیمی و فاخر</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#77756D] leading-relaxed max-w-2xl">
              رستوران ما علاوه بر سالن غذاخوری، فضایی اختصاصی برای اجرای زنده موسیقی فراهم نموده است. مهمانان گرامی می‌توانند پس از صرف غذا یا مستقیماً، با تهیه بلیت ورودی به این بخش وارد شده و از هنرنمایی نوازندگان لذت ببرند.
            </p>

            {/* Key Business Constraints Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#FFFCF6] border border-[#E6DED1] space-y-1">
                <span className="text-xs font-semibold text-[#203D33] block">یک بلیت، یک نفر</span>
                <span className="text-xs text-[#77756D] block">هر بلیت ویژه ورود اختصاصی یک مهمان است.</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFFCF6] border border-[#E6DED1] space-y-1">
                <span className="text-xs font-semibold text-[#203D33] block">اعتبار روز خرید</span>
                <span className="text-xs text-[#77756D] block">بلیت منحصراً برای همان روز کاری معتبر است.</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFFCF6] border border-[#E6DED1] space-y-1">
                <span className="text-xs font-semibold text-[#203D33] block">ورود با بارکد اختصاصی</span>
                <span className="text-xs text-[#77756D] block">پذیرش سریع با اسکن امن کد QR در ورودی.</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#purchase-section"
                className="px-8 py-4 rounded-2xl bg-[#203D33] text-[#FFFCF6] hover:bg-[#294D40] text-base font-bold shadow-md flex items-center gap-2.5 transition-all transform active:scale-95"
              >
                <Ticket className="w-5 h-5 text-[#C3A16A]" />
                <span>خرید بلیت ورودی — {formatToman(ticketPrice)}</span>
              </a>
              <a
                href="#about-lounge"
                className="px-6 py-4 rounded-2xl bg-[#FFFCF6] text-[#203D33] hover:bg-[#E6DED1]/50 border border-[#E6DED1] text-base font-medium flex items-center gap-2 transition-all"
              >
                <span>درباره سالن و نحوه ورود</span>
                <ArrowDown className="w-4 h-4 text-[#77756D]" />
              </a>
            </div>

          </div>

          {/* Visual Showcase Column */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Decorative Card */}
              <div className="relative rounded-3xl bg-[#FFFCF6] p-4 sm:p-6 border border-[#E6DED1] shadow-xl">
                
                {/* Visual Imagery Panel (Warm Lounge Atmosphere) */}
                <div className="w-full h-80 sm:h-96 rounded-2xl bg-[#202823] text-[#FFFCF6] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                  
                  {/* Subtle Background Artistry */}
                  <div className="absolute inset-0 bg-radial from-[#C3A16A]/20 via-transparent to-transparent opacity-60" />
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-xs font-medium tracking-wider text-[#C3A16A] uppercase px-3 py-1 rounded-full bg-[#FFFCF6]/10 backdrop-blur-xs">
                      Live Music Lounge
                    </span>
                    <Music className="w-6 h-6 text-[#C3A16A]" />
                  </div>

                  {/* Atmospheric center graphics */}
                  <div className="relative z-10 space-y-2 text-center py-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#C3A16A]/20 border border-[#C3A16A]/40 flex items-center justify-center text-[#C3A16A]">
                      <Music className="w-8 h-8" />
                    </div>
                    <span className="block text-xl font-bold text-[#FFFCF6]">
                      اجرای زنده پیانو و سازهای آکوستیک
                    </span>
                    <span className="block text-xs text-[#E6DED1]/80 max-w-xs mx-auto">
                      فضایی آرام و صمیمی برای لحظاتی دلنشین پس از صرف شام
                    </span>
                  </div>

                  {/* Bottom admission card in image */}
                  <div className="relative z-10 pt-4 border-t border-[#FFFCF6]/15 flex items-center justify-between text-xs">
                    <span className="text-[#E6DED1]">نرخ ورودی هر نفر:</span>
                    <span className="font-bold text-sm text-[#C3A16A]">{formatToman(ticketPrice)}</span>
                  </div>
                </div>

                {/* Floating Admission Badge */}
                <div className="absolute -bottom-5 -right-5 bg-[#FFFCF6] border border-[#E6DED1] rounded-2xl p-4 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#203D33] text-[#FFFCF6] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#C3A16A]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#203D33] block">صدور مستقیم بارکد QR</span>
                    <span className="text-[11px] text-[#77756D] block">بدون نیاز به ثبت‌نام یا رزرو قبلی</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

