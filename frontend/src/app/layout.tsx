import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";

const vazirmatn = localFont({
  src: "../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn[wght].woff2",
  variable: "--font-vazirmatn",
  weight: "100 900",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "خرید بلیت سالن موسیقی زنده رستوران",
  description: "سامانه رزرو و خرید بلیت ورودی بخش موسیقی زنده رستوران. بلیت معتبر همان روز با پذیرش اختصاصی.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-screen bg-[#F5F0E7] text-[#262A25] font-sans antialiased selection:bg-[#203D33] selection:text-[#FFFCF6]">
        {children}
      </body>
    </html>
  );
}

