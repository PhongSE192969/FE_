import { create } from "zustand";

export const useLoyaltyStore = create((set, get) => ({
  tiers: [],

  fetchTiers: async () => {
    if (get().tiers.length > 0) return;

    try {
      const response = await fetch("http://localhost:3005/api/loyalty/tiers");
      const result = await response.json();
      if (result.data) {
        const sorted = result.data.sort(
          (a, b) => a.requiredPoints - b.requiredPoints,
        );
        set({ tiers: sorted });
      }
    } catch (error) {
      console.error("Không thể lấy cấu hình Tier:", error);
    }
  },
}));
