import React, { useState, useMemo, useEffect } from "react";
import {
  Tag,
  Plus,
  Search,
  Eye,
  TicketPlus,
  Filter,
  Edit2,
  Trash2,
  ChevronRight,
  TicketPercent,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import {
  getPromotions,
  deletePromotion
} from "@/services/promotionService";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/ui";
import { useLanguageStore } from '@/stores';
import { translations } from '@/locales';
import { PromotionAddUpdateModal } from "@/components/modal";
import PromotionDetailModal from "@/components/modal/PromotionDetailModal";
import GenerateCouponModal from "@/components/modal/GenerateCouponModal";

const PromotionManagement = () => {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).manager?.promotionManager || {};

const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [permissionFilter, setPermissionFilter] = useState("All");
  const [rankFilter, setRankFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

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

  /* ---------------- FETCH DATA ---------------- */

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

    } catch (error) {

      console.error("Fetch promotions error:", error);

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

      try {
            await deletePromotion(deleteId);
            await fetchPromotions();
            setIsConfirmOpen(false);
            setDeleteId(null);

            setMessage("Delete successful!");
            setMessageType("success");

            setTimeout(() => {
              setMessage("");
            }, 1500);

          } catch (error) {
            console.error(error);

            const msg =
              error?.response?.data?.message ||
              error?.message ||
              "Delete failed";

            setMessage(msg);
            setMessageType("error");
            setIsConfirmOpen(false);

            setTimeout(() => {
              setMessage("");
            }, 2000);
          }
        };

  /* ---------------- STATS ---------------- */

  const stats = useMemo(() => ({

    total: promotions.length,

    active: promotions.filter(
      p => p.status === "Active"
    ).length,

    inactive: promotions.filter(
      p => p.status === "Inactive"
    ).length,

  }), [promotions]);

  /* ---------------- FILTER ---------------- */

  const filteredPromotions = useMemo(() => {

    return promotions.filter((p) => {

      const matchesSearch =
        p.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        p.status === statusFilter;

      const matchesRank =
              rankFilter === "All" ||
              p.rank === "ALL" ||
              p.rank === rankFilter;

            return matchesSearch && matchesStatus && matchesRank;

          });

        }, [promotions, searchTerm, statusFilter, rankFilter]);

  return (
      <>
          {message && (
            <div
              className={`fixed top-5 right-5 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 text-white
              ${messageType === "success" ? "bg-green-500" : "bg-red-500"}`}
            >
              <span>{messageType === "success" ? "✅" : "❌"}</span>
              <span>{message}</span>
            </div>
          )}

    <div className="space-y-6 pb-10">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>

          <h2 className="text-2xl font-black text-slate-900">
            {t.title || "Promotion Management"}
          </h2>

          <p className="text-gray-500 text-sm">
            {t.subtitle || "Manage discounts and marketing campaigns"}
          </p>

        </div>

{/*         <button */}
{/*           onClick={() => { */}
{/*             setSelectedPromotion(null); */}
{/*             setIsModalOpen(true); */}
{/*           }} */}
{/*           className="flex items-center gap-2 bg-[#d9a13b] hover:bg-[#c48f32] text-white px-5 py-2.5 rounded-xl font-bold" */}
{/*         > */}

{/*           <Plus size={18} /> */}
{/*           {t.addPromotion || "New Promotion"} */}

{/*         </button> */}

      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

        <StatCard
          icon={TicketPercent}
          label={t.stats?.total || "Total Promotions"}
          value={stats.total}
          subtext={t.stats?.totalSub || "All campaigns"}
          color="text-blue-600"
          bg="bg-blue-50"
        />

        <StatCard
          icon={CheckCircle2}
          label={t.stats?.active || "Active"}
          value={stats.active}
          subtext={t.stats?.activeSub || "Currently running"}
          color="text-green-600"
          bg="bg-green-50"
        />

        <StatCard
          icon={AlertCircle}
          label={t.stats?.inactive || "Inactive"}
          value={stats.inactive}
          subtext={t.stats?.inactiveSub || "Expired or disabled"}
          color="text-orange-600"
          bg="bg-orange-50"
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
              placeholder={t.search?.placeholder || "Search promotions..."}
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

              <option value="All">{t.status?.all || "All Status"}</option>
              <option value="Active">{t.status?.active || "Active"}</option>
              <option value="Inactive">{t.status?.inactive || "Inactive"}</option>
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-50 border-b border-gray-100">

              <tr>

                {tableHeaders.map((h) => (

                  <th
                    key={h}
                    className="px-6 py-4 text-xs font-black text-gray-400 uppercase"
                  >
                    {h}
                  </th>

                ))}

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-50">

              {filteredPromotions.length > 0 ? (

                filteredPromotions.map((promo) => (

                  <tr key={promo.id} className="hover:bg-gray-50">

                    <td className="px-6 py-5 font-bold">
                      {promo.name}
                    </td>

                    <td className="px-6 py-5">
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

                    <td className="px-6 py-5">

                      <span
                        className={`text-xs px-2 py-1 rounded-full font-bold ${
                          promo.status === "Active"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {promo.status === "Active" ? t.status?.active || "Active" : t.status?.inactive || "Inactive"}
                      </span>

                    </td>

                    <td className="px-6 py-5 text-xs text-gray-400">

                      {promo.lastUpdated
                        ? new Date(promo.lastUpdated).toLocaleDateString()
                        : "-"}

                    </td>

                    <td className="px-6 py-5 flex gap-2 justify-end">

                      <button
                        onClick={() => {
                          setSelectedPromotion(promo);
                          setIsDetailOpen(true);
                        }}
                        className="text-blue-500"
                      >
                        <Eye size={18}/>
                      </button>

{/*                       <button */}
{/*                         onClick={() => { */}
{/*                           setSelectedPromotion(promo); */}
{/*                           setIsModalOpen(true); */}
{/*                         }} */}
{/*                       > */}
{/*                         <Edit2 size={16} /> */}
{/*                       </button> */}

{/*                       <button */}
{/*                         onClick={() => { */}
{/*                                                   setDeleteId(promo.id); */}
{/*                                                   setIsConfirmOpen(true); */}
{/*                                                 }} */}
{/*                         className="text-red-500" */}
{/*                       > */}
{/*                         <Trash2 size={16} /> */}
{/*                       </button> */}

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="text-center py-10 text-gray-400"
                  >

                    {t.table?.empty || "No promotions found"}

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

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
    {isConfirmOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-lg space-y-4">

              <div className="flex items-center gap-2 text-red-500">
                <span>⚠️</span>
                <h3 className="text-lg font-bold text-gray-800">
                  Confirm Delete
                </h3>
              </div>

              <p className="text-sm text-gray-500">
                Are you sure you want to delete this promotion? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3 pt-3">

                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded bg-red-500 text-white font-bold hover:bg-red-600"
                >
                  Delete
                </button>

              </div>

            </div>

          </div>
        )}
    </>

  );

};

export default PromotionManagement;