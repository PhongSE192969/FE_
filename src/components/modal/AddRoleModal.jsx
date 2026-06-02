import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useLanguageStore } from "@/stores"
import { translations } from "@/locales"

const AddRoleModal = ({
  role = null,
  setIsRoleModalOpen,
  onSave
}) => {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).modals?.addRole || {};
  const isEditMode = Boolean(role);

  const [formData, setFormData] = useState({
    name: role?.name || "",
    description: role?.description || ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900">
            {isEditMode ? (t.editTitle || "Edit Role") : (t.title || "Define New Role")}
          </h3>
          <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase">{t.form?.name || "Role Name"}</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t.form?.namePlaceholder || "e.g. Inventory Specialist"} 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b]" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase">{t.form?.description || "Description"}</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t.form?.descriptionPlaceholder || "Briefly describe what this role can do"} 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b] h-24 resize-none" 
              />
            </div>
          </div>
          <div className="p-6 bg-gray-50 flex gap-3">
            <button type="button" onClick={() => setIsRoleModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600">{t.actions?.cancel || "Cancel"}</button>
            <button type="submit" className="flex-[2] px-4 py-2.5 bg-[#d9a13b] text-white rounded-xl text-sm font-bold shadow-md">
              {isEditMode ? (t.actions?.save || "Save Changes") : (t.actions?.initialize || "Initialize Role")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddRoleModal