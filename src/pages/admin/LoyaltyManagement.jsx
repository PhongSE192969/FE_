import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { apiCall } from "@/config/api";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import ConfirmModal from "@/components/modal/ConfirmModal";

const API_BASE_URL = "http://localhost:3000/api/loyalty";

export default function LoyaltyManagement() {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).admin?.loyaltyManagement || {};

  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [formModal, setFormModal] = useState({
    isOpen: false,
    mode: "add",
    data: null,
  });
  const [viewModal, setViewModal] = useState({ isOpen: false, data: null });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    tierName: null,
    isDeleting: false,
  });

  // Internal Form State for Add/Edit (Removed benefits)
  const [formData, setFormData] = useState({
    tierName: "",
    requiredPoints: 0,
  });

  useEffect(() => {
    fetchTiers();
  }, []);

  // --- API CALLS ---
  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await apiCall("GET", "/loyalty/tiers");

      if (res.statusCode === 200) {
        const sortedTiers = res.data.sort(
          (a, b) => a.requiredPoints - b.requiredPoints,
        );
        setTiers(sortedTiers);
      } else {
        toast.error(res.message || "Failed to load tiers");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const requestDeleteTier = (tierName) => {
    setDeleteModal({ isOpen: true, tierName, isDeleting: false });
  };

  const confirmDeleteTier = async () => {
    const { tierName } = deleteModal;
    if (!tierName) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await apiCall("DELETE", `/loyalty/tiers/${tierName}`);

      if (res.statusCode === 200) {
        toast.success(t.alerts?.deleteSuccess || "Tier deleted successfully");
        fetchTiers();
        setDeleteModal({ isOpen: false, tierName: null, isDeleting: false });
      } else {
        toast.error(res.message || "Failed to delete tier");
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    const newPoints = Number(formData.requiredPoints);

    if (!formData.tierName || newPoints < 0) {
      toast.error(
        t.alerts?.fillAll ||
          "Please fill in all required fields with valid data.",
      );
      return;
    }

    const sortedTiers = [...tiers].sort(
      (a, b) => a.requiredPoints - b.requiredPoints,
    );

    if (formModal.mode === "edit") {
      const currentIndex = sortedTiers.findIndex(
        (t) => t.tierName === formData.tierName,
      );

      if (currentIndex !== -1) {
        if (currentIndex > 0) {
          const lowerTier = sortedTiers[currentIndex - 1];
          if (newPoints <= lowerTier.requiredPoints) {
            toast.error(t.alerts?.pointsHigher || `Invalid points.`);
            return;
          }
        }

        if (currentIndex < sortedTiers.length - 1) {
          const higherTier = sortedTiers[currentIndex + 1];
          if (newPoints >= higherTier.requiredPoints) {
            toast.error(t.alerts?.pointsLower || `Invalid points.`);
            return;
          }
        }
      }
    } else if (formModal.mode === "add") {
      const isDuplicatePoints = tiers.some(
        (t) => t.requiredPoints === newPoints,
      );
      if (isDuplicatePoints) {
        toast.error(t.alerts?.duplicatePoints || `Conflict points.`);
        return;
      }
    }

    const payload = {
      tierName: formData.tierName.toUpperCase(),
      requiredPoints: newPoints,
    };

    try {
      const res = await apiCall("POST", "/loyalty/tiers", payload);

      if (res.statusCode === 200) {
        toast.success(
          t.alerts?.saveSuccess || "Tier configuration saved successfully",
        );
        closeFormModal();
        fetchTiers();
      } else {
        toast.error(
          res.message || t.alerts?.saveFailed || "Failed to save configuration",
        );
      }
    } catch (error) {
      toast.error(t.alerts?.saveError || "An error occurred while saving");
    }
  };

  // --- MODAL HANDLERS ---
  const openAddModal = () => {
    setFormData({ tierName: "", requiredPoints: 0 });
    setFormModal({ isOpen: true, mode: "add", data: null });
  };

  const openEditModal = (tier) => {
    setFormData({
      tierName: tier.tierName,
      requiredPoints: tier.requiredPoints,
    });
    setFormModal({ isOpen: true, mode: "edit", data: tier });
  };

  const closeFormModal = () =>
    setFormModal({ isOpen: false, mode: "add", data: null });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t.title || "Tier Management"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t.subtitle || "Automatic point system: 10,000 VND = 1 point"}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> {t.addTier || "Add New Tier"}
        </button>
      </div>

      {/* TIER LIST TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="p-4 font-semibold">
                {t.table?.name || "Tier Name"}
              </th>
              <th className="p-4 font-semibold">
                {t.table?.points || "Required Points"}
              </th>
              <th className="p-4 font-semibold text-right">
                {t.table?.actions || "Actions"}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center p-8 text-gray-500">
                  {t.table?.loading || "Loading data..."}
                </td>
              </tr>
            ) : tiers.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center p-8 text-gray-500">
                  {t.table?.noData || "No tier data available."}
                </td>
              </tr>
            ) : (
              tiers.map((tier) => (
                <tr
                  key={tier.tierName}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="p-4 font-bold text-gray-800">
                    {tier.tierName}
                  </td>
                  <td className="p-4 text-blue-600 font-semibold">
                    {tier.requiredPoints.toLocaleString()} pts
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          setViewModal({ isOpen: true, data: tier })
                        }
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t.table?.view || "View Details"}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(tier)}
                        className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title={t.table?.edit || "Edit Tier"}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => requestDeleteTier(tier.tierName)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t.table?.delete || "Delete Tier"}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL ADD/EDIT TIER */}
      {formModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {formModal.mode === "add"
                  ? t.modals?.addTitle || "Add New Tier"
                  : t.modals?.editTitle?.replace(
                      "{name}",
                      formModal.data?.tierName,
                    ) || `Edit Tier: ${formModal.data?.tierName}`}
              </h2>
              <button
                onClick={closeFormModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t.modals?.nameLabel || "Tier Name (e.g., SILVER, GOLD)"}
                </label>
                <input
                  type="text"
                  value={formData.tierName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tierName: e.target.value.toUpperCase(),
                    })
                  }
                  disabled={formModal.mode === "edit"}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t.modals?.pointsLabel || "Required Points (Threshold)"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.requiredPoints}
                  onChange={(e) =>
                    setFormData({ ...formData, requiredPoints: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {t.modals?.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {formModal.mode === "add"
                    ? t.modals?.create || "Create"
                    : t.modals?.save || "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VIEW DETAILS */}
      {viewModal.isOpen && viewModal.data && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 relative">
              <button
                onClick={() => setViewModal({ isOpen: false, data: null })}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
              <h3 className="text-3xl font-black text-white mb-2">
                {viewModal.data.tierName}
              </h3>

              <div className="space-y-1">
                <p className="text-white/80 font-medium flex items-center gap-2">
                  <span className="w-24 text-gray-400 text-sm">
                    {t.modals?.points || "Points:"}
                  </span>
                  {viewModal.data.requiredPoints.toLocaleString()} pts
                </p>
                <p className="text-amber-400 font-bold flex items-center gap-2">
                  <span className="w-24 text-gray-400 font-medium text-sm flex items-center gap-1">
                    {t.modals?.spendLabel || "Spend:"}
                  </span>
                  {(viewModal.data.requiredPoints * 10000).toLocaleString(
                    "vi-VN",
                  )}{" "}
                  VND
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() =>
            setDeleteModal({ isOpen: false, tierName: null, isDeleting: false })
          }
          onConfirm={confirmDeleteTier}
          title="Delete Tier Confirmation"
          message={`Are you sure you want to delete the "${deleteModal.tierName}" tier? This action cannot be undone.`}
          loading={deleteModal.isDeleting}
        />
      )}
    </div>
  );
}
