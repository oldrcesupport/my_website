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
    api
      .getMe("")
      .then((user) => {
        if (!user.can_scan) throw Object.assign(new Error("دسترسی اسکن مجاز نیست."), { status: 403 });
        setStaffLoggedIn(true);
        return api.staffCheckIn(rawToken, "direct-camera-link", "");
      })
      .then((res) => {
        setResult(res);
      })
      .catch((err) => {
        let resPayload: CheckInScanResult = {
          result: err.status === 401 || err.status === 403 ? "AUTH_ERROR" : err.status ? "SERVER_ERROR" : "NETWORK_ERROR",
          message: err.message || "امکان بررسی بلیت وجود ندارد؛ دوباره تلاش کنید.",
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
      <div className="min-h-screen bg-[#F6F9F9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#173643]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9F9] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-[#FFFFFF] rounded-3xl p-8 border border-[#DCE8E8] shadow-xl text-center space-y-6">
        
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#173643] text-[#FFFFFF] mx-auto flex items-center justify-center shadow-xs">
          <QrCode className="w-7 h-7 text-[#24647B]" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#173643]">بررسی اصالت بلیت ورودی</h1>
          <p className="text-xs text-[#536B73] mt-1">سالن اختصاصی موسیقی زنده</p>
        </div>

        {/* Staff logged in result */}
        {staffLoggedIn && result && (
          <div
            className={`p-6 rounded-2xl border text-center space-y-3 ${
              result.result === "SUCCESS"
                ? "bg-[#173643] text-[#FFFFFF] border-[#173643]"
                : result.result === "ALREADY_USED"
                ? "bg-[#B34553] text-[#FFFFFF] border-[#B34553]"
                : "bg-[#536B73] text-[#FFFFFF] border-[#536B73]"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#FFFFFF]/20 mx-auto flex items-center justify-center">
              {result.result === "SUCCESS" ? (
                <CheckCircle2 className="w-7 h-7 text-[#24647B]" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-[#FFFFFF]" />
              )}
            </div>
            <h2 className="text-lg font-bold">
              {result.result === "SUCCESS" ? "ورود مجاز است (پذیرش شد)" : "بلیت غیرقابل استفاده"}
            </h2>
            <p className="text-xs text-[#FFFFFF]/90 leading-relaxed">{result.message}</p>
            {result.ticket_number && (
              <span className="inline-block px-3 py-1 rounded-full bg-[#FFFFFF]/20 font-mono text-xs" dir="ltr">
                {result.ticket_number}
              </span>
            )}
          </div>
        )}

        {/* Not logged in */}
        {!staffLoggedIn && (
          <div className="p-5 rounded-2xl bg-[#F6F9F9] border border-[#DCE8E8] text-xs text-[#243E46] space-y-3 text-right">
            <div className="flex items-center gap-2 font-bold text-[#173643]">
              <Lock className="w-4 h-4 text-[#B34553]" />
              <span>برای پذیرش بلیت</span>
            </div>
            <p className="text-[#536B73] leading-relaxed">
              این کد را به مسئول پذیرش سالن نشان دهید.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 space-y-2">
          {staffLoggedIn && (
            <Link href="/staff/scanner" className="w-full py-3 rounded-xl bg-[#246D7A] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#195560]">بازگشت به اسکنر</Link>
          )}

          <Link
            href="/"
            className="w-full py-2.5 rounded-xl border border-[#DCE8E8] text-xs font-medium text-[#536B73] flex items-center justify-center gap-2 hover:bg-[#F6F9F9]"
          >
            صفحه اصلی
          </Link>
        </div>

      </div>
    </div>
  );
}

