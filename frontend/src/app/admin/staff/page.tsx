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
    const token = typeof window !== "undefined" ? localStorage.getItem("staff_token") || "" : "";
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

    const token = localStorage.getItem("staff_token") || "";
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
          <h1 className="text-2xl font-bold text-[#203D33]">مدیریت پرسنل و دسترسی‌ها</h1>
          <p className="text-xs text-[#77756D] mt-1">
            تعریف حساب‌های کاربری برای پرسنل گیت ورودی، مدیران سالن و مدیران ارشد
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#203D33] text-[#FFFCF6] text-xs font-bold shadow-xs hover:bg-[#294D40] flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#C3A16A]" />
          افزودن پرسنل جدید
        </button>
      </div>

      {listError && (
        <div className="p-4 rounded-2xl bg-[#A85E48]/10 border border-[#A85E48]/30 text-xs text-[#A85E48]">
          {listError}
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-[#FFFCF6] rounded-3xl border border-[#E6DED1] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#203D33] mx-auto mb-2" />
            <span className="text-xs text-[#77756D]">در حال بارگذاری لیست پرسنل...</span>
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#77756D]">
            هیچ کاربری ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F5F0E7]/80 text-[#77756D] border-b border-[#E6DED1]">
                <tr>
                  <th className="py-3 px-4">نام و نام خانوادگی</th>
                  <th className="py-3 px-4">نام کاربری</th>
                  <th className="py-3 px-4">نقش سازمانی</th>
                  <th className="py-3 px-4">دسترسی اسکنر گیت</th>
                  <th className="py-3 px-4">دسترسی مالی و تنظیمات</th>
                  <th className="py-3 px-4">وضعیت حساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DED1]/50">
                {staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-[#F5F0E7]/40">
                    <td className="py-3.5 px-4 font-bold text-[#262A25]">
                      {st.display_name || st.username}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#77756D]" dir="ltr">
                      {st.username}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.role === "SUPER_ADMIN" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A85E48]/20 text-[#A85E48]">
                          مدیر ارشد (Super Admin)
                        </span>
                      )}
                      {st.role === "ADMIN" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#203D33]/15 text-[#203D33]">
                          مدیر سیستم (Admin)
                        </span>
                      )}
                      {st.role === "STAFF_SCANNER" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C3A16A]/20 text-[#203D33]">
                          مسئول گیت (Scanner)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.can_scan ? (
                        <span className="text-[#203D33] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#203D33]" /> مجاز
                        </span>
                      ) : (
                        <span className="text-[#77756D]">غیرمجاز</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.is_admin || st.is_super_admin ? (
                        <span className="text-[#203D33] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#203D33]" /> مجاز
                        </span>
                      ) : (
                        <span className="text-[#77756D]">عدم دسترسی (محدود به اسکنر)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.is_active ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] bg-[#203D33]/10 text-[#203D33] font-bold">
                          فعال
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] bg-[#A85E48]/10 text-[#A85E48] font-bold">
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
        <div className="fixed inset-0 z-50 bg-[#202823]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFCF6] rounded-3xl max-w-md w-full p-6 border border-[#E6DED1] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DED1]">
              <h2 className="text-base font-bold text-[#203D33]">افزودن حساب پرسنل جدید</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#E6DED1] text-[#77756D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#A85E48]/10 border border-[#A85E48]/30 text-xs text-[#A85E48]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#262A25] mb-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="مثال: محمد امینی"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F0E7]/60 border border-[#E6DED1] text-xs text-[#262A25]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#262A25] mb-1">
                  نام کاربری (انگلیسی)
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="m_amini"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F0E7]/60 border border-[#E6DED1] text-xs text-[#262A25]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#262A25] mb-1">
                  رمز عبور اولیه
                </label>
                <input
                  type="password"
                  required
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۸ کاراکتر..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F0E7]/60 border border-[#E6DED1] text-xs text-[#262A25]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#262A25] mb-1">
                  نقش سازمانی
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F0E7]/60 border border-[#E6DED1] text-xs text-[#262A25]"
                >
                  <option value="STAFF_SCANNER">مسئول گیت و کنترل بلیت (Scanner Staff)</option>
                  <option value="ADMIN">مدیر عملیات (Admin)</option>
                  <option value="SUPER_ADMIN">مدیر ارشد (Super Admin)</option>
                </select>
                <span className="text-[11px] text-[#77756D] mt-1 block">
                  پرسنل اسکنر صرفاً به صفحه اسکنر بلیت دسترسی دارند و اطلاعات مالی به آنها نمایش داده نمی‌شود.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F5F0E7] text-[#77756D] font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#203D33] text-[#FFFCF6] font-bold hover:bg-[#294D40] disabled:opacity-50"
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

