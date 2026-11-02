"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Music2, Ticket, Menu, X, ShieldCheck, QrCode } from "lucide-react";

interface HeaderProps {
  restaurantName?: string;
}

export function Header({ restaurantName = "نام رستوران" }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#FFFCF6]/90 backdrop-blur-md border-b border-[#E6DED1] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#203D33] text-[#FFFCF6] flex items-center justify-center shadow-sm">
              <Music2 className="w-6 h-6 text-[#C3A16A]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#203D33] block">
                {restaurantName}
              </span>
              <span className="text-xs text-[#77756D] block font-medium">
                سالن اختصاصی موسیقی زنده
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#262A25]">
            <a href="#about-lounge" className="hover:text-[#203D33] transition-colors">
              درباره سالن موسیقی
            </a>
            <a href="#purchase-section" className="hover:text-[#203D33] transition-colors">
              خرید بلیت ورودی
            </a>
            <a href="#how-it-works" className="hover:text-[#203D33] transition-colors">
              مراحل پذیرش
            </a>
            <a href="#faq" className="hover:text-[#203D33] transition-colors">
              پرسش‌های متداول
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="px-3.5 py-2 text-xs font-medium text-[#77756D] hover:text-[#203D33] hover:bg-[#203D33]/5 rounded-lg flex items-center gap-1.5 transition-colors"
              title="پنل مدیریت و گزارشات"
            >
              <ShieldCheck className="w-4 h-4 text-[#C3A16A]" />
              پنل مدیریت
            </Link>
            <Link
              href="/staff/scanner"
              className="px-3.5 py-2 text-xs font-medium text-[#203D33] hover:text-[#294D40] hover:bg-[#203D33]/5 rounded-lg flex items-center gap-1.5 transition-colors"
              title="ورود پرسنل کنترل بلیت"
            >
              <QrCode className="w-4 h-4 text-[#A85E48]" />
              گیت ورود
            </Link>
            <a
              href="#purchase-section"
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-[#203D33] text-[#FFFCF6] hover:bg-[#294D40] shadow-sm flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Ticket className="w-4 h-4 text-[#C3A16A]" />
              تهیه بلیت آنلاین
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#262A25] hover:bg-[#E6DED1]/50 focus:outline-none"
              aria-label="منو"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FFFCF6] border-b border-[#E6DED1] px-4 pt-2 pb-6 space-y-3">
          <a
            href="#about-lounge"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#262A25] hover:text-[#203D33]"
          >
            درباره سالن موسیقی
          </a>
          <a
            href="#purchase-section"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#262A25] hover:text-[#203D33]"
          >
            خرید بلیت ورودی
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#262A25] hover:text-[#203D33]"
          >
            مراحل پذیرش
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#262A25] hover:text-[#203D33]"
          >
            پرسش‌های متداول
          </a>
          <div className="pt-3 border-t border-[#E6DED1] flex flex-col gap-2">
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-medium text-[#203D33] bg-[#C3A16A]/10 rounded-xl flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#C3A16A]" />
              پنل مدیریت و آمار
            </Link>
            <Link
              href="/staff/scanner"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-medium text-[#203D33] bg-[#203D33]/5 rounded-xl flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4 text-[#A85E48]" />
              گیت ورود پرسنل
            </Link>
            <a
              href="#purchase-section"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-medium rounded-xl bg-[#203D33] text-[#FFFCF6] flex items-center justify-center gap-2 shadow-sm"
            >
              <Ticket className="w-4 h-4 text-[#C3A16A]" />
              تهیه بلیت ورودی
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

