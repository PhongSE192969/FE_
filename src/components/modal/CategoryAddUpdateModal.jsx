import { Tag, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

import {
  createCategory,
  updateCategory,
  getAllCategories
} from "@/services/categoryService";

const CategoryAddUpdateModal = ({
  selectedCategory = null,
  setIsModalOpen = () => {},
  refreshCategories = () => {}
}) => {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).modals?.categoryAddUpdate || {};

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(false);

  /**
   * Load data when editing
   */
  useEffect(() => {

    if (selectedCategory) {

      setName(selectedCategory.name || "");
      setSlug(selectedCategory.slug || "");
      setDescription(selectedCategory.description || "");
      setStatus(
        selectedCategory.status === "ACTIVE"
          ? "Active"
          : "Inactive"
      );

    } else {

      setName("");
      setSlug("");
      setDescription("");
      setStatus("Active");

    }

  }, [selectedCategory]);

  /**
   * Auto generate slug
   */
  useEffect(() => {

    if (!selectedCategory && name) {

      const generated = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");

      setSlug(generated);

    }

  }, [name]);

  /**
   * Save Category
   */
  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName) {
      alert(t.alerts?.required || "Category name is required");
      return;
    }

    try {
      setLoading(true);

      // ✅ lấy toàn bộ category để kiểm tra trùng
      const categoryList = await getAllCategories();
      const categories = Array.isArray(categoryList) ? categoryList : [];

      const normalizedName = trimmedName.toLowerCase();
      const normalizedSlug = trimmedSlug.toLowerCase();

      const existedCategory = categories.find((c) => {
        const sameName = (c.name || "").trim().toLowerCase() === normalizedName;
        const sameSlug = (c.slug || "").trim().toLowerCase() === normalizedSlug;

        // update thì bỏ qua chính nó
        if (selectedCategory && c.id === selectedCategory.id) return false;

        return sameName || sameSlug;
      });

      if (existedCategory) {
        alert("Danh mục đã tồn tại. Vui lòng nhập tên hoặc slug khác.");
        return;
      }

      const payload = {
        name: trimmedName,
        description: description.trim() || ""
      };

      if (selectedCategory) {
        payload.status = status.toUpperCase();
      }

      if (selectedCategory) {
        await updateCategory(selectedCategory.id, payload);
        alert(t.alerts?.updated || "Category updated successfully");
      } else {
        await createCategory(payload);
        alert(t.alerts?.created || "Category created successfully");
      }

      await refreshCategories();
      setIsModalOpen(false);

    } catch (error) {
      console.error("Save category error:", error);
      alert(error.response?.data?.message || t.alerts?.failed || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">

      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}

        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">

          <div className="flex items-center gap-3">

            <div className="size-10 rounded-xl bg-[#d9a13b]/10 text-[#d9a13b] flex items-center justify-center">
              <Tag size={20} />
            </div>

            <div>

              <h3 className="font-black text-slate-900 text-lg">
                {selectedCategory ? (t.title?.edit || "Edit Category") : (t.title?.new || "New Category")}
              </h3>

              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                {t.subtitle || "Catalog Management"}
              </p>

            </div>

          </div>

          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>

        </div>

        {/* Form */}

        <div className="p-6 space-y-5">

          {/* Name */}

          <div className="space-y-1.5">

            <label className="text-xs font-black text-gray-400 uppercase">
              {t.form?.name || "Category Name"}
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.form?.slugPlaceholder || "ao-thun"}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b]"
            />

          </div>

          {/* Slug */}

          <div className="space-y-1.5">

            <label className="text-xs font-black text-gray-400 uppercase">
              {t.form?.slug || "URL Slug"}
            </label>

            <div className="flex">

              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-400 text-xs font-mono">
                /
              </span>

              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={t.form?.slugPlaceholder || "ao-thun"}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-r-xl text-sm focus:outline-none focus:border-[#d9a13b]"
              />

            </div>

          </div>

          {/* Description */}

          <div className="space-y-1.5">

            <label className="text-xs font-black text-gray-400 uppercase">
              {t.form?.description || "Description"}
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.form?.descriptionPlaceholder || "Describe what kind of products go into this category..."}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b] h-24 resize-none"
            />

          </div>

          {/* Status */}

          <div className="space-y-1.5">

            <label className="text-xs font-black text-gray-400 uppercase">
              {t.form?.status || "Display Status"}
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
                      : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {statusItem === "Active" ? (t.form?.statusActive || "Active") : (t.form?.statusInactive || "Inactive")}
                </button>

              ))}

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="p-6 bg-gray-50 flex gap-3 border-t border-gray-100">

          <button
            onClick={() => setIsModalOpen(false)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-white transition-colors"
          >
            {t.actions?.cancel || "Cancel"}
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] px-4 py-2.5 bg-[#d9a13b] hover:bg-[#c48f32] text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
          >
            {loading
              ? (t.actions?.saving || "Saving...")
              : selectedCategory
              ? (t.actions?.update || "Update Category")
              : (t.actions?.create || "Create Category")}
          </button>

        </div>

      </div>

    </div>
  );
};

export default CategoryAddUpdateModal;