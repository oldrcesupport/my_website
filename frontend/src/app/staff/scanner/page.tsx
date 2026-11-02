"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CheckInScanResult, StaffUser } from "@/types";
import { formatTimeOnly, formatDateTime, toPersianDigits } from "@/lib/utils";
import {
  Camera,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  History,
  Shield,
  Loader2,
  Lock,
} from "lucide-react";

function playAudioFeedback(success: boolean) {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pleasant A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime); // Low buzz
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {}

  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(success ? [80] : [200, 100, 200]);
    }
  } catch {}
}

export default function StaffScannerPage() {
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<StaffUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authError, setAuthError] = useState("");

  // Scanner state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [manualCode, setManualCode] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  // Scan outcome feedback
  const [scanResult, setScanResult] = useState<CheckInScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const html5QrCodeRef = useRef<any>(null);
  const isPausedRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);
  const scannerContainerId = "qr-reader-container";

  // Check login state
  useEffect(() => {
    const savedToken = "";

    api.getMe(savedToken)
      .then((u) => {
        setUser(u);
        loadHistory(savedToken);
      })
      .catch((err) => {
        if (err.status !== 401 && err.status !== 403) {
          setAuthError("امکان بررسی نشست پرسنل به دلیل خطای ارتباط با سرور وجود ندارد.");
        }
        setToken("");
      })
      .finally(() => setAuthChecking(false));
  }, []);

  const loadHistory = (staffToken: string) => {
    api.getStaffCheckInHistory(staffToken)
      .then((history) => setRecentScans(history))
      .catch((err) => console.error("Error loading scan history:", err));
  };

  // Enumerate cameras safely with dynamic import
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      import("html5-qrcode").then(({ Html5Qrcode }) => {
        Html5Qrcode.getCameras()
          .then((devices) => {
            if (devices && devices.length) {
              setCameras(devices);
              // Default to back/environment camera if present
              const backCam = devices.find(
                (d) =>
                  d.label.toLowerCase().includes("back") ||
                  d.label.toLowerCase().includes("environment")
              );
              setSelectedCamera(backCam ? backCam.id : devices[0].id);
            }
          })
          .catch((err) => console.warn("Camera enumeration error:", err));
      });
    }
  }, [user]);

  // Handle starting/stopping scanner
  const startCamera = async () => {
    if (!selectedCamera) return;
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      await html5QrCodeRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleTokenScan(decodedText);
        },
        () => {} // ignore scan frame failures
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera start failed:", err);
      alert("عدم امکان دسترسی به دوربین. لطفاً مجوز دسترسی را بررسی نمایید.");
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        isPausedRef.current = false;
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.warn("Camera stop caught safely:", err);
      } finally {
        setCameraActive(false);
      }
    } else {
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
        } catch {
          // safely ignored
        }
      }
    };
  }, []);

  const handleTokenScan = async (rawInput: string) => {
    const cleaned = rawInput.trim();
    if (processing || !cleaned || isPausedRef.current) return;

    // Debounce guard: Drop duplicate scans of the exact same code within 6 seconds
    const now = Date.now();
    if (cleaned === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 6000) {
      return;
    }

    lastScannedCodeRef.current = cleaned;
    lastScannedTimeRef.current = now;
    setProcessing(true);

    // PAUSE camera immediately so subsequent frames are not processed
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.pause(true);
        isPausedRef.current = true;
      }
    } catch (e) {
      console.warn("Pause camera caught:", e);
    }

    try {
      const res = await api.staffCheckIn(cleaned, "gate-mobile-01", token);
      setScanResult(res);
      playAudioFeedback(true);
      loadHistory(token);
    } catch (err: any) {
      let resPayload: CheckInScanResult;

      const businessResults = ["ALREADY_USED", "INVALID_TOKEN", "EXPIRED", "CANCELLED", "ORDER_UNPAID"];
      if (err.body && businessResults.includes(err.body.result)) {
        resPayload = err.body as CheckInScanResult;
      } else if (!err.status || err.name === "TypeError" || err.message?.includes("fetch") || err.message?.includes("network")) {
        // Network connection error / offline
        resPayload = {
          result: "NETWORK_ERROR",
          message: "خطای اتصال شبکه یا قطعی اینترنت. لطفاً اتصال شبکه را بررسی فرمایید (بارکد نامعتبر نیست).",
        };
      } else if (err.status >= 500) {
        // Server infrastructure error
        resPayload = {
          result: "SERVER_ERROR",
          message: "خطای موقت در سرور پذیرش (۵۰۰). لطفاً مجدداً تلاش نمایید (بارکد نامعتبر نیست).",
        };
      } else if (err.status === 401 || err.status === 403) {
        // Auth failure
        resPayload = {
          result: "AUTH_ERROR",
          message: "نشست پرسنلی منقضی شده یا دسترسی مجاز نیست. لطفاً مجدداً وارد حساب کاربری شوید.",
        };
      } else {
        resPayload = {
          result: "SERVER_ERROR",
          message: err.message || "امکان بررسی بلیت وجود ندارد؛ دوباره تلاش کنید.",
        };
      }

      setScanResult(resPayload);
      playAudioFeedback(false);
      loadHistory(token);
    } finally {
      setProcessing(false);
    }
  };

  const resumeScanner = () => {
    setScanResult(null);
    lastScannedCodeRef.current = "";
    lastScannedTimeRef.current = 0;
    try {
      if (html5QrCodeRef.current && isPausedRef.current) {
        html5QrCodeRef.current.resume();
        isPausedRef.current = false;
      }
    } catch (e) {
      console.warn("Resume camera caught:", e);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleTokenScan(manualCode);
    setManualCode("");
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#203D33]" />
      </div>
    );
  }

  if (authError) {
    return <div role="alert" className="min-h-screen p-8 text-center">{authError} <button className="underline" onClick={() => window.location.reload()}>تلاش مجدد</button></div>;
  }

  // Not logged in -> Show login redirect
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#FFFCF6] rounded-3xl p-8 border border-[#E6DED1] text-center space-y-5 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-[#203D33] text-[#FFFCF6] mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7 text-[#C3A16A]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#203D33]">ورود پرسنل کنترل بلیت</h1>
            <p className="text-xs text-[#77756D] mt-1.5">
              برای دسترسی به اسکنر گیت ورودی، لطفاً ابتدا با حساب پرسنلی خود وارد شوید.
            </p>
          </div>
          <Link
            href="/admin/login?redirect=/staff/scanner"
            className="w-full py-3.5 px-6 rounded-2xl bg-[#203D33] text-[#FFFCF6] hover:bg-[#294D40] text-sm font-bold shadow-md flex items-center justify-center gap-2"
          >
            صفحه ورود به سیستم
          </Link>
          <div className="pt-2">
            <Link href="/" className="text-xs text-[#77756D] hover:text-[#203D33]">
              بازگشت به وب‌سایت
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E7] pb-16">
      {/* Top Staff Navbar */}
      <header className="bg-[#203D33] text-[#FFFCF6] px-4 py-4 border-b border-[#294D40]">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-[#C3A16A] text-[#203D33] flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5 text-[#203D33]" />
            </div>
            <div className="min-w-0 break-words">
              <span className="text-sm font-bold block">گیت پذیرش سالن موسیقی</span>
              <span className="text-xs text-[#E6DED1]/80 block">
                پرسنل: {user.display_name || user.username}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(user.is_admin || user.is_super_admin) && (
              <Link
                href="/admin/dashboard"
                className="text-xs px-3 py-1.5 rounded-lg bg-[#C3A16A] hover:bg-[#b08f58] text-[#203D33] font-bold flex items-center gap-1"
              >
                پنل مدیریت
              </Link>
            )}
            <Link
              href="/"
              className="text-xs px-3 py-1.5 rounded-lg bg-[#FFFCF6]/10 hover:bg-[#FFFCF6]/20 text-[#E6DED1]"
            >
              صفحه اصلی
            </Link>
            <button
              onClick={async () => {
                try {
                  await api.logout("");
                  setUser(null);
                  setToken("");
                } catch {
                  window.alert("خروج انجام نشد؛ دوباره تلاش کنید.");
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#A85E48]/80 hover:bg-[#A85E48] text-[#FFFCF6]"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Real-time Scan Result Banner */}
        {scanResult && (
          <div
            className={`p-6 rounded-3xl border shadow-lg text-center space-y-3 transition-all ${
              scanResult.result === "SUCCESS"
                ? "bg-[#203D33] text-[#FFFCF6] border-[#203D33]"
                : scanResult.result === "ALREADY_USED"
                ? "bg-[#A85E48] text-[#FFFCF6] border-[#A85E48]"
                : scanResult.result === "NETWORK_ERROR" || scanResult.result === "SERVER_ERROR"
                ? "bg-[#8A5B20] text-[#FFFCF6] border-[#8A5B20]"
                : scanResult.result === "AUTH_ERROR"
                ? "bg-[#6B21A8] text-[#FFFCF6] border-[#6B21A8]"
                : "bg-[#77756D] text-[#FFFCF6] border-[#77756D]"
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-[#FFFCF6]/20 mx-auto flex items-center justify-center">
              {scanResult.result === "SUCCESS" && <CheckCircle2 className="w-8 h-8 text-[#C3A16A]" />}
              {scanResult.result === "ALREADY_USED" && <AlertTriangle className="w-8 h-8 text-[#FFFCF6]" />}
              {(scanResult.result === "NETWORK_ERROR" || scanResult.result === "SERVER_ERROR" || scanResult.result === "AUTH_ERROR") && (
                <AlertTriangle className="w-8 h-8 text-[#FFFCF6]" />
              )}
              {scanResult.result !== "SUCCESS" &&
                scanResult.result !== "ALREADY_USED" &&
                scanResult.result !== "NETWORK_ERROR" &&
                scanResult.result !== "SERVER_ERROR" &&
                scanResult.result !== "AUTH_ERROR" && <XCircle className="w-8 h-8 text-[#FFFCF6]" />}
            </div>

            <h2 className="text-xl font-bold">
              {scanResult.result === "SUCCESS" && "ورود مجاز است (پذیرش شد)"}
              {scanResult.result === "ALREADY_USED" && "توجه: این بلیت قبلاً استفاده شده است!"}
              {scanResult.result === "EXPIRED" && "بلیت منقضی شده است"}
              {scanResult.result === "CANCELLED" && "بلیت باطل و لغو شده است"}
              {scanResult.result === "INVALID_TOKEN" && "بارکد نامعتبر است"}
              {scanResult.result === "ORDER_UNPAID" && "سفارش پرداخت‌نشده است"}
              {scanResult.result === "NETWORK_ERROR" && "خطای ارتباط شبکه یا آفلاین"}
              {scanResult.result === "SERVER_ERROR" && "خطای موقت در سرور پذیرش"}
              {scanResult.result === "AUTH_ERROR" && "خطای احراز هویت پرسنل"}
            </h2>

            <p className="text-sm text-[#FFFCF6]/90 leading-relaxed max-w-sm mx-auto">
              {scanResult.message}
            </p>

            {scanResult.ticket_number && (
              <div className="inline-block px-4 py-1.5 rounded-full bg-[#FFFCF6]/15 font-mono text-xs tracking-wider" dir="ltr">
                {scanResult.ticket_number}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={resumeScanner}
                className="px-6 py-2.5 rounded-xl bg-[#FFFCF6] text-[#203D33] text-xs font-bold shadow-md hover:bg-[#F5F0E7] flex items-center gap-1.5 mx-auto transition-transform active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C3A16A]" />
                اسکن بلیت بعدی
              </button>
            </div>
          </div>
        )}

        {/* Camera Viewport Container */}
        <div className="bg-[#FFFCF6] rounded-3xl p-6 border border-[#E6DED1] shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#203D33] flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#C3A16A]" />
              دوربین اسکن بارکد
            </h3>

            {cameras.length > 1 && (
              <select
                value={selectedCamera}
                onChange={(e) => {
                  setSelectedCamera(e.target.value);
                  if (cameraActive) {
                    stopCamera().then(() => startCamera());
                  }
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#F5F0E7] border border-[#E6DED1] text-[#262A25] focus:outline-none"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `دوربین ${c.id.substring(0, 5)}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Video Target Box */}
          <div className="overflow-hidden rounded-2xl bg-[#202823] min-h-[260px] flex items-center justify-center relative">
            <div id={scannerContainerId} className="w-full" />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[#E6DED1]/70 space-y-3">
                <Camera className="w-10 h-10 text-[#C3A16A]/70" />
                <span className="text-xs">دوربین غیرفعال است. جهت آغاز بررسی بارکدها دکمه زیر را لمس نمایید.</span>
              </div>
            )}
          </div>

          {/* Camera Toggle Button */}
          <div>
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="w-full py-3.5 rounded-2xl bg-[#203D33] text-[#FFFCF6] hover:bg-[#294D40] text-sm font-bold shadow-sm flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#C3A16A]" />
                روشن کردن دوربین اسکن
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="w-full py-3.5 rounded-2xl bg-[#A85E48]/90 text-[#FFFCF6] hover:bg-[#A85E48] text-sm font-bold shadow-sm flex items-center justify-center gap-2"
              >
                خاموش کردن دوربین
              </button>
            )}
          </div>
        </div>

        {/* Manual Code Fallback Input */}
        <div className="bg-[#FFFCF6] rounded-3xl p-6 border border-[#E6DED1] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#203D33] flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-[#C3A16A]" />
            ورود دستی کد یا توکن بارکد (جایگزین دوربین)
          </h3>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="شماره سریال بلیت (مثلاً TKT-20261031-XXXXXX) یا توکن بارکد..."
              dir="ltr"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F5F0E7] border border-[#E6DED1] text-xs font-mono text-[#262A25] placeholder:text-[#77756D]/60 focus:outline-none focus:ring-1 focus:ring-[#203D33]"
            />
            <button
              type="submit"
              disabled={processing || !manualCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#203D33] text-[#FFFCF6] hover:bg-[#294D40] disabled:opacity-40 text-xs font-bold"
            >
              بررسی
            </button>
          </form>
        </div>

        {/* Recent Scan History */}
        <div className="bg-[#FFFCF6] rounded-3xl p-6 border border-[#E6DED1] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DED1]">
            <h3 className="text-xs font-bold text-[#203D33] flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#77756D]" />
              آخرین اسکن‌های انجام‌شده
            </h3>
            <span className="text-[11px] text-[#77756D]">
              {toPersianDigits(recentScans.length)} مورد
            </span>
          </div>

          <div className="divide-y divide-[#E6DED1]/50 max-h-60 overflow-y-auto">
            {recentScans.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#77756D]">
                هنوز هیچ بلیتی توسط شما اسکن نشده است.
              </div>
            ) : (
              recentScans.map((rec) => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#203D33] block" dir="ltr">
                      {rec.ticket_number || "کد نامعتبر"}
                    </span>
                    <span className="text-[11px] text-[#77756D] block">
                      {formatTimeOnly(rec.scanned_at)}
                    </span>
                  </div>
                  <div>
                    {rec.result === "SUCCESS" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#203D33]/10 text-[#203D33]">
                        پذیرش شد
                      </span>
                    )}
                    {rec.result === "ALREADY_USED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A85E48]/15 text-[#A85E48]">
                        قبلاً استفاده شده
                      </span>
                    )}
                    {rec.result !== "SUCCESS" && rec.result !== "ALREADY_USED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#77756D]/15 text-[#77756D]">
                        ناموفق ({rec.result})
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

