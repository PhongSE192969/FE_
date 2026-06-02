import React from "react";
import { X } from "lucide-react";

const PromotionDetailModal = ({
  promotion,
  setIsOpen
}) => {

  if (!promotion) return null;

  const isExpired =
    promotion.expiryDate &&
    new Date(promotion.expiryDate) < new Date();

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

      <div className="bg-white rounded-2xl w-[600px] shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b">

          <div>
            <h2 className="text-xl font-bold">
              Promotion Detail
            </h2>
            <p className="text-sm text-gray-500">
              {promotion.name}
            </p>
          </div>

          <button onClick={() => setIsOpen(false)}>
            <X />
          </button>

        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">

          {/* STATUS + RANK */}
          <div className="flex justify-between items-center">

            {/* STATUS */}
            <span className={`px-3 py-1 text-xs rounded-full font-bold ${
              isExpired || promotion.status === "INACTIVE"
                ? "bg-gray-200 text-gray-500"
                : "bg-green-100 text-green-600"
            }`}>
              {isExpired ? "EXPIRED" : promotion.status}
            </span>

            {/* RANK */}
            <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600 font-bold">
              {promotion.requiredRank || "ALL"}
            </span>

          </div>

          {/* INFO GRID */}
          <div className="grid grid-cols-2 gap-4 text-sm">

            <div>
              <p className="text-gray-400">Discount Type</p>
              <p className="font-semibold">
                {promotion.discountType}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Discount Value</p>
              <p className="font-semibold">
                {promotion.discountType === "PERCENT"
                  ? `${promotion.discountValue}%`
                  : `${promotion.discountValue.toLocaleString()} VND`}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Min Order Value</p>
              <p className="font-semibold">
                {promotion.minOrderValue}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Max Discount</p>
              <p className="font-semibold">
                {promotion.maxDiscountValue || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Usage Limit</p>
              <p className="font-semibold">
                {promotion.usageLimit || "∞"}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Used Count</p>
              <p className="font-semibold">
                {promotion.usedCount || 0}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Per User Limit</p>
              <p className="font-semibold">
                {promotion.perUserLimit || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Expiry Date</p>
              <p className="font-semibold">
                {promotion.expiryDate
                  ? new Date(promotion.expiryDate).toLocaleString()
                  : "No limit"}
              </p>
            </div>

          </div>

          {/* PROGRESS USAGE (xịn hơn) */}
          {promotion.usageLimit && (
            <div>
              <p className="text-xs text-gray-400 mb-1">
                Usage Progress
              </p>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${
                      (promotion.usedCount / promotion.usageLimit) * 100
                    }%`
                  }}
                />
              </div>

              <p className="text-xs text-right mt-1 text-gray-500">
                {promotion.usedCount} / {promotion.usageLimit}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>

  );

};

export default PromotionDetailModal;