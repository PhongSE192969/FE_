import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Filter,
  Edit2,
  Trash2,
  TicketPercent,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import {
  getPromotions,
  deletePromotion
} from "@/services/promotionService";

import { StatCard } from "@/components/ui";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

import PromotionAddUpdateModal from "@/components/modal/PromotionAddUpdateModal";
import PromotionDetailModal from "@/components/modal/PromotionDetailModal";

const PromotionStoreManager = () => {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).manager?.promotionManager || {};

  const [promotions, setPromotions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [rankFilter, setRankFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const tableHeaders = [
    t.table?.name || "Promotion Name",
    t.table?.discount || "Discount",
    t.table?.rank || "Rank",
    t.table?.status || "Status",
    t.table?.lastUpdated || "Last Updated",
    ""
  ];

  /* ---------------- FETCH ---------------- */

  const fetchPromotions = async () => {
    try {
      const data = await getPromotions();

      const normalized = (data || []).map((p) => {
                    const now = new Date();
                    const isExpired = p.expiryDate && new Date(p.expiryDate) < now;

                    return {
                      ...p,
                      // Nếu BE đã set EXPIRED thì dùng luôn, nếu chưa thì tự tính theo expiryDate
                      status: p.status === "EXPIRED" || isExpired
                        ? "Expired"
                        : p.status === "ACTIVE"
                          ? "Active"
                          : "Inactive",

                      rank: p.requiredRank || "ALL",
                      discountType: p.discountType,
                      lastUpdated: p.updatedAt || p.createdAt || null,
                    };
                  });

      setPromotions(normalized);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchPromotions();
     const interval = setInterval(() => {
                fetchPromotions(); // fetch mỗi 60s
              }, 60000);

              return () => clearInterval(interval);
  }, []);

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (id) => {
    if (!confirm(t.confirmDelete || "Delete this promotion?")) return;

    try {
      await deletePromotion(id);
      await fetchPromotions();
      alert("✅ Delete successful!");
    } catch (err) {
      console.error(err);
      alert("❌ Delete failed");
    }
  };

  /* ---------------- STATS ---------------- */

  const stats = useMemo(
    () => ({
      total: promotions.length,
      active: promotions.filter((p) => p.status === "Active").length,
      inactive: promotions.filter((p) => p.status === "Inactive").length
    }),
    [promotions]
  );

  /* ---------------- FILTER ---------------- */

  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const matchesSearch = p.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || p.status === statusFilter;

      const matchesRank =
        rankFilter === "All" ||
        p.rank === "ALL" ||
        p.rank === rankFilter;

      return matchesSearch && matchesStatus && matchesRank;
    });
  }, [promotions, searchTerm, statusFilter, rankFilter]);

  return (
    <div className="space-y-6 pb-10">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">
            {t.title || "Promotion Management"}
          </h2>
          <p className="text-gray-500 text-sm">
            {t.subtitle || "Manage promotions"}
          </p>
        </div>

        {/*<button*/}
        {/*  onClick={() => {*/}
        {/*    setSelectedPromotion(null);*/}
        {/*    setIsModalOpen(true);*/}
        {/*  }}*/}
        {/*  className="flex items-center gap-2 bg-[#d9a13b] text-white px-5 py-2.5 rounded-xl font-bold"*/}
        {/*>*/}
        {/*  <Plus size={18} />*/}
        {/*  {t.addPromotion || "New Promotion"}*/}
        {/*</button>*/}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

        <StatCard
          icon={TicketPercent}
          label="Total"
          value={stats.total}
          bg="bg-blue-50"
          color="text-blue-600"
          onClick={() => setStatusFilter("All")}
        />

        <StatCard
          icon={CheckCircle2}
          label="Active"
          value={stats.active}
          bg="bg-green-50"
          color="text-green-600"
          onClick={() => setStatusFilter("Active")}
        />

        <StatCard
          icon={AlertCircle}
          label="Inactive"
          value={stats.inactive}
          bg="bg-orange-50"
          color="text-orange-600"
          onClick={() => setStatusFilter("Inactive")}
        />
      </div>

      {/* SEARCH + FILTER */}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

              <div className="flex flex-col lg:flex-row gap-4">

                {/* SEARCH */}

                <div className="relative flex-1">

                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />

                  <input
                    type="text"
                    placeholder={t.searchPlaceholder || "Search promotions..."}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                </div>

                {/* STATUS FILTER */}

                <div className="relative">

                  <Filter
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />

                  <select
                    className="pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >

                    <option value="All">{t.allStatus || "All Status"}</option>
                    <option value="Active">{t.table?.statusActive || "Active"}</option>
                    <option value="Inactive">{t.table?.statusInactive || "Inactive"}</option>
                    <option value="Expired">{t.status?.expired || "Expired"}</option>

                  </select>

                </div>

                {/* PERMISSION FILTER */}

                <div className="relative">

                  <select
                    className="pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={rankFilter}
                    onChange={(e) => setRankFilter(e.target.value)}
                  >
                    <option value="All">{t.rank?.all || "All Rank"}</option>
                    <option value="BRONZE">{t.rank?.bronze || "Bronze"}</option>
                    <option value="SILVER">{t.rank?.silver || "Silver"}</option>
                    <option value="GOLD">{t.rank?.gold || "Gold"}</option>
                    <option value="PLATINUM">{t.rank?.platinum || "Platinum"}</option>
                    <option value="DIAMOND">{t.rank?.diamond || "Diamond"}</option>
                  </select>


                </div>

              </div>

            </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-50">
            <tr>
              {tableHeaders.map((h) => (
                <th key={h} className="px-6 py-3 text-left text-sm">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredPromotions.map((promo) => (
              <tr key={promo.id} className="border-t">

                <td className="px-6 py-4 font-bold">{promo.name}</td>

                <td className="px-6 py-4">
                  {promo.discountType === "PERCENT"
                    ? `${promo.discountValue}%`
                    : `${promo.discountValue.toLocaleString()} VND`}
                </td>

                <td className="px-6 py-5">
                  {promo.rank === "BRONZE" && (t.rank?.bronze || "Bronze")}
                  {promo.rank === "SILVER" && (t.rank?.silver || "Silver")}
                  {promo.rank === "GOLD" && (t.rank?.gold || "Gold")}
                  {promo.rank === "PLATINUM" && (t.rank?.platinum || "Platinum")}
                  {promo.rank === "DIAMOND" && (t.rank?.diamond || "Diamond")}
                  {promo.rank === "ALL" && (t.rank?.all || "All")}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      promo.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {promo.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-400">
                  {promo.lastUpdated
                    ? new Date(promo.lastUpdated).toLocaleDateString()
                    : "-"}
                </td>

                <td className="px-6 py-4 flex gap-2">

                  <Eye
                    size={18}
                    className="cursor-pointer text-blue-500"
                    onClick={() => {
                      setSelectedPromotion(promo);
                      setIsDetailOpen(true);
                    }}
                  />

                  {/*<Edit2*/}
                  {/*  size={16}*/}
                  {/*  className="cursor-pointer"*/}
                  {/*  onClick={() => {*/}
                  {/*    setSelectedPromotion(promo);*/}
                  {/*    setIsModalOpen(true);*/}
                  {/*  }}*/}
                  {/*/>*/}

                  {/*<Trash2*/}
                  {/*  size={16}*/}
                  {/*  className="cursor-pointer text-red-500"*/}
                  {/*  onClick={() => handleDelete(promo.id)}*/}
                  {/*/>*/}

                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

      {/* MODALS */}

      {isModalOpen && (
        <PromotionAddUpdateModal
          selectedPromotion={selectedPromotion}
          setIsModalOpen={setIsModalOpen}
          refreshPromotions={fetchPromotions}
        />
      )}

      {isDetailOpen && (
        <PromotionDetailModal
          promotion={selectedPromotion}
          setIsOpen={setIsDetailOpen}
        />
      )}

    </div>
  );
};

export default PromotionStoreManager;