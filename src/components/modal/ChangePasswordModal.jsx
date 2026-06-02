import { KeyIcon, X } from "lucide-react";
import React from 'react';
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const ChangePasswordModal = ({
    setIsPasswordModalOpen,
    passwordForm,
    setPasswordForm,
    handlePasswordSubmit,
}) => {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).modals?.changePassword || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsPasswordModalOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 size-8 rounded-full flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="size-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-3 shadow-inner">
            <KeyIcon size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900">{t.title || "Change Password"}</h3>
          <p className="text-xs text-gray-500 mt-1 text-center font-medium max-w-[250px]">
            {t.description || "Ensure your account is using a long, random password to stay secure."}
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t.currentPassword || "Current Password"}</label>
            <input
              type="password"
              required
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all bg-gray-50 font-medium"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t.newPassword || "New Password"}</label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all bg-gray-50 font-medium"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t.confirmPassword || "Confirm New Password"}</label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all bg-gray-50 font-medium"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-3 mt-8 pt-4">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm"
            >
              {t.actions?.cancel || "Cancel"}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors text-sm shadow-lg shadow-red-500/20"
            >
              {t.actions?.update || "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;