"use client";
import React, { useState } from "react";
import { Menu, X, ArrowLeft } from "lucide-react";

export function Header({ restaurantName = "بلیت موسیقی زنده" }: { restaurantName?: string }) {
  const [open, setOpen] = useState(false);
  const links = [["#about-lounge", "درباره بلیت"], ["#how-it-works", "راهنمای خرید"], ["#faq", "پرسش‌های متداول"]];
  return <header className="site-header"><div className="header-inner wrap">
    <a href="/" className="brand" aria-label={`${restaurantName}، صفحه اصلی`}><span><strong>{restaurantName}</strong><small>سالن موسیقی زنده</small></span></a>
    <nav className="desktop-nav" aria-label="فهرست اصلی">{links.map(([href, label]) => <a href={href} key={href}>{label}</a>)}</nav>
    <a className="header-cta" href="#purchase-section">تهیه بلیت <ArrowLeft size={17} /></a>
    <button className="menu-toggle" type="button" onClick={() => setOpen(!open)} aria-label={open ? "بستن منو" : "باز کردن منو"} aria-expanded={open} aria-controls="mobile-nav">{open ? <X /> : <Menu />}</button>
  </div>{open && <nav id="mobile-nav" className="mobile-nav" aria-label="فهرست موبایل">{links.map(([href, label]) => <a href={href} key={href} onClick={() => setOpen(false)}>{label}</a>)}<a href="#purchase-section" onClick={() => setOpen(false)}>تهیه بلیت <ArrowLeft size={17} aria-hidden="true" /></a></nav>}</header>;
}
