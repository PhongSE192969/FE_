import React, { useEffect, useState } from "react";
import { loyaltyApi } from "@/services/loyaltyApi";

const LoyaltyCell = ({ userId }) => {
  const [loyaltyData, setLoyaltyData] = useState({
    tier: "...",
    points: "...",
  });

  useEffect(() => {
    if (userId) {
      loyaltyApi
        .getCustomerTierInfo(userId)
        .then((res) => {
          const data = res.data?.data || res.data;
          setLoyaltyData({
            tier: data.currentTier || "BRONZE",
            points: data.currentPoints || 0,
          });
        })
        .catch((err) => {
          setLoyaltyData({ tier: "BRONZE", points: 0 });
        });
    }
  }, [userId]);

  return (
    <div className="flex flex-col">
      <span className="font-bold text-blue-600">{loyaltyData.tier}</span>
      <span className="text-sm text-gray-500">{loyaltyData.points} pts</span>
    </div>
  );
};

export default LoyaltyCell;
