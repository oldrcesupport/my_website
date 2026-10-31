"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CheckInScanResult } from "@/types";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Lock,
} from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function VerifyQrPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawToken = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CheckInScanResult | null>(null);
  const [staffLoggedIn, setStaffLoggedIn] = useState(false);

  useEffect(() => {
    const staffToken =
      typeof window !== "undefined" ? localStorage.getItem("staff_token") || "" : "";

    if (!staffToken) {
      setStaffLoggedIn(false);
      setLoading(false);
      return;
    }

    setStaffLoggedIn(true);
    api
      .staffCheckIn(rawToken, "direct-camera-link", staffToken)
      .then((res) => {
        setResult(res);
      })
      .catch((err) => {
        let resPayload: CheckInScanResult = {
          result: "INVALID_TOKEN",
          message: err.message || "خطای بررسی بلیت",
        };
        if (err.status === 409) {
          resPayload = {
            result: "ALREADY_USED",
            message: err.message || "این بلیت قبلاً استفاده شده است.",
          };
        } else if (err.status === 404) {
          resPayload = {
            result: "INVALID_TOKEN",
            message: "بارکد در سامانه یافت نشد.",
          };
        }
        setResult(resPayload);
      })
      .finally(() => setLoading(false));
  }, [rawToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#203D33]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-[#FFFCF6] rounded-3xl p-8 border border-[#E6DED1] shadow-xl text-center space-y-6">
        
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#203D33] text-[#FFFCF6] mx-auto flex items-center justify-center shadow-xs">
          <QrCode className="w-7 h-7 text-[#C3A16A]" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#203D33]">بررسی اصالت بلیت ورودی</h1>
          <p className="text-xs text-[#77756D] mt-1">سالن اختصاصی موسیقی زنده</p>
        </div>

        {/* Staff logged in result */}
        {staffLoggedIn && result && (
          <div
            className={`p-6 rounded-2xl border text-center space-y-3 ${
              result.result === "SUCCESS"
                ? "bg-[#203D33] text-[#FFFCF6] border-[#203D33]"
                : result.result === "ALREADY_USED"
                ? "bg-[#A85E48] text-[#FFFCF6] border-[#A85E48]"
                : "bg-[#77756D] text-[#FFFCF6] border-[#77756D]"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#FFFCF6]/20 mx-auto flex items-center justify-center">
              {result.result === "SUCCESS" ? (
                <CheckCircle2 className="w-7 h-7 text-[#C3A16A]" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-[#FFFCF6]" />
              )}
            </div>
            <h2 className="text-lg font-bold">
              {result.result === "SUCCESS" ? "ورود مجاز است (پذیرش شد)" : "بلیت غیرقابل استفاده"}
            </h2>
            <p className="text-xs text-[#FFFCF6]/90 leading-relaxed">{result.message}</p>
            {result.ticket_number && (
              <span className="inline-block px-3 py-1 rounded-full bg-[#FFFCF6]/20 font-mono text-xs" dir="ltr">
                {result.ticket_number}
              </span>
            )}
          </div>
        )}

        {/* Not logged in */}
        {!staffLoggedIn && (
          <div className="p-5 rounded-2xl bg-[#F5F0E7] border border-[#E6DED1] text-xs text-[#262A25] space-y-3 text-right">
            <div className="flex items-center gap-2 font-bold text-[#203D33]">
              <Lock className="w-4 h-4 text-[#A85E48]" />
              <span>پذیرش بلیت مستلزم ورود پرسنل است</span>
            </div>
            <p className="text-[#77756D] leading-relaxed">
              این بارکد حاوی اطلاعات دیجیتال معتبر است. برای ثبت قطعی ورود مهمان به سالن، لطفاً با حساب پرسنل گیت ورودی وارد شوید.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 space-y-2">
          {staffLoggedIn ? (
            <Link
              href="/staff/scanner"
              className="w-full py-3 rounded-xl bg-[#203D33] text-[#FFFCF6] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#294D40]"
            >
              بازگشت به اسکنر گیت ورودی
            </Link>
          ) : (
            <Link
              href="/admin/login?redirect=/staff/scanner"
              className="w-full py-3 rounded-xl bg-[#203D33] text-[#FFFCF6] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#294D40]"
            >
              ورود پرسنل سالن
            </Link>
          )}

          <Link
            href="/"
            className="w-full py-2.5 rounded-xl border border-[#E6DED1] text-xs font-medium text-[#77756D] flex items-center justify-center gap-2 hover:bg-[#F5F0E7]"
          >
            صفحه اصلی
          </Link>
        </div>

      </div>
    </div>
  );
}

