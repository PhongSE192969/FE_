import React, { useEffect, useState } from "react";
import { loyaltyApi } from "@/services/loyaltyApi";

const getTierStyle = (tier) => {
  switch (tier?.toUpperCase()) {
    case "BRONZE":
      return "from-orange-400 to-orange-700";
    case "SILVER":
      return "from-gray-300 to-gray-500";
    case "GOLD":
      return "from-yellow-400 to-yellow-600";
    case "PLATINUM":
      return "from-cyan-200 to-blue-400 text-blue-900";
    case "DIAMOND":
      return "from-blue-400 via-indigo-300 to-purple-500";
    default:
      return "from-gray-400 to-gray-600";
  }
};

const LoyaltyDetailCard = ({ userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    loyaltyApi
      .getCustomerTierInfo(userId)
      .then((res) => {
        setData(res.data?.data || res.data);
      })
      .catch(() => {
        setData({ currentTier: "BRONZE", currentPoints: 0, totalPoints: 0 });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white border-2 border-indigo-50 p-4 rounded-xl shadow-sm animate-pulse">
        <div className="h-6 w-24 bg-gray-200 rounded-full mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-indigo-50 p-4 rounded-xl shadow-sm">
      <span
        className={`inline-block bg-gradient-to-r ${getTierStyle(
          data?.currentTier,
        )} text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase mb-2`}
      >
        {data?.currentTier || "BRONZE"} MEMBER
      </span>

      <div className="flex justify-between text-sm mt-2">
        <span className="text-gray-500 font-semibold">Current Points:</span>
        <span className="font-black text-indigo-600">
          {(data?.currentPoints || 0).toLocaleString()} pts
        </span>
      </div>

      <div className="flex justify-between text-xs mt-1">
        <span className="text-gray-400">Total Accumulated:</span>
        <span className="font-bold text-gray-500">
          {(data?.totalPoints || 0).toLocaleString()} pts
        </span>
      </div>
    </div>
  );
};

export default LoyaltyDetailCard;
