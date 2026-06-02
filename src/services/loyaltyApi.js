// src/services/loyaltyApi.js
import { axiosClient } from "../config/axiosClient";

export const loyaltyApi = {
  // Lịch sử giao dịch điểm
  getCustomerTransactions: (userId) =>
    axiosClient.get(`/loyalty/transactions/${userId}`),

  // Lấy thông tin ví và Hạng thẻ của khách
  getCustomerTierInfo: (userId, franchiseId = null) => {
    const params = franchiseId ? { franchiseId } : {};
    return axiosClient.get(`/loyalty/wallets/users/${userId}`, { params });
  },

  // Khách hàng bấm Đổi quyền lợi / Đổi điểm
  redeemPromotion: (data) => axiosClient.post(`/loyalty/deduct`, data),

  // Xem tất cả các hạng thẻ có trong hệ thống
  viewTiers: () => axiosClient.get("/loyalty/tiers"),

  // ENDPOINT BÁO CÁO
  viewReports: () => axiosClient.get(`/loyalty/reports`),

  // --- TẠO VÍ ĐIỂM TỰ ĐỘNG ---
  createWallet: async (userId) => {
    return await axiosClient.post(`/loyalty/wallets/users/${userId}`);
  },
};
