import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Store,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Slash,
  Eye,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { StatCard } from "@/components/ui";
import {
  createFranchise,
  deleteFranchise,
  getFranchises,
  updateFranchise,
  updateFranchiseStatus,
} from "@/services/franchiseService";
import FranchiseModal from "@/components/modal/FranchiseModal";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { useSSE } from "@/hooks/useSSE";
import { ENDPOINTS } from "@/config/api";

// Google Maps navigation component
const LocationButton = ({ address, googleMapsUrl, t }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const openGoogleMaps = () => {
    let url;
    
    if (googleMapsUrl && googleMapsUrl.trim()) {
      url = googleMapsUrl.trim();
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
    } else if (address && address.trim()) {
      const encodedAddress = encodeURIComponent(address);
      url = `https://www.google.com/maps/search/${encodedAddress}`;
    } else {
      toast.error(t.alerts?.noAddress || "No address to display on map");
      return;
    }
    
    window.open(url, "_blank", "noopener,noreferrer");
  };
  
  if (!address && !googleMapsUrl) {
    return <span className="text-gray-400 text-base">{t.table?.noAddress || "No address added"}</span>;
  }
  
  return (
    <div 
      className="flex items-center gap-1.5 cursor-pointer group"
      onClick={openGoogleMaps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <MapPin 
        size={18} 
        className={`transition-colors ${isHovered ? "text-[#d9a13b]" : "text-gray-500"}`}
      />
      <span 
        className={`text-base transition-colors line-clamp-2 ${
          isHovered 
            ? "text-[#d9a13b] underline decoration-[#d9a13b]/50 underline-offset-2" 
            : "text-gray-700"
        }`}
      >
        {address || (t.table?.viewOnMap || "View on map")}
      </span>
      <ExternalLink 
        size={16} 
        className={`transition-colors ${isHovered ? "text-[#d9a13b]" : "text-gray-400"} opacity-0 group-hover:opacity-100`}
      />
    </div>
  );
};

const FranchiseManagement = () => {
  const { language } = useLanguageStore();
  const t = useMemo(() => (translations[language] || translations.vi).admin?.franchiseManagement || {}, [language]);

  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // view, create, edit
  const [activeFranchise, setActiveFranchise] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState({});

  const [fetchError, setFetchError] = useState(null);

  const tableHeaders = useMemo(() => [
    t.table?.name || "NAME",
    t.table?.address || "ADDRESS",
    t.table?.status || "STATUS",
    t.table?.actions || "ACTIONS"
  ], [t]);

  const STATUS_MAP = useMemo(() => ({
    NEW:      { label: t.status?.new || (language === 'en' ? 'New' : language === 'jp' ? '新着' : 'Mới'),      color: "bg-amber-50 text-amber-600",  badge: "New" },
    ACTIVE:   { label: t.status?.active || (language === 'en' ? 'Active' : language === 'jp' ? 'アクティブ' : 'Đang hoạt động'), color: "bg-green-50 text-green-600",  badge: "Active" },
    INACTIVE: { label: t.status?.inactive || (language === 'en' ? 'Inactive' : language === 'jp' ? '無効' : 'Ngừng hoạt động'), color: "bg-red-50 text-red-600",   badge: "Inactive" },
    DELETED:  { label: t.status?.deleted || (language === 'en' ? 'Deleted' : language === 'jp' ? '削除済み' : 'Đã xóa'),   color: "bg-gray-100 text-gray-400", badge: "Deleted" },
  }), [t, language]);

  const STATUS_OPTIONS = useMemo(() => [
    { value: "ALL",      label: t.allStatus || (language === 'en' ? 'All' : language === 'jp' ? 'すべて' : 'Tất cả') },
    { value: "NEW",      label: t.status?.new || (language === 'en' ? 'New' : language === 'jp' ? '新着' : 'Mới') },
    { value: "ACTIVE",   label: t.status?.active || (language === 'en' ? 'Active' : language === 'jp' ? 'アクティブ' : 'Đang hoạt động') },
    { value: "INACTIVE", label: t.status?.inactive || (language === 'en' ? 'Inactive' : language === 'jp' ? '無効' : 'Ngừng hoạt động') },
  ], [t, language]);

  // Normalise data from BE — keep DELETED entries so we can filter them
  const normalizeFranchise = useCallback((item) => {
    if (!item) return null;
    return {
      id: item.id,
      name: item.name || "",
      address: item.address || "",
      googleMapsUrl: item.googleMapsUrl || "",
      phone: item.phone || "",
      email: item.email || "",
      opened: item.opened,
      closed: item.closed,
      at: item.at,
      status: item.status || "NEW",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }, []);

  // ── Realtime SSE ──
const { data: realtimeData } = useSSE(ENDPOINTS.PROTECTED.FRANCHISE.events);

useEffect(() => {
  if (realtimeData) {
    console.log("Realtime Franchise update received:", realtimeData);
    
    const { type, franchiseId, status, data: itemData } = realtimeData;
    
    // ✅ Xử lý cập nhật status
    if (type === 'FRANCHISE_STATUS_UPDATED' && franchiseId && status) {
      setFranchises(prev => {
        const newFranchises = prev.map(f => 
          f.id === franchiseId ? { ...f, status } : f
        );
        console.log('✅ Updated franchise status:', franchiseId, '->', status);
        return newFranchises;
      });
    }
    // ✅ Xử lý update full franchise data
    else if (type === 'FRANCHISE_UPDATED' && itemData) {
      const normalized = normalizeFranchise(itemData);
      setFranchises(prev => prev.map(f => f.id === normalized.id ? normalized : f));
      console.log('✅ Updated full franchise:', normalized.id);
    }
    // ✅ Xử lý tạo mới
    else if (type === 'FRANCHISE_CREATED' && itemData) {
      const normalized = normalizeFranchise(itemData);
      setFranchises(prev => {
        if (prev.some(f => f.id === normalized.id)) return prev;
        return [normalized, ...prev];
      });
      console.log('✅ Created new franchise via SSE:', normalized.id);
    }
    // ✅ Xử lý xóa (set status DELETED)
    else if (type === 'FRANCHISE_DELETED' && franchiseId) {
      setFranchises(prev => prev.map(f => 
        f.id === franchiseId ? { ...f, status: 'DELETED' } : f
      ));
      console.log('✅ Deleted franchise:', franchiseId);
    }
    // Fallback: nếu data có id trực tiếp (trường hợp khác)
    else if (realtimeData.id) {
      setFranchises(prev => {
        const normalized = normalizeFranchise(realtimeData);
        if (!normalized?.id) return prev;
        const idx = prev.findIndex(f => f.id === normalized.id);
        if (idx >= 0) {
          const newFranchises = [...prev];
          newFranchises[idx] = normalized;
          return newFranchises;
        }
        return [normalized, ...prev];
      });
    }
  }
}, [realtimeData, normalizeFranchise]);

  const fetchFranchises = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getFranchises();
      const rawList = Array.isArray(res) ? res : res?.data || [];
      const normalized = rawList.map(normalizeFranchise).filter(Boolean);
      setFranchises(normalized);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to load franchises";
      setFetchError(errorMsg);
      setFranchises([]);
      console.error("Failed to load franchises", error);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [normalizeFranchise]);

  useEffect(() => {
    fetchFranchises();
  }, [fetchFranchises]);

  // Stats — exclude DELETED from counts
  const stats = useMemo(() => {
    const visible = franchises.filter(f => f.status !== "DELETED");
    const total    = visible.length;
    const active   = visible.filter(f => f.status === "ACTIVE").length;
    const inactive = visible.filter(f => f.status === "INACTIVE").length;
    const newCount = visible.filter(f => f.status === "NEW").length;
    return { total, active, inactive, new: newCount };
  }, [franchises]);

  // Filter — never show DELETED items
  const filteredFranchises = useMemo(() => {
    let result = franchises.filter(f => f.status !== "DELETED");

    if (statusFilter !== "ALL") {
      result = result.filter(f => f.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f =>
        f.name?.toLowerCase().includes(term) ||
        f.address?.toLowerCase().includes(term) ||
        f.email?.toLowerCase().includes(term) ||
        f.phone?.includes(term)
      );
    }

    return result;
  }, [franchises, searchTerm, statusFilter]);

  const openCreateModal = () => {
    setModalMode("create");
    setActiveFranchise(null);
    setIsModalOpen(true);
  };

  const openDetailModal = (franchise) => {
    setModalMode("view");
    setActiveFranchise(franchise);
    setIsModalOpen(true);
  };

  // Create / update handler
  const handleCreateOrUpdate = async (payload) => {
    setActionLoading(true);
    try {
      const apiPayload = {
        name: payload.name?.trim(),
        address: payload.address?.trim(),
        googleMapsUrl: payload.googleMapsUrl,
        phone: payload.phone,
        email: payload.email,
        opened: payload.opened,
        at: payload.at,
        // status is always NEW on create; on edit we don't send it (handled by status toggle)
      };

      let result;
      if (modalMode === "create") {
        // Find if a franchise with this name already exists (including DELETED ones)
        const duplicate = franchises.find(f => f.name?.toLowerCase() === apiPayload.name.toLowerCase());
        
        if (duplicate) {
          toast.error(t.alerts?.duplicateName || "Franchise name already exists");
          setActionLoading(false);
          return;
        }

        result = await createFranchise(apiPayload);
        toast.success(t.alerts?.createSuccess || "Franchise created successfully");
        const newItem = normalizeFranchise(result?.data || result);
        if (newItem) {
          setFranchises(prev => {
            if (prev.some(f => f.id === newItem.id)) return prev;
            return [newItem, ...prev];
          });
        }
      } else {
        const id = activeFranchise?.id;
        // Check duplicate name for edit
        const duplicate = franchises.find(f => f.id !== id && f.name?.toLowerCase() === apiPayload.name.toLowerCase() && f.status !== "DELETED");
        if (duplicate) {
          toast.error(t.alerts?.duplicateName || "Franchise name already exists");
          setActionLoading(false);
          return;
        }

        result = await updateFranchise(id, apiPayload);
        toast.success(t.alerts?.updateSuccess || "Franchise updated successfully");
        const updatedItem = normalizeFranchise(result?.data || result);
        if (updatedItem) {
          setFranchises(prev => prev.map(f => f.id === id ? updatedItem : f));
        }
      }

      setIsModalOpen(false);
      setActiveFranchise(null);
    } catch (error) {
      const serverMessage = error?.response?.data?.message || error?.message || "Save failed";
      toast.error(serverMessage);
      console.error("Franchise create/update error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Cycle status: NEW → ACTIVE → INACTIVE → NEW (skip DELETED)
  const handleStatusChange = async (franchise, newStatus) => {
    setStatusLoading(prev => ({ ...prev, [franchise.id]: true }));
    try {
      const result = await updateFranchiseStatus(franchise.id, newStatus);
      const labelMap = {
        ACTIVE:   t.alerts?.statusActive   || "Status set to Active",
        INACTIVE: t.alerts?.statusInactive || "Status set to Inactive",
        NEW:      t.alerts?.statusNew      || "Status set to New",
      };
      toast.success(labelMap[newStatus] || "Status updated");
      const updatedItem = normalizeFranchise(result?.data || result);
      if (updatedItem) {
        setFranchises(prev => prev.map(f => f.id === franchise.id ? updatedItem : f));
      }
    } catch (error) {
      const serverMessage = error?.response?.data?.message || error?.message || "Status update failed";
      toast.error(serverMessage);
      console.error("Status update error:", error);
    } finally {
      setStatusLoading(prev => ({ ...prev, [franchise.id]: false }));
    }
  };

  // Soft-delete — only allowed when status is NOT ACTIVE
  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.status === "ACTIVE") {
      toast.error(t.alerts?.deleteActiveError || "Cannot delete an active franchise. Please deactivate it first.");
      setDeleteTarget(null);
      return;
    }
    setActionLoading(true);
    try {
      await deleteFranchise(deleteTarget.id);
      toast.success(t.alerts?.deleteSuccess || "Franchise deleted");
      // Mark as DELETED locally so it disappears from the list without a full re-fetch
      setFranchises(prev =>
        prev.map(f => f.id === deleteTarget.id ? { ...f, status: "DELETED" } : f)
      );
      setDeleteTarget(null);
    } catch (error) {
      const serverMessage = error?.response?.data?.message || error?.message || "Delete failed";
      toast.error(serverMessage);
      console.error("Delete franchise error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge
  // Status config — dot glow + pill gradient + label
  const STATUS_STYLE = {
    NEW: {
      dot:   "bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.5)]",
      badge: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 ring-1 ring-amber-200/80",
      label: t.status?.new || "New",
    },
    ACTIVE: {
      dot:   "bg-emerald-400 shadow-[0_0_7px_2px_rgba(52,211,153,0.6)] animate-pulse",
      badge: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 ring-1 ring-emerald-200/80",
      label: t.status?.active || "Active",
    },
    INACTIVE: {
      dot:   "bg-rose-400 shadow-[0_0_6px_2px_rgba(251,113,133,0.45)]",
      badge: "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 ring-1 ring-rose-200/80",
      label: t.status?.inactive || "Inactive",
    },
    DELETED: {
      dot:   "bg-gray-300",
      badge: "bg-gray-100 text-gray-400 ring-1 ring-gray-200/70",
      label: t.status?.deleted || "Deleted",
    },
  };

  // Strict one-way transitions
  const STATUS_TRANSITIONS = {
    NEW:      { nextStatus: "ACTIVE",   label: "Activate",   btnCls: "from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-300/60" },
    ACTIVE:   { nextStatus: "INACTIVE", label: "Deactivate", btnCls: "from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-rose-300/60" },
    INACTIVE: { nextStatus: "ACTIVE",   label: "Reactivate", btnCls: "from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-300/60" },
  };

  // Premium status cell with a modern Toggle Switch for Active/Inactive
  const renderStatusCell = (item) => {
    const style = STATUS_STYLE[item.status] || STATUS_STYLE.NEW;
    const isPending = statusLoading[item.id];
    const isActive  = item.status === "ACTIVE";
    const isNew     = item.status === "NEW";

    // Action button for NEW status only
    const renderNewAction = () => (
      <button
        onClick={() => handleStatusChange(item, "ACTIVE")}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg hover:-translate-y-px transition-all active:scale-95 duration-150"
      >
        {isPending && <div className="size-3 rounded-full border-[2px] border-white/30 border-t-white animate-spin" />}
        <ArrowRight size={12} strokeWidth={3.5} />
        {t.switch?.activate || "Activate"}
      </button>
    );

    // Modern Segmented Slider for ACTIVE <-> INACTIVE (No top pill)
    const renderSwitch = () => (
      <div className="relative flex items-center p-1 bg-slate-100/80 rounded-full border border-slate-200/50 w-[200px] h-[44px] overflow-hidden">
        {/* Animated Sliding Background Pill */}
        <div 
          className={`absolute h-[36px] w-[96px] rounded-full transition-all duration-300 ease-out shadow-sm ${
            isActive 
              ? "translate-x-0 bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-200" 
              : "translate-x-[100px] bg-gradient-to-r from-rose-500 to-red-500 shadow-rose-200"
          }`}
        />
        
        {/* Active Option */}
        <button
          onClick={(e) => { e.stopPropagation(); if(!isActive) handleStatusChange(item, "ACTIVE"); }}
          disabled={isPending}
          className={`relative flex-1 flex items-center justify-center gap-1.5 z-10 transition-colors duration-300 ${isActive ? "text-white" : "text-slate-400 hover:text-slate-500"}`}
        >
          {isPending && isActive && <div className="size-4 rounded-full border-[2.5px] border-white/30 border-t-white animate-spin" />}
          <span className="text-sm font-black uppercase tracking-wider">{t.switch?.active || "Active"}</span>
        </button>

        {/* Inactive Option */}
        <button
          onClick={(e) => { e.stopPropagation(); if(isActive) handleStatusChange(item, "INACTIVE"); }}
          disabled={isPending}
          className={`relative flex-1 flex items-center justify-center gap-1.5 z-10 transition-colors duration-300 ${!isActive ? "text-white" : "text-slate-400 hover:text-slate-500"}`}
        >
          {isPending && !isActive && <div className="size-4 rounded-full border-[2.5px] border-white/30 border-t-white animate-spin" />}
          <span className="text-sm font-black uppercase tracking-wider">{t.switch?.inactive || "Inactive"}</span>
        </button>
      </div>
    );

    if (item.status === "DELETED") {
      return (
        <span className={`inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-sm font-bold tracking-wide ${STATUS_STYLE.DELETED.badge}`}>
          <span className={`size-2 rounded-full shrink-0 ${STATUS_STYLE.DELETED.dot}`} />
          {STATUS_STYLE.DELETED.label}
        </span>
      );
    }

    return isNew ? (
      <div className="flex flex-col items-start gap-3">
        <span className={`inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-sm font-bold tracking-wide ${style.badge}`}>
          <span className={`size-2 rounded-full shrink-0 ${style.dot}`} />
          {style.label}
        </span>
        {renderNewAction()}
      </div>
    ) : (
      renderSwitch()
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {t.title || "Franchise Management"}
          </h2>
            <p className="text-gray-500 text-sm">
                {t.subtitle || "Monitor and manage your global coffee network"}
            </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-[#d9a13b] hover:bg-[#c48f32] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-yellow-900/10 active:scale-95"
        >
          <Plus size={18} />
          <span>{t.addFranchise || "+ Add New Franchise"}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer transition-all duration-300 rounded-2xl ${statusFilter === "ALL" ? "ring-2 ring-blue-500 ring-offset-2 scale-105 shadow-lg opacity-100" : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"}`}
        >
          <StatCard icon={Store} label={t.stats?.total || "Total Franchises"} value={stats.total} color="text-blue-600" bg="bg-blue-50" />
        </div>

        <div
          onClick={() => setStatusFilter("ACTIVE")}
          className={`cursor-pointer transition-all duration-300 rounded-2xl ${statusFilter === "ACTIVE" ? "ring-2 ring-green-500 ring-offset-2 scale-105 shadow-lg opacity-100" : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"}`}
        >
          <StatCard icon={CheckCircle} label={t.stats?.active || "Active"} value={stats.active} color="text-green-600" bg="bg-green-50" />
        </div>

        <div
          onClick={() => setStatusFilter("INACTIVE")}
          className={`cursor-pointer transition-all duration-300 rounded-2xl ${statusFilter === "INACTIVE" ? "ring-2 ring-red-500 ring-offset-2 scale-105 shadow-lg opacity-100" : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"}`}
        >
          <StatCard icon={Slash} label={t.stats?.inactive || "Inactive"} value={stats.inactive} color="text-red-600" bg="bg-red-50" />
        </div>

        <div
          onClick={() => setStatusFilter("NEW")}
          className={`cursor-pointer transition-all duration-300 rounded-2xl ${statusFilter === "NEW" ? "ring-2 ring-amber-500 ring-offset-2 scale-105 shadow-lg opacity-100" : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"}`}
        >
          <StatCard icon={RefreshCw} label={t.status?.new || "New"} value={stats.new} color="text-amber-600" bg="bg-amber-50" />
        </div>
      </div>

        {/* Filters & Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-5 border-b border-gray-50 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t.searchPlaceholder || "Search by franchise name..."}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a13b]/20 focus:border-[#d9a13b] transition-all uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                className="pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 focus:outline-none appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchFranchises}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                {tableHeaders.map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-4 w-28 rounded-full bg-gray-200 animate-pulse" />
                      <p className="font-medium italic">{t.table?.loading || "Loading franchises..."}</p>
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <AlertCircle size={48} className="text-amber-500" />
                      <p className="font-medium text-gray-700">{t.table?.loadFailed || "Failed to load franchises"}</p>
                      <p className="text-sm text-gray-500 max-w-md">{fetchError}</p>
                      <button
                        onClick={fetchFranchises}
                        className="inline-flex items-center gap-2 bg-[#d9a13b] hover:bg-[#c48f32] text-white px-5 py-2.5 rounded-xl font-bold transition-all"
                      >
                        <RefreshCw size={18} />
                        {t.table?.retry || "Retry"}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredFranchises.length > 0 ? (
                filteredFranchises.map(item => (
                  <tr key={item.id} className="group hover:bg-gray-50/80 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#d9a13b]/10 group-hover:text-[#d9a13b] transition-colors">
                          <Store size={24} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-lg">{item.name}</div>
                          {item.phone && (
                            <div className="text-sm text-gray-400 mt-1">{item.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="px-6 py-5">
                      <LocationButton address={item.address} googleMapsUrl={item.googleMapsUrl} t={t} />
                    </td>

                    {/* Status + action button */}
                    <td className="px-6 py-5">
                      {renderStatusCell(item)}
                    </td>

                    {/* Actions — View + Delete (no Edit) */}
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openDetailModal(item)}
                          className="inline-flex items-center gap-1.5 px-5 py-3 text-gray-600 hover:text-[#d9a13b] hover:bg-amber-50 rounded-xl border border-gray-200 hover:border-[#d9a13b]/30 text-base font-bold transition-all"
                          title={t.table?.view || "View details"}
                        >
                          <Eye size={18} />
                          <span>{t.table?.view || "View"}</span>
                        </button>
                        <button
                          onClick={() => {
                            if (item.status === "ACTIVE") {
                              toast.error(t.alerts?.deleteActiveError || "Cannot delete an active franchise. Please deactivate it first.");
                              return;
                            }
                            setDeleteTarget(item);
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                            item.status === "ACTIVE"
                              ? "text-gray-300 border-gray-100 cursor-not-allowed"
                              : "text-red-400 border-red-100 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                          }`}
                          title={item.status === "ACTIVE" ? (t.alerts?.deleteActiveError || "Cannot delete active franchise") : (t.table?.delete || "Delete")}
                        >
                          <Trash2 size={14} />
                          <span>{t.table?.delete || "Delete"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Search size={40} className="text-gray-300" />
                      <p className="font-medium text-gray-500">
                        {franchises.filter(f => f.status !== "DELETED").length === 0
                          ? (t.table?.noData || "No franchises yet. Create the first one to start.")
                          : (t.table?.noMatch || "No franchises found matching your search criteria")}
                      </p>
                      {franchises.filter(f => f.status !== "DELETED").length === 0 && !fetchError && (
                        <button
                          onClick={openCreateModal}
                          className="inline-flex items-center gap-2 bg-[#d9a13b] hover:bg-[#c48f32] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-yellow-900/10 active:scale-95"
                        >
                          <Plus size={18} />
                          {t.addFranchise || "+ Add New Franchise"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Franchise Modal (View / Create / Edit) */}
      <FranchiseModal
        key={activeFranchise?.id || modalMode}
        isOpen={isModalOpen}
        mode={modalMode}
        initialData={activeFranchise}
        allFranchises={franchises}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        loading={actionLoading}
        onEdit={(f) => {
          setModalMode("edit");
          setActiveFranchise(f);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={t.alerts?.deleteConfirmTitle || "Delete franchise"}
        message={(t.alerts?.deleteConfirmMessage || "Are you sure you want to delete franchise \"{name}\"? This action cannot be undone.").replace("{name}", deleteTarget?.name || "")}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  );
};

export default FranchiseManagement;