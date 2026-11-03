import React from "react";
interface FooterProps { restaurantName?: string; tagline?: string; address?: string; phone?: string; }
export function Footer({ restaurantName = "بلیت موسیقی زنده", tagline, address, phone }: FooterProps) {
  return <footer className="public-footer"><div className="wrap footer-grid"><div><div className="footer-brand"><strong>{restaurantName}</strong></div><p>{tagline || "بلیت ورودی سالن موسیقی زنده"}</p>{address && <p>{address}</p>}{phone && <p dir="auto">{phone}</p>}</div><div><strong>دسترسی سریع</strong><a href="#purchase-section">خرید بلیت</a><a href="#how-it-works">راهنمای خرید</a><a href="#faq">پرسش‌های متداول</a></div></div><div className="wrap footer-bottom">© تمامی حقوق متعلق به {restaurantName} است.</div></footer>;
}
