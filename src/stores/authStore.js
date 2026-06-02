// src/stores/authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const normalizeRoleName = (user) => {
  const roleName = user?.role?.name || user?.role || null;
  return roleName ? String(roleName).toUpperCase() : null;
};

const normalizeFranchiseId = (user) => {
  return (
    user?.franchise?.id ||
    user?.franchiseId ||
    user?.franchise_id ||
    null
  );
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      /**
       * Login mới dùng cho Firebase flow:
       * login({
       *   user: userFromBackend,
       *   accessToken: firebaseIdToken
       * })
       *
       * Vẫn hỗ trợ kiểu cũ:
       * login(user)
       */
      login: (payload) => {
        const isNewPayload =
          payload &&
          typeof payload === "object" &&
          ("user" in payload || "accessToken" in payload);

        if (isNewPayload) {
          const user = payload.user || null;
          const accessToken = payload.accessToken || null;

          set({
            user,
            accessToken,
            isAuthenticated: Boolean(user && accessToken),
          });

          return;
        }

        // Backward compatible cho code cũ đang gọi login(user)
        set({
          user: payload || null,
          accessToken: get().accessToken,
          isAuthenticated: Boolean(payload),
        });
      },

      setAuth: ({ user, accessToken }) => {
        set({
          user: user || null,
          accessToken: accessToken || null,
          isAuthenticated: Boolean(user && accessToken),
        });
      },

      setAccessToken: (accessToken) => {
        set({
          accessToken: accessToken || null,
          isAuthenticated: Boolean(get().user && accessToken),
        });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      getUserRole: () => {
        return normalizeRoleName(get().user);
      },

      getUserFranchiseId: () => {
        return normalizeFranchiseId(get().user);
      },

      getUserId: () => {
        return get().user?.id || null;
      },

      isManager: () => {
        return normalizeRoleName(get().user) === "MANAGER";
      },

      isAdmin: () => {
        return normalizeRoleName(get().user) === "ADMIN";
      },

      isStoreManager: () => {
        return normalizeRoleName(get().user) === "STORE_MANAGER";
      },

      isStaff: () => {
        return normalizeRoleName(get().user) === "STAFF";
      },

      isCustomer: () => {
        return normalizeRoleName(get().user) === "CUSTOMER";
      },

      hasRole: (roles = []) => {
        const currentRole = normalizeRoleName(get().user);
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        return allowedRoles
          .map((role) => String(role).toUpperCase())
          .includes(currentRole);
      },

      /**
       * Kiểm tra user có thuộc nhóm quản trị nội bộ không.
       */
      isInternalUser: () => {
        const role = normalizeRoleName(get().user);
        return ["MANAGER", "ADMIN", "STORE_MANAGER", "STAFF"].includes(role);
      },

      /**
       * Kiểm tra user có quyền toàn hệ thống không.
       * MANAGER tổng và ADMIN không bị giới hạn theo franchiseId.
       */
      hasGlobalAccess: () => {
        const role = normalizeRoleName(get().user);
        return ["MANAGER", "ADMIN"].includes(role);
      },

      /**
       * Kiểm tra user có quyền theo store/franchise không.
       * STORE_MANAGER và STAFF bắt buộc cần franchiseId.
       */
      hasStoreAccess: () => {
        const role = normalizeRoleName(get().user);
        const franchiseId = normalizeFranchiseId(get().user);

        return ["STORE_MANAGER", "STAFF"].includes(role) && Boolean(franchiseId);
      },

      getAuthHeaders: () => {
        const token = get().accessToken;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },

      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: "capital-coffee-auth",

      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated?.(true);
      },
    }
  )
);