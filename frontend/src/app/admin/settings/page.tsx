"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatToman } from "@/lib/utils";
import { Settings, Save, AlertCircle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState({
    restaurant_name: "",
    tagline: "",
    description: "",
    address: "",
    phone: "",
    ticket_price_toman: 0,
    is_demo_price: true,
    sales_enabled: true,
    business_timezone: "Asia/Tehran",
    business_day_cutoff: "00:00:00",
    checkout_cutoff_margin_minutes: 5,
    capacity_policy: "UNCONFIGURED",
  });

  const [initialData, setInitialData] = useState<typeof formData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = "";
    api.getAdminSettings(token)
      .then((data) => {
        const loadedData = {
          restaurant_name: data.restaurant_name || "",
          tagline: data.tagline || "",
          description: data.description || "",
          address: data.address || "",
          phone: data.phone || "",
          ticket_price_toman: data.ticket_price_toman ?? 0,
          is_demo_price: data.is_demo_price ?? true,
          sales_enabled: data.sales_enabled ?? true,
          business_timezone: data.business_timezone || "Asia/Tehran",
          business_day_cutoff: data.business_day_cutoff || "00:00:00",
          checkout_cutoff_margin_minutes: data.checkout_cutoff_margin_minutes ?? 5,
          capacity_policy: data.capacity_policy || "UNCONFIGURED",
        };
        setFormData(loadedData);
        setInitialData(loadedData);
        setLoaded(true);
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const token = "";
    try {
      const normalized = { ...formData, ticket_price_toman: Number(formData.ticket_price_toman), checkout_cutoff_margin_minutes: Number(formData.checkout_cutoff_margin_minutes) };
      const changes = Object.fromEntries(Object.entries(normalized).filter(([key, value]) => value !== initialData?.[key as keyof typeof normalized]));
      if (Object.keys(changes).length) {
        await api.updateAdminSettings(token, changes);
        setFormData(normalized);
        setInitialData(normalized);
      }
      setSuccessMsg("تنظیمات با موفقیت ذخیره و اعمال شدند.");
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در به‌روزرسانی تنظیمات.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#526A70]">در حال بارگذاری تنظیمات...</div>;
  }

  if (!loaded) {
    return <div role="alert" className="p-4 text-sm text-[#733c2d]">بارگذاری تنظیمات انجام نشد: {errorMsg || "خطای ارتباط با سرور"}</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#246D7A]">تنظیمات رستوران و روز کاری</h1>
        <p className="text-xs text-[#526A70] mt-1">
          پیکربندی هویت رستوران، نرخ بلیت، ساعت برش روز کاری و وضعیت فروش آنلاین
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#246D7A]/10 border border-[#246D7A]/30 text-xs font-bold text-[#246D7A] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#246D7A]" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#A9453A]/10 border border-[#A9453A]/30 text-xs font-bold text-[#A9453A] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#A9453A]" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Brand Information Section */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#DCE9E8] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#246D7A] pb-2 border-b border-[#DCE9E8]">
            هویت و اطلاعات رستوران
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#213F48] mb-1">
                نام رستوران
              </label>
              <input
                type="text"
                required
                value={formData.restaurant_name}
                onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#213F48] mb-1">
                شعار / زیرعنوان
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#213F48] mb-1">
                توضیحات کوتاه
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#213F48] mb-1">
                شماره تماس رستوران
              </label>
              <input
                type="text"
                dir="ltr"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="021-..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#213F48] mb-1">
                نشانی فیزیکی رستوران
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Business Day Policy */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#DCE9E8] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#246D7A] pb-2 border-b border-[#DCE9E8]">
            نرخ بلیت و تقویم کاری
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#213F48] mb-1">
                قیمت هر بلیت ورودی (تومان)
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.ticket_price_toman}
                onChange={(e) => setFormData({ ...formData, ticket_price_toman: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs font-bold text-[#246D7A]"
              />
              <span className="text-[11px] text-[#526A70] mt-1 block">
                معادل: {formatToman(Number(formData.ticket_price_toman))}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#213F48] mb-1">
                ساعت برش روز کاری (Cutoff Time)
              </label>
              <input
                type="time"
                step="1"
                required
                value={formData.business_day_cutoff}
                onChange={(e) => setFormData({ ...formData, business_day_cutoff: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
              />
              <span className="text-[11px] text-[#526A70] mt-1 block">
                پیش‌فرض: 00:00:00 (نیمه‌شب). در صورت فعالیت شبانه می‌توان به عنوان مثال 04:00:00 تنظیم نمود.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#213F48] mb-1">
                فاصله توقف فروش پیش از برش روز (دقیقه)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={formData.checkout_cutoff_margin_minutes}
                onChange={(e) => setFormData({ ...formData, checkout_cutoff_margin_minutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#213F48] mb-1">
                سیاست ظرفیت سالن
              </label>
              <input
                type="text"
                disabled
                value="تنظیم نشده (UNCONFIGURED)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#DCE9E8]/50 border border-[#DCE9E8] text-xs text-[#526A70] cursor-not-allowed"
              />
              <span className="text-[11px] text-[#526A70] mt-1 block">
                محدودیت ظرفیت تا زمان اعلام سیاست رسمی سالن (فروش روزانه یا اشغال همزمان) غیرفعال است.
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_demo_price}
                onChange={(e) => setFormData({ ...formData, is_demo_price: e.target.checked })}
                className="w-4 h-4 rounded-sm text-[#246D7A] accent-[#246D7A]"
              />
              <span className="text-xs font-semibold text-[#213F48]">
                حالت قیمت آزمایشی فعال است (نمایش برچسب Demo به مشتریان)
              </span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sales_enabled}
                onChange={(e) => setFormData({ ...formData, sales_enabled: e.target.checked })}
                className="w-4 h-4 rounded-sm text-[#246D7A] accent-[#246D7A]"
              />
              <span className="text-xs font-semibold text-[#213F48]">
                فروش آنلاین بلیت فعال است
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-[#246D7A] text-[#FFFFFF] hover:bg-[#195560] text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#C85D3D]" />
            <span>{saving ? "در حال ذخیره..." : "ذخیره تغییرات"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}

