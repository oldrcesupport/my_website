import React from "react";
import Link from "next/link";
import { Music2, Shield, QrCode, Lock } from "lucide-react";

interface FooterProps {
  restaurantName?: string;
  tagline?: string;
  address?: string;
  phone?: string;
}

export function Footer({
  restaurantName = "نام رستوران",
  tagline = "تجربه موسیقی زنده در فضایی صمیمی و فاخر",
  address = "",
  phone = "",
}: FooterProps) {
  return (
    <footer className="bg-[#203D33] text-[#FFFCF6] border-t border-[#294D40] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#294D40]/60">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C3A16A] text-[#203D33] flex items-center justify-center font-bold">
                <Music2 className="w-5 h-5 text-[#203D33]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#FFFCF6]">
                {restaurantName}
              </span>
            </div>
            <p className="text-sm text-[#E6DED1]/80 max-w-sm leading-relaxed">
              {tagline || "سامانه اختصاصی فروش بلیت ورودی سالن موسیقی زنده رستوران."}
            </p>
            <div className="text-xs text-[#E6DED1]/60">
              کلیه حقوق این سامانه متعلق به {restaurantName} می‌باشد.
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C3A16A] block">
              دسترسی سریع
            </span>
            <ul className="space-y-2 text-sm text-[#E6DED1]/80">
              <li>
                <a href="#about-lounge" className="hover:text-[#C3A16A] transition-colors">
                  درباره سالن موسیقی
                </a>
              </li>
              <li>
                <a href="#purchase-section" className="hover:text-[#C3A16A] transition-colors">
                  خرید بلیت ورودی
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#C3A16A] transition-colors">
                  مراحل پذیرش
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#C3A16A] transition-colors">
                  پرسش‌های متداول
                </a>
              </li>
            </ul>
          </div>

          {/* Staff & Admin Access */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C3A16A] block">
              پرتال پرسنلی
            </span>
            <ul className="space-y-2 text-sm text-[#E6DED1]/80">
              <li>
                <Link
                  href="/admin/dashboard"
                  className="hover:text-[#C3A16A] transition-colors flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-[#C3A16A]" />
                  <span>داشبورد و گزارشات مدیریت</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/staff/scanner"
                  className="hover:text-[#C3A16A] transition-colors flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4 text-[#C3A16A]" />
                  <span>اسکنر گیت ورودی</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="hover:text-[#C3A16A] transition-colors flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-[#C3A16A]" />
                  <span>ورود به پنل مدیریت</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits & Security */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E6DED1]/60">
          <div>
            <span>توسعه‌یافته بر اساس استانداردهای امنیتی تراکنش و معماری پایدار.</span>
          </div>
          <div className="flex items-center gap-2 text-[#C3A16A]">
            <Shield className="w-4 h-4" />
            <span>پذیرش رمزنگاری‌شده با کد QR اختصاصی</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

