// src/components/modal/ConfirmModal.jsx
import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "danger", // 'danger' (Xoá - Đỏ) | 'warning' (Cập nhật - Vàng)
  loading = false
}) => {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).modals?.confirm || {};

  if (!isOpen) return null;

  const isDanger = type === "danger";

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 text-center space-y-4 mt-4">
          <div className={`size-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
            {isDanger ? <AlertTriangle size={32} strokeWidth={2.5} /> : <Info size={32} strokeWidth={2.5} />}
          </div>
          <h3 className="font-black text-xl text-slate-900">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>

        <div className="p-5 bg-gray-50 flex gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {t.actions?.cancel || "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#d9a13b] hover:bg-[#c49033]'
              }`}
          >
            {loading && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            { (isDanger ? (t.actions?.delete || "Delete") : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
