import React, { useState, useEffect } from "react";
import { X, Lock, Hash, Layers, Tag, Briefcase } from "lucide-react";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const PermissionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}) => {
  const language = useLanguageStore((state) => state.language);
  const currentTranslations = (translations[language] || translations.vi);
  const t = currentTranslations.modals?.permissionForm || {};
  
  const isEditMode = Boolean(initialData);

  // Khởi tạo state rỗng ban đầu
  const [formData, setFormData] = useState({
    name: "",
    api: "",
    httpMethod: "GET",
    description: "",
  });

  // Sử dụng useEffect để đồng bộ data vào form mỗi khi modal mở hoặc data thay đổi
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || "",
        api: initialData?.api || "",
        httpMethod: initialData?.httpMethod || "GET",
        description: initialData?.description || "",
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, isEditMode);
  };

  return (
    <div key={language} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 h-fit max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#d9a13b]/10 text-[#d9a13b] flex items-center justify-center">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900">
                {isEditMode ? (t.title?.edit || "Edit Permission") : (t.title?.create || "Create Permission")}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {isEditMode ? "Update existing access point" : "Define new system access point"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form
          id="permission-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto"
        >
          {/* Permission Name */}
          <div>
            <label className="flex text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 items-center gap-1.5">
              <Tag size={12} /> {t.form?.name || "Permission Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t.form?.namePlaceholder || "e.g. AUTH_MANAGE_USERS"}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b] transition-colors font-bold uppercase"
            />
          </div>

          {/* API Endpoint & Method */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="flex text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 items-center gap-1.5">
                <Hash size={12} /> {t.form?.api || "API Endpoint"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="api"
                value={formData.api}
                onChange={handleChange}
                placeholder={t.form?.apiPlaceholder || "e.g. /api/auth/users/**"}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b] transition-colors font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="flex text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 items-center gap-1.5">
                <Layers size={12} /> {t.form?.method || "Method"}
              </label>
              <select
                name="httpMethod"
                value={formData.httpMethod}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b] transition-colors font-bold"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="ANY">ANY</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 items-center gap-1.5">
              <Briefcase size={12} /> {t.form?.description || "Description"}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t.form?.descriptionPlaceholder || "Describe what this permission allows"}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b] transition-colors h-24 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {t.actions?.cancel || "Cancel"}
          </button>
          <button
            type="submit"
            form="permission-form"
            className="flex-[2] px-4 py-2.5 bg-[#d9a13b] hover:bg-[#c48f32] text-white rounded-xl text-sm font-bold shadow-lg shadow-yellow-900/10 transition-all active:scale-95"
          >
            {isEditMode ? (t.actions?.save || "Save Changes") : (t.actions?.create || "Create Permission")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionFormModal;