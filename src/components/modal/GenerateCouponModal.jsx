import React, { useState } from "react";
import { X } from "lucide-react";
import { generateCoupons } from "@/services/couponService";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const GenerateCouponModal = ({ promotion, setIsOpen }) => {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).modals?.generateCoupon || {};

  const [quantity, setQuantity] = useState(1);
  const [usageLimit, setUsageLimit] = useState(1);
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");

const handleGenerate = async () => {

  try {

    const formattedDate = expiryDate
      ? `${expiryDate}T00:00:00Z`
      : null;

    await generateCoupons(
      promotion.id,
      quantity,
      usageLimit,
      formattedDate,
      status
    );

    alert(t.alerts?.success || "Generate coupon success");

    setIsOpen(false);

  } catch (err) {

    console.error(err);

    alert(t.alerts?.failed || "Generate coupon failed");

  }

};

  return (

    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">

      <div className="bg-white rounded-xl w-[420px] p-6 space-y-5 shadow-lg">

        {/* HEADER */}

        <div className="flex justify-between items-center">

          <div>
            <h2 className="text-lg font-bold">
              {t.title || "Generate Coupon Codes"}
            </h2>
            <p className="text-sm text-gray-500">
              {t.promotionLabel || "Promotion:"} {promotion?.name}
            </p>
          </div>

          <button onClick={() => setIsOpen(false)}>
            <X size={18}/>
          </button>

        </div>

        {/* QUANTITY */}

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-600">
            {t.form?.quantity || "Number of Codes"}
          </label>
          <input
            type="number"
            className="w-full border rounded-lg p-2"
            value={quantity}
            onChange={(e)=>setQuantity(e.target.value)}
          />
        </div>

        {/* USAGE LIMIT */}

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-600">
            {t.form?.usageLimit || "Usage Limit per Code"}
          </label>
          <input
            type="number"
            className="w-full border rounded-lg p-2"
            value={usageLimit}
            onChange={(e)=>setUsageLimit(e.target.value)}
          />
        </div>

        {/* EXPIRY DATE */}

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-600">
            {t.form?.expiryDate || "Expiry Date"}
          </label>
          <input
            type="date"
            className="w-full border rounded-lg p-2"
            value={expiryDate}
            onChange={(e)=>setExpiryDate(e.target.value)}
          />
        </div>

        {/* STATUS */}

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-600">
            {t.form?.status || "Status"}
          </label>
          <select
            className="w-full border rounded-lg p-2"
            value={status}
            onChange={(e)=>setStatus(e.target.value)}
          >
            <option value="ACTIVE">{t.form?.statusActive || "Active"}</option>
            <option value="INACTIVE">{t.form?.statusInactive || "Inactive"}</option>
          </select>
        </div>

        {/* BUTTON */}

        <button
          onClick={handleGenerate}
          className="w-full bg-[#d9a13b] hover:bg-[#c48f32] text-white py-2 rounded-lg font-semibold"
        >
          {t.actions?.generate || "Generate Codes"}
        </button>

      </div>

    </div>

  );
};

export default GenerateCouponModal;