"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StaffUser } from "@/types";
import { Users, UserPlus, Shield, CheckCircle2, XCircle, Loader2, X } from "lucide-react";

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("STAFF_SCANNER");
  const [createLoading, setCreateLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchStaff = () => {
    setLoading(true);
    setListError("");
    const token = "";
    api.getAdminStaff(token)
      .then((data) => setStaffList(data || []))
      .catch((err) => {
        console.error(err);
        setListError(err.message || "خطا در دریافت لیست پرسنل");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setErrorMsg("");

    const token = "";
    try {
      await api.createAdminStaff(token, {
        username: newUsername.trim(),
        display_name: newDisplayName.trim(),
        password: newPassword,
        role: newRole,
      });
      setModalOpen(false);
      setNewUsername("");
      setNewDisplayName("");
      setNewPassword("");
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ایجاد کاربر پرسنل.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#246D7A]">مدیریت پرسنل و دسترسی‌ها</h1>
          <p className="text-xs text-[#526A70] mt-1">
            تعریف حساب‌های کاربری برای پرسنل گیت ورودی، مدیران سالن و مدیران ارشد
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#246D7A] text-[#FFFFFF] text-xs font-bold shadow-xs hover:bg-[#195560] flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#C85D3D]" />
          افزودن پرسنل جدید
        </button>
      </div>

      {listError && (
        <div className="p-4 rounded-2xl bg-[#A9453A]/10 border border-[#A9453A]/30 text-xs text-[#A9453A]">
          {listError}
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#DCE9E8] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#246D7A] mx-auto mb-2" />
            <span className="text-xs text-[#526A70]">در حال بارگذاری لیست پرسنل...</span>
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#526A70]">
            هیچ کاربری ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F3F8F7]/80 text-[#526A70] border-b border-[#DCE9E8]">
                <tr>
                  <th className="py-3 px-4">نام و نام خانوادگی</th>
                  <th className="py-3 px-4">نام کاربری</th>
                  <th className="py-3 px-4">نقش سازمانی</th>
                  <th className="py-3 px-4">دسترسی اسکنر گیت</th>
                  <th className="py-3 px-4">دسترسی مالی و تنظیمات</th>
                  <th className="py-3 px-4">وضعیت حساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE9E8]/50">
                {staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-[#F3F8F7]/40">
                    <td className="py-3.5 px-4 font-bold text-[#213F48]">
                      {st.display_name || st.username}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#526A70]" dir="ltr">
                      {st.username}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.role === "SUPER_ADMIN" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A9453A]/20 text-[#A9453A]">
                          مدیر ارشد (Super Admin)
                        </span>
                      )}
                      {st.role === "ADMIN" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#246D7A]/15 text-[#246D7A]">
                          مدیر سیستم (Admin)
                        </span>
                      )}
                      {st.role === "STAFF_SCANNER" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C85D3D]/20 text-[#246D7A]">
                          مسئول گیت (Scanner)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.can_scan ? (
                        <span className="text-[#246D7A] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#246D7A]" /> مجاز
                        </span>
                      ) : (
                        <span className="text-[#526A70]">غیرمجاز</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.is_admin || st.is_super_admin ? (
                        <span className="text-[#246D7A] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#246D7A]" /> مجاز
                        </span>
                      ) : (
                        <span className="text-[#526A70]">عدم دسترسی (محدود به اسکنر)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.is_active ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] bg-[#246D7A]/10 text-[#246D7A] font-bold">
                          فعال
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] bg-[#A9453A]/10 text-[#A9453A] font-bold">
                          غیرفعال
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#173643]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full p-6 border border-[#DCE9E8] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE9E8]">
              <h2 className="text-base font-bold text-[#246D7A]">افزودن حساب پرسنل جدید</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#DCE9E8] text-[#526A70]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#A9453A]/10 border border-[#A9453A]/30 text-xs text-[#A9453A]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#213F48] mb-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="مثال: محمد امینی"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#213F48] mb-1">
                  نام کاربری (انگلیسی)
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="m_amini"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#213F48] mb-1">
                  رمز عبور اولیه
                </label>
                <input
                  type="password"
                  required
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۸ کاراکتر..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#213F48] mb-1">
                  نقش سازمانی
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F8F7]/60 border border-[#DCE9E8] text-xs text-[#213F48]"
                >
                  <option value="STAFF_SCANNER">مسئول گیت و کنترل بلیت (Scanner Staff)</option>
                  <option value="ADMIN">مدیر عملیات (Admin)</option>
                  <option value="SUPER_ADMIN">مدیر ارشد (Super Admin)</option>
                </select>
                <span className="text-[11px] text-[#526A70] mt-1 block">
                  پرسنل اسکنر صرفاً به صفحه اسکنر بلیت دسترسی دارند و اطلاعات مالی به آنها نمایش داده نمی‌شود.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F3F8F7] text-[#526A70] font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#246D7A] text-[#FFFFFF] font-bold hover:bg-[#195560] disabled:opacity-50"
                >
                  {createLoading ? "در حال ایجاد..." : "ایجاد پرسنل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

