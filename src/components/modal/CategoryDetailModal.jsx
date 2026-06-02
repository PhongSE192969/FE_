import { Info, Tag, X } from "lucide-react";
import React from "react";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const makeSlug = (name = "") => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

const CategoryDetailModal = ({
  viewDetailCategory,
  setViewDetailCategory,
}) => {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).modals?.categoryDetail || {};

  if (!viewDetailCategory) return null;

  const slug =
    viewDetailCategory.slug || makeSlug(viewDetailCategory.name || "");

  const productCount =
    viewDetailCategory.productCount ??
    viewDetailCategory.itemCount ??
    0;

  const status = viewDetailCategory.status || "INACTIVE";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="size-14 bg-[#d9a13b]/10 rounded-2xl flex items-center justify-center text-[#d9a13b]">
              <Tag size={28} />
            </div>

            <button
              onClick={() => setViewDetailCategory(null)}
              className="size-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900">
              {viewDetailCategory.name || "N/A"}
            </h3>
            <p className="text-sm text-[#d9a13b] font-bold">/{slug}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-gray-400 uppercase tracking-tighter text-xs">
                {t.itemsLabel || "Tổng sản phẩm"}
              </span>
              <span className="font-black text-slate-900">
                {productCount} {t.itemsSuffix || "sản phẩm"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-gray-400 uppercase tracking-tighter text-xs">
                {t.statusLabel || "Trạng thái"}
              </span>
              <span
                className={`font-black ${
                  status === "ACTIVE" ? "text-green-600" : "text-red-500"
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Info size={14} /> {t.notesLabel || "Ghi chú danh mục"}
            </h4>

            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl italic">
              "{viewDetailCategory.description || "No description"}"
            </p>
          </div>

          <button
            onClick={() => setViewDetailCategory(null)}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            {t.close || "Đóng cửa sổ"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;