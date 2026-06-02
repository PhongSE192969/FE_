import { Edit2, Lock, Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import PermissionFormModal from "./PermissionFormModal";
import ConfirmModal from "./ConfirmModal";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const ManagePermissionModal = ({
  permissions,
  setIsPermModalOpen,
  onCreatePerm,
  onUpdatePerm,
  onDeletePerm,
}) => {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).modals?.managePermission || {};

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPerm, setSelectedPerm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permToDelete, setPermToDelete] = useState(null);

  const handleOpenCreate = () => {
    setSelectedPerm(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (perm) => {
    setSelectedPerm(perm);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData, isEditMode) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        await onUpdatePerm(selectedPerm.id, formData);
      } else {
        await onCreatePerm(formData);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error("Failed to submit permission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleDelete = async (perm) => {
  //   if (
  //     window.confirm(
  //       `Are you sure you want to delete permission "${perm.api}"?`,
  //     )
  //   ) {
  //     await onDeletePerm(perm.id);
  //   }
  // };

  const handleDeleteClick = (perm) => {
    setPermToDelete(perm);
  };

  const executeDelete = async () => {
    if (!permToDelete) return;
    await onDeletePerm(permToDelete.id);
    setPermToDelete(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-900">
                  {t.title || "System Permissions"}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {t.subtitle || "Functional Access Points"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPermModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body List */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs font-bold text-slate-500">
                {t.topBar?.countBefore || ""}{permissions.length}{t.topBar?.countAfter || " Permissions defined"}
              </div>
              <button
                onClick={handleOpenCreate}
                className="text-xs font-black text-[#d9a13b] flex items-center gap-1 hover:underline transition-all active:scale-95"
              >
                <Plus size={14} /> {t.topBar?.add || "Add New Permission"}
              </button>
            </div>

            {permissions.length === 0 && (
              <div className="text-center py-6 text-sm text-gray-400">
                {t.empty || "No permissions found. Click add to create one."}
              </div>
            )}

            {permissions.map((perm, index) => (
              <div
                key={perm.id || index}
                className="p-3 border border-gray-100 rounded-xl flex items-center justify-between group hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                    <Lock size={14} />
                  </div>

                  <div>
                    <div className="text-sm font-black text-slate-900 max-w-[250px] truncate uppercase">
                      {perm.name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      <span className="font-bold text-blue-600 mr-2">
                        {perm.httpMethod}
                      </span>
                      <span>{perm.api}</span>
                    </div>
                    {perm.description && (
                      <div className="text-[10px] text-gray-400 italic">
                        {perm.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleOpenEdit(perm)}
                    className="p-2 text-gray-400 hover:text-slate-900 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(perm)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 flex justify-end border-t border-gray-100">
            <button
              onClick={() => setIsPermModalOpen(false)}
              className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-bold shadow-lg transition-colors"
            >
              {t.actions?.close || "Close"}
            </button>
          </div>
        </div>
      </div>

      {/* Nested Modal for Create/Update */}
      <PermissionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedPerm}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />

      {/* POP-UP CONFIRM Delete */}
      <ConfirmModal
        isOpen={!!permToDelete}
        onClose={() => setPermToDelete(null)}
        onConfirm={executeDelete}
        title={t.confirmDelete?.title || "Delete Permission?"}
        message={
          <>
            {t.confirmDelete?.message?.before || "Are you sure you want to delete the permission "}
            <strong className="text-slate-900">{permToDelete?.api}</strong>
            {t.confirmDelete?.message?.after || "? This action cannot be undone."}
          </>
        }
      />
    </>
  );
};

export default ManagePermissionModal;
