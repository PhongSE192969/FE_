import { apiCall } from "@/config/api";
import {HTTP_METHODS} from "@/constraints/index.js";

/* ================= PROMOTION ================= */

// 🔹 GET ALL
export const getPromotions = async () => {
  return await apiCall("GET", "/promotions");
};

export const getPromotionById = async (id) => {
  return await apiCall("GET", `/promotions/${id}`);
};

// 🔹 CREATE
export const createPromotion = async (data) => {
  return await apiCall("POST", "/promotions", data);
};

// 🔹 UPDATE
export const updatePromotion = async (id, data) => {
  return await apiCall("PUT", `/promotions/${id}`, data);
};

// 🔹 DELETE
export const deletePromotion = async (id) => {
  return await apiCall("DELETE", `/promotions/${id}`);
};

// 🔹 GET AVAILABLE PROMOTIONS (cho user dùng)
export const getAvailablePromotions = async ({
  userId,
  franchiseId,
  orderValue
}) => {
  return await apiCall(
    HTTP_METHODS.GET,
    `/promotions/available?userId=${userId}&franchiseId=${franchiseId}&orderValue=${orderValue}`
  );
};

// 🔹 APPLY PROMOTION (order gọi)
export const applyPromotion = async (data) => {
  return await apiCall("POST", "/promotions/apply", data);
};

// 🔹 CONFIRM ORDER (sau khi thanh toán)
export const confirmPromotion = async ({ orderId, status }) => {
  return await apiCall(
    "POST",
    `/promotions/confirm?orderId=${orderId}&status=${status}`
  );
};