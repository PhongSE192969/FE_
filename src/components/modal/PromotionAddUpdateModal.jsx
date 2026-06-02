import React, { useState, useEffect } from "react";
import { createPromotion, updatePromotion } from "@/services/promotionService";

const RANKS = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];

const PromotionAddUpdateModal = ({
  selectedPromotion,
  setIsModalOpen,
  refreshPromotions
}) => {

  const isEdit = !!selectedPromotion;

  const [form, setForm] = useState({
    name: "",
    discountType: "PERCENT",
    discountValue: "",
    requiredRank: "",
    usageLimit: "",
    perUserLimit: "",
    minOrderValue: "",
    maxDiscountValue: "",
    expiryDate: "",
    status: "ACTIVE"
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    if (selectedPromotion) {
      setForm({
        name: selectedPromotion.name || "",
        discountType: selectedPromotion.discountType || "PERCENT",
        discountValue: selectedPromotion.discountValue || "",
        requiredRank: selectedPromotion.requiredRank || "",
        usageLimit: selectedPromotion.usageLimit || "",
        perUserLimit: selectedPromotion.perUserLimit || "",
        minOrderValue: selectedPromotion.minOrderValue || "",
        maxDiscountValue: selectedPromotion.maxDiscountValue || "",
        expiryDate: selectedPromotion.expiryDate
          ? selectedPromotion.expiryDate.slice(0, 16)
          : "",
        status: (selectedPromotion.status || "ACTIVE").toUpperCase()
      });
    }
  }, [selectedPromotion]);

  /* ---------------- HANDLE CHANGE ---------------- */
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  /* ---------------- VALIDATE ---------------- */
  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.discountValue || Number(form.discountValue) <= 0) {
      newErrors.discountValue = "Must be greater than 0";
    }

    if (Number(form.discountValue) < 0) {
      newErrors.discountValue = "Cannot be negative";
    }

    if (form.discountType === "PERCENT" && Number(form.discountValue) > 100) {
      newErrors.discountValue = "Percent cannot exceed 100";
    }

    if (form.minOrderValue && Number(form.minOrderValue) < 0) {
      newErrors.minOrderValue = "Cannot be negative";
    }

    if (form.maxDiscountValue && Number(form.maxDiscountValue) < 0) {
      newErrors.maxDiscountValue = "Cannot be negative";
    }

    if (form.usageLimit && Number(form.usageLimit) < 0) {
      newErrors.usageLimit = "Cannot be negative";
    }

    if (form.perUserLimit) {
      if (Number(form.perUserLimit) < 1) {
        newErrors.perUserLimit = "Must be at least 1";
      }
    }

    if (
      form.usageLimit &&
      form.perUserLimit &&
      Number(form.perUserLimit) > Number(form.usageLimit)
    ) {
      newErrors.perUserLimit = "Cannot exceed total usage limit";
    }

    if (form.expiryDate && new Date(form.expiryDate) < new Date()) {
      newErrors.expiryDate = "Must be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {

    if (!validate()) return;

    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        maxDiscountValue: form.maxDiscountValue
          ? Number(form.maxDiscountValue)
          : null,
        requiredRank: form.requiredRank || null,
        expiryDate: form.expiryDate || null
      };

      if (isEdit) {
        await updatePromotion(selectedPromotion.id, payload);
      } else {
        await createPromotion(payload);
      }

      await refreshPromotions();

      setSuccessMessage(
        isEdit ? "Update successful!" : "Create successful!"
      );

      setTimeout(() => {
        setSuccessMessage("");
        setIsModalOpen(false);
      }, 1500);

    } catch (err) {
        console.error(err);

        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Save failed";

        alert("❌ " + msg);
      }
  };

  /* ---------------- UI ---------------- */

  const renderError = (field) =>
    errors[field] && (
      <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
    );

  return (
      <>
        {successMessage && (
          <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce z-50">
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-2xl p-6 rounded-2xl shadow-lg space-y-5">

        <h2 className="text-xl font-bold">
          {isEdit ? "Update Promotion" : "Create Promotion"}
        </h2>

        <div className="grid grid-cols-2 gap-4">

          {/* NAME */}
          <div className="col-span-2">
            <input
              name="name"
              placeholder="Promotion name"
              value={form.name}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {renderError("name")}
          </div>

          {/* DISCOUNT TYPE */}
          <select
            name="discountType"
            value={form.discountType}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="PERCENT">Percent (%)</option>
            <option value="FIXED">Fixed Amount</option>
          </select>

          {/* DISCOUNT VALUE */}
          <div>
            <input
              name="discountValue"
              type="number"
              placeholder={
                form.discountType === "PERCENT"
                  ? "Enter % (0-100)"
                  : "Enter amount (VND)"
              }
              value={form.discountValue}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {renderError("discountValue")}
          </div>

          {/* RANK */}
          <select
            name="requiredRank"
            value={form.requiredRank}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">All Rank</option>
            {RANKS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* MIN ORDER */}
          <div>
            <input
              name="minOrderValue"
              type="number"
              placeholder="Min order value"
              value={form.minOrderValue}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {renderError("minOrderValue")}
          </div>

          {/* MAX DISCOUNT */}
          <div>
            <input
              name="maxDiscountValue"
              type="number"
              placeholder="Max discount"
              value={form.maxDiscountValue}
              onChange={handleChange}
              disabled={form.discountType === "FIXED"}
              className={`w-full border p-2 rounded ${
                form.discountType === "FIXED"
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""
              }`}
            />
            {renderError("maxDiscountValue")}
          </div>

          {/* USAGE LIMIT */}
          <div>
            <input
              name="usageLimit"
              type="number"
              placeholder="Total usage limit"
              value={form.usageLimit}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {renderError("usageLimit")}
          </div>

          {/* PER USER LIMIT */}
          <div>
            <input
              name="perUserLimit"
              type="number"
              placeholder="Per user limit"
              value={form.perUserLimit}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {renderError("perUserLimit")}
          </div>

          {/* EXPIRY */}
          <div className="col-span-2">
            <input
              name="expiryDate"
              type="datetime-local"
              value={form.expiryDate}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {renderError("expiryDate")}
          </div>

          {/* STATUS */}
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border p-2 rounded col-span-2"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="EXPIRED" disabled>EXPIRED</option>
          </select>

        </div>

        {/* ACTION */}
        <div className="flex justify-end gap-3">

          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-[#d9a13b] text-white font-bold"
          >
            {isEdit ? "Update" : "Create"}
          </button>

        </div>

      </div>

    </div>
    </>
  );
};

export default PromotionAddUpdateModal;