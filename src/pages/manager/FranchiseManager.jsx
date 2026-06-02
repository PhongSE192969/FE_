import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapPin,
  Search,
  Filter,
  Store,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Slash,
  Eye,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { StatCard } from "@/components/ui";
import { getFranchises } from "@/services/franchiseService";
import FranchiseModal from "@/components/modal/FranchiseModal";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { useSSE } from '@/hooks/useSSE'
import { ENDPOINTS } from '@/config/api'

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

const FranchiseManager = () => {
  const { language } = useLanguageStore();
  const t = useMemo(() => (translations[language] || translations.vi).manager?.franchiseManager || (translations[language] || translations.vi).admin?.franchiseManagement || {}, [language]);

  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFranchise, setActiveFranchise] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const tableHeaders = useMemo(() => [
    t.table?.name || "TÊN",
    t.table?.address || "ĐỊA CHỈ",
    t.table?.status || "TRẠNG THÁI",
    t.table?.actions || "HÀNH ĐỘNG"
  ], [t]);

  const STATUS_OPTIONS = useMemo(() => [
    { value: "ALL", label: t.allStatus || (language === 'en' ? 'All' : language === 'jp' ? 'すべて' : 'Tất cả') },
    { value: "NEW", label: t.status?.new || (language === 'en' ? 'New' : language === 'jp' ? '新着' : 'Mới') },
    { value: "ACTIVE", label: t.status?.active || (language === 'en' ? 'Active' : language === 'jp' ? 'アクティブ' : 'Đang hoạt động') },
    { value: "INACTIVE", label: t.status?.inactive || (language === 'en' ? 'Inactive' : language === 'jp' ? '無効' : 'Ngừng hoạt động') },
  ], [t, language]);

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
  const { data: realtimeData, isConnected } = useSSE(ENDPOINTS.PROTECTED.FRANCHISE.events);

  console.log('🔍 FranchiseManager - SSE status:', { isConnected, realtimeData });

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
          console.log('Updated franchise status:', franchiseId, '->', status);
          return newFranchises;
        });
      }
      // ✅ Xử lý update full franchise data
      else if (type === 'FRANCHISE_UPDATED' && itemData) {
        const normalized = normalizeFranchise(itemData);
        setFranchises(prev => prev.map(f => f.id === normalized.id ? normalized : f));
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
      }
      // Fallback: nếu data có id trực tiếp (trường hợp khác)
      else if (realtimeData.id) {
        const normalized = normalizeFranchise(realtimeData);
        if (!normalized?.id) return;
        setFranchises(prev => {
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

  const STATUS_MAP = {
    NEW: { label: t.status?.new || (language === 'en' ? 'New' : language === 'jp' ? '新着' : 'Mới'), color: "bg-blue-50 text-blue-600", badge: "New" },
    ACTIVE: { label: t.status?.active || (language === 'en' ? 'Active' : language === 'jp' ? 'アクティブ' : 'Đang hoạt động'), color: "bg-green-50 text-green-600", badge: "Active" },
    INACTIVE: { label: t.status?.inactive || (language === 'en' ? 'Inactive' : language === 'jp' ? '無効' : 'Ngừng hoạt động'), color: "bg-red-50 text-red-600", badge: "Inactive" },
  };

  const fetchFranchises = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getFranchises();
      const rawList = Array.isArray(res) ? res : res?.data || [];
      const normalized = rawList.map(normalizeFranchise).filter(Boolean);
      setFranchises(normalized);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || "Không thể tải danh sách franchise";
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

  const stats = useMemo(() => {
    const visible = franchises.filter((f) => f.status !== "DELETED");
    const total   = visible.length;
    const active  = visible.filter((f) => f.status === "ACTIVE").length;
    const inactive = visible.filter((f) => f.status === "INACTIVE").length;
    const newCount = visible.filter((f) => f.status === "NEW").length;
    return { total, active, inactive, new: newCount };
  }, [franchises]);

  const filteredFranchises = useMemo(() => {
    // Manager cannot see DELETED franchises
    let result = franchises.filter((f) => f.status !== "DELETED");
    
    if (statusFilter !== "ALL") {
      result = result.filter(f => f.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((f) =>
        f.name?.toLowerCase().includes(term) ||
        f.address?.toLowerCase().includes(term) ||
        f.email?.toLowerCase().includes(term) ||
        f.phone?.includes(term)
      );
    }
    
    return result;
  }, [franchises, searchTerm, statusFilter]);

  const openDetailModal = (franchise) => {
    setActiveFranchise(franchise);
    setIsModalOpen(true);
  };

  // Read-only status badge for manager (no interactive switching)
  const STATUS_STYLE = {
    NEW: {
      dot:   "bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.5)]",
      badge: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 ring-1 ring-amber-200/80",
      label: () => t.status?.new || "New",
    },
    ACTIVE: {
      dot:   "bg-emerald-400 shadow-[0_0_7px_2px_rgba(52,211,153,0.6)] animate-pulse",
      badge: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 ring-1 ring-emerald-200/80",
      label: () => t.status?.active || "Active",
    },
    INACTIVE: {
      dot:   "bg-rose-400 shadow-[0_0_6px_2px_rgba(251,113,133,0.45)]",
      badge: "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 ring-1 ring-rose-200/80",
      label: () => t.status?.inactive || "Inactive",
    },
  };

  const renderStatusCell = (item) => {
    const style = STATUS_STYLE[item.status] || STATUS_STYLE.NEW;
    return (
      <span className={`inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-sm font-bold tracking-wide ${style.badge}`}>
        <span className={`size-2 rounded-full shrink-0 ${style.dot}`} />
        {style.label()}
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {t.title || "Quản lý Giải pháp Nhượng quyền"}
          </h2>
          <p className="text-gray-500 text-sm">
            {t.subtitle || "Giám sát và quản lý mạng lưới thời trang nhượng quyền của bạn"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div 
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer transition-all duration-300 rounded-2xl ${statusFilter === "ALL" ? "ring-2 ring-blue-500 ring-offset-2 scale-105 shadow-lg opacity-100" : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"}`}
        >
          <StatCard
            icon={Store}
            label={t.stats?.total || "Tổng Franchise"}
            value={stats.total}
            color="text-blue-600"
            bg="bg-blue-50"
          />
        </div>
        
        <div 
          onClick={() => setStatusFilter("ACTIVE")}
          className={`cursor-pointer transition-all duration-300 rounded-2xl ${statusFilter === "ACTIVE" ? "ring-2 ring-green-500 ring-offset-2 scale-105 shadow-lg opacity-100" : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"}`}
        >
          <StatCard
            icon={CheckCircle}
            label={t.stats?.active || "Đang hoạt động"}
            value={stats.active}
            color="text-green-600"
            bg="bg-green-50"
          />
        </div>

        <div 
          onClick={() => setStatusFilter("INACTIVE")}
          className={`cursor-pointer transition-all duration-300 rounded-2xl ${statusFilter === "INACTIVE" ? "ring-2 ring-red-500 ring-offset-2 scale-105 shadow-lg opacity-100" : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"}`}
        >
          <StatCard
            icon={Slash}
            label={t.stats?.inactive || "Ngừng hoạt động"}
            value={stats.inactive}
            color="text-red-600"
            bg="bg-red-50"
          />
        </div>

        <div 
          onClick={() => setStatusFilter("NEW")}
          className={`cursor-pointer transition-all duration-300 rounded-2xl ${statusFilter === "NEW" ? "ring-2 ring-amber-500 ring-offset-2 scale-105 shadow-lg opacity-100" : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"}`}
        >
          <StatCard
            icon={RefreshCw}
            label={t.status?.new || (language === 'en' ? 'New' : language === 'jp' ? '新着' : 'Mới')}
            value={stats.new}
            color="text-amber-600"
            bg="bg-amber-50"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t.searchPlaceholder || "TÌM THEO TÊN FRANCHISE..."}
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
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchFranchises}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              title="Làm mới"
            >
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                {tableHeaders.map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                       <div className="h-4 w-28 rounded-full bg-gray-200 animate-pulse" />
                       <p className="font-medium italic">{t.table?.loading || "Đang tải danh sách franchise..."}</p>
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <AlertCircle size={48} className="text-amber-500" />
                      <p className="font-medium text-gray-700">{t.table?.loadFailed || "Không thể tải danh sách franchise"}</p>
                      <p className="text-sm text-gray-500 max-w-md">{fetchError}</p>
                      <button
                        onClick={fetchFranchises}
                        className="inline-flex items-center gap-2 bg-[#d9a13b] hover:bg-[#c48f32] text-white px-5 py-2.5 rounded-xl font-bold transition-all"
                      >
                        <RefreshCw size={18} />
                        {t.table?.retry || "Thử lại"}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredFranchises.length > 0 ? (
                filteredFranchises.map((item) => (
                  <tr key={item.id} className="group hover:bg-gray-50/80 transition-colors">
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
                    <td className="px-6 py-5">
                      <LocationButton 
                        address={item.address}
                        googleMapsUrl={item.googleMapsUrl}
                        t={t}
                      />
                    </td>
                    <td className="px-6 py-5">
                      {renderStatusCell(item)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openDetailModal(item)}
                          className="inline-flex items-center gap-1.5 px-5 py-3 text-gray-600 hover:text-[#d9a13b] hover:bg-amber-50 rounded-xl border border-gray-200 hover:border-[#d9a13b]/30 text-base font-bold transition-all"
                          title={t.table?.view || "Xem chi tiết"}
                        >
                          <Eye size={18} />
                          <span>{t.table?.view || "Xem"}</span>
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
                        {franchises.length === 0
                          ? (t.table?.noData || "Chưa có franchise nào.")
                          : (t.table?.noMatch || "Không tìm thấy franchise phù hợp với tiêu chí tìm kiếm")}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FranchiseModal
        key={activeFranchise?.id || "view"}
        isOpen={isModalOpen}
        mode="view"
        initialData={activeFranchise}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default FranchiseManager;