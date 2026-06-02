import { Layers, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

import {
  createCategory,
  updateCategory,
} from "@/services/categoryService";

const generateSlug = (value = "") => {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

const CategoryCRUDModal = ({
  selectedCategory = null,
  setIsModalOpen = () => {},
  refreshCategories = () => {},
}) => {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).modals?.categoryAddUpdate || {};

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      setName(selectedCategory.name || "");
      setSlug(selectedCategory.slug || generateSlug(selectedCategory.name || ""));
      setDescription(selectedCategory.description || "");
      setStatus(selectedCategory.status === "ACTIVE" ? "Active" : "Inactive");
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setStatus("Active");
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategory) {
      setSlug(generateSlug(name));
    }
  }, [name, selectedCategory]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      alert(t.alerts?.required || "Category name is required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: trimmedName,
        description: trimmedDescription || "",
      };

      // Backend create không cần status, update mới gửi status
      if (selectedCategory) {
        payload.status = status.toUpperCase();
      }

      if (selectedCategory) {
        await updateCategory(selectedCategory.id, payload);
        alert(t.alerts?.updated || "Cập nhật danh mục thành công");
      } else {
        await createCategory(payload);
        alert(t.alerts?.created || "Tạo danh mục thành công");
      }

      try {
        await refreshCategories();
      } catch (refreshError) {
        console.warn("Refresh categories failed after save:", refreshError);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Save category error:", error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          t.alerts?.failed ||
          "Lưu danh mục thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#d9a13b]/10 text-[#d9a13b] flex items-center justify-center">
              <Layers size={20} />
            </div>

            <h3 className="font-black text-slate-900">
              {selectedCategory
                ? t.title?.edit || "Cập nhật danh mục"
                : t.title?.new || "Thêm danh mục mới"}
            </h3>
          </div>

          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {t.form?.name || "Tên danh mục"}
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.form?.namePlaceholder || "e.g. Phân bón lá"}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {t.form?.slug || "Slug hiển thị"}
            </label>

            <div className="flex">
              <span className="px-3 flex items-center bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-400 text-sm">
                /
              </span>

              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                placeholder={t.form?.slugPlaceholder || "phan-bon-la"}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-r-xl text-sm focus:outline-none focus:border-[#d9a13b]"
              />
            </div>

            <p className="text-[11px] text-gray-400">
              Slug chỉ dùng hiển thị ở frontend, backend hiện tại không lưu slug.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {t.form?.description || "Mô tả danh mục"}
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                t.form?.descriptionPlaceholder ||
                "Thông tin tóm tắt về nhóm sản phẩm này..."
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b] h-24 resize-none"
            />
          </div>

          {selectedCategory && (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                {t.form?.status || "Trạng thái"}
              </label>

              <div className="flex gap-3">
                {["Active", "Inactive"].map((statusItem) => (
                  <button
                    key={statusItem}
                    type="button"
                    onClick={() => setStatus(statusItem)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      status === statusItem
                        ? "bg-[#d9a13b]/10 border-[#d9a13b] text-[#d9a13b]"
                        : "bg-white border-gray-200 text-gray-400"
                    }`}
                  >
                    {statusItem === "Active"
                      ? t.form?.statusActive || "Active"
                      : t.form?.statusInactive || "Inactive"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 flex gap-3 border-t border-gray-100">
          <button
            onClick={() => setIsModalOpen(false)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-white"
          >
            {t.actions?.cancel || "Hủy bỏ"}
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] px-4 py-2.5 bg-[#d9a13b] text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
          >
            {loading
              ? t.actions?.saving || "Đang lưu..."
              : selectedCategory
                ? t.actions?.update || "Cập nhật danh mục"
                : t.actions?.create || "Lưu danh mục"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCRUDModal;