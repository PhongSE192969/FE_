import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Award,
  AlertCircle,
} from "lucide-react";
import { useLoyaltyStore } from "../../stores/useLoyaltyStore";
import { loyaltyApi } from "../../services/loyaltyApi"; // Bắt buộc phải import cái này
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const getTierStyle = (tier) => {
  switch (tier?.toUpperCase()) {
    case "BRONZE":
      return "from-orange-400 to-orange-700 shadow-orange-200";
    case "SILVER":
      return "from-gray-300 to-gray-500 shadow-gray-200";
    case "GOLD":
      return "from-yellow-400 to-yellow-600 shadow-yellow-200";
    case "PLATINUM":
      return "from-cyan-200 to-blue-400 text-blue-900 shadow-blue-100";
    case "DIAMOND":
      return "from-blue-400 via-indigo-300 to-purple-500 shadow-indigo-200";
    default:
      return "from-gray-400 to-gray-600 shadow-gray-200";
  }
};

export default function LoyaltyReport() {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).manager?.loyaltyReport || {};

  const { tiers, fetchTiers } = useLoyaltyStore();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Dùng loyaltyApi (đã có tích hợp token và đúng URL) thay vì fetch
      const response = await loyaltyApi.viewReports();

      // 2. Vì axiosClient trả về object Response, body sẽ nằm trong response.data
      const result = response.data;

      if (result.statusCode === 200) {
        setReportData(result.data);
      } else {
        setError(t.error?.fetch || "Failed to fetch report data.");
      }
    } catch (err) {
      console.error("Error fetching loyalty report:", err);
      setError(t.error?.connect || "Cannot connect to Loyalty Service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
    fetchReport();
  }, []);

  return (
    <div className="space-y-8 p-6 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
            {t.title || "Loyalty Analytics"}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {t.subtitle || "Comprehensive report on points, transactions, and membership tiers."}
          </p>
        </div>
        <button
          onClick={fetchReport}
          className="bg-white border-2 border-gray-200 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 hover:border-gray-900 transition-colors shadow-sm"
        >
          {t.refresh || "Refresh Data"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 font-bold text-sm">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: TrendingUp,
            label: t.stats?.earned || "Total Points Earned",
            value: reportData?.totalPointsEarned,
            sub: t.stats?.earnedSub || "Lifetime accumulated",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            iconColor: "text-emerald-500",
          },
          {
            icon: ShoppingBag,
            label: t.stats?.redeemed || "Total Points Redeemed",
            value: reportData?.totalPointsRedeemed,
            sub: t.stats?.redeemedSub || "Spent on rewards",
            color: "text-blue-600",
            bg: "bg-blue-50",
            iconColor: "text-blue-500",
          },
          {
            icon: ArrowUpRight,
            label: t.stats?.earnTxn || "Earn Transactions",
            value: reportData?.totalEarnTransactions,
            sub: t.stats?.earnTxnSub || "Total occurrences",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            iconColor: "text-indigo-500",
          },
          {
            icon: ArrowDownRight,
            label: t.stats?.redeemTxn || "Redeem Transactions",
            value: reportData?.totalRedeemTransactions,
            sub: t.stats?.redeemTxnSub || "Total occurrences",
            color: "text-orange-600",
            bg: "bg-orange-50",
            iconColor: "text-orange-500",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="size-12 bg-gray-100 rounded-xl"></div>
                <div className="h-8 bg-gray-100 rounded w-1/2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/3"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`size-12 rounded-xl ${card.bg} flex items-center justify-center`}
                  >
                    <card.icon size={24} className={card.iconColor} />
                  </div>
                </div>
                <div
                  className={`text-3xl font-black ${card.color} tracking-tighter`}
                >
                  {card.value?.toLocaleString() || 0}
                </div>
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-2">
                  {card.label}
                </div>
                <div className="text-xs text-gray-400 mt-1 font-medium">
                  {card.sub}
                </div>
                <div
                  className={`absolute -right-6 -bottom-6 size-24 ${card.bg} rounded-full opacity-0 group-hover:opacity-50 transition-opacity`}
                ></div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* TIER DISTRIBUTION SECTION */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">
              {t.tierDist?.title || "Customer Tier Distribution"}
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {t.tierDist?.subtitle || "Breakdown of members by their current loyalty status"}
            </p>
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-50 rounded-2xl animate-pulse border border-gray-100"
                ></div>
              ))}
            </div>
          ) : !reportData?.customerByTier ||
            Object.keys(reportData.customerByTier).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Award className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                {t.tierDist?.empty || "No Tier Data Available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {Object.entries(reportData.customerByTier)
                .sort(([tierA], [tierB]) => {
                  const configA = tiers.find(
                    (t) => (t.tierName || t.name) === tierA.toUpperCase(),
                  );
                  const configB = tiers.find(
                    (t) => (t.tierName || t.name) === tierB.toUpperCase(),
                  );
                  return (
                    (configA?.requiredPoints || 0) -
                    (configB?.requiredPoints || 0)
                  );
                })
                .map(([tier, count]) => (
                  <div
                    key={tier}
                    className="relative overflow-hidden bg-white border-2 border-gray-50 p-6 rounded-2xl shadow-sm transition-all"
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                          {t.tierDist?.level || "Tier Level"}
                        </p>
                        <span
                          className={`inline-block bg-gradient-to-r ${getTierStyle(tier)} text-white text-[11px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-lg group-hover:scale-105 transition-transform`}
                        >
                          {tier}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          {t.tierDist?.members || "Members"}
                        </p>
                        <p className="text-4xl font-black text-gray-900 tracking-tighter">
                          {count.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 size-32 bg-gray-50 rounded-full z-0 group-hover:bg-indigo-50/50 transition-colors"></div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
