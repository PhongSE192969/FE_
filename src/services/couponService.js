import { apiCall } from "@/config/api";

/* ================= COUPON ================= */

/**
 * Lấy danh sách coupon theo promotion
 */
export const getCouponsByPromotion = async (promotionId) => {
  return await apiCall(
    "GET",
    `/promotions/coupons/${promotionId}`
  );
};


/**
 * Generate coupon codes
 */
export const generateCoupons = async (
  promotionId,
  quantity,
  usageLimit,
  expiryDate
) => {

  return await apiCall(
    "POST",
    `/promotions/coupons/generate/${promotionId}?quantity=${quantity}&usageLimit=${usageLimit}&expiryDate=${expiryDate}`
  );

};


/**
 * Xóa coupon
 */
export const deleteCoupon = async (couponId) => {

  return await apiCall(
    "DELETE",
    `/promotions/coupons/${couponId}`
  );

};

export const updateCoupon = async (id, data) => {

  return await apiCall(
    "PUT",
    `/promotions/coupons/${id}`,
    data
  );

};


/**
 * Validate coupon
 */
export const validateCoupon = async (code) => {

  return await apiCall(
    "GET",
    `/promotions/coupons/validate/${code}`
  );

};