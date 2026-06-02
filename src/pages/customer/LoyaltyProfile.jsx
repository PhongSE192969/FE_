import React, { useState, useEffect } from "react";
import { loyaltyApi } from "../../services/loyaltyApi";
import { useLanguageStore } from "../../stores";
import { translations } from "../../locales";

const LoyaltyProfile = ({ customerId, franchiseId }) => {
  const [transactions, setTransactions] = useState([]);
  const [benefits, setBenefits] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).customer?.loyaltyProfile || {};

  useEffect(() => {
    fetchLoyaltyData();
  }, [customerId, franchiseId]);

  const fetchLoyaltyData = async () => {
    try {
      const [transRes, benefitsRes, promoRes] = await Promise.all([
        loyaltyApi.getCustomerTransactions(customerId),
        loyaltyApi.viewTierBenefits(customerId, franchiseId),
        loyaltyApi.getPromotions(),
      ]);
      setTransactions(transRes.data.data || []);
      setBenefits(benefitsRes.data.data || null);
      setPromotions(promoRes.data.data || []);
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    }
  };

  const handleRedeem = async (promotionId) => {
    try {
      await loyaltyApi.redeemPromotion({
        customerId,
        promotionId,
        franchiseId,
      });
      alert("Redeemed successfully!");
      fetchLoyaltyData(); // Reload points and transactions
    } catch (error) {
      alert("Redeem failed: " + error.response?.data?.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t.title || "Loyalty Program"}</h2>

      {/* Tier & Points Info */}
      {benefits && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-6 rounded-lg text-white shadow-lg flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold uppercase">
              {benefits.loyaltyTier} MEMBER
            </h3>
            <p className="mt-2 text-lg">
              {t.currentPoints || "Current Points:"}{" "}
              <span className="font-bold text-3xl ml-2">
                {benefits.currentPoints}
              </span>
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-lg">
            <p className="font-semibold mb-2">{t.yourBenefits || "Your Benefits:"}</p>
            <ul className="list-disc pl-5 text-sm">
              <li>{benefits.discountPercent}% Default Discount</li>
              {benefits.freeShipping && <li>Free Shipping</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Rewards / Promotions */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-xl font-bold mb-4">{t.rewards || "Rewards"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="border p-4 rounded-lg flex justify-between items-center bg-gray-50 hover:bg-white transition shadow-sm"
            >
              <div>
                <h4 className="font-bold text-gray-800">{promo.name}</h4>
                <p className="text-sm text-gray-500 mb-2">
                  {promo.description}
                </p>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                  {promo.pointsRequired} {t.ptsRequired || "pts required"}
                </span>
              </div>
              <button
                onClick={() => handleRedeem(promo.id)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition font-medium text-sm"
              >
                {t.redeem || "Redeem"}
              </button>
            </div>
          ))}
          {promotions.length === 0 && (
            <p className="text-gray-500">{t.emptyRewards || "No rewards available at the moment."}</p>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-xl font-bold mb-4">{t.pointsHistory || "Points History"}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-3 px-4 rounded-tl-lg">{t.table?.type || "Type"}</th>
                <th className="py-3 px-4">{t.table?.points || "Points"}</th>
                <th className="py-3 px-4">{t.table?.description || "Description"}</th>
                <th className="py-3 px-4 rounded-tr-lg">{t.table?.date || "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${tx.transactionType === "EARN" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {tx.transactionType}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 font-bold ${tx.points > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {tx.points > 0 ? `+${tx.points}` : tx.points}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{tx.description}</td>
                  <td className="py-3 px-4 text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
               {transactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">
                    {t.emptyTransactions || "No transactions found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyProfile;
