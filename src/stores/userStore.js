// src/stores/authStore.js
import { GetAllUsers, GetCountUsers, GetRoles, SearchUsers } from '@/services';
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set, get) => ({
      users: [],
      roles: [],
      statsCounts: [],
      isLoading: false,
      totalPages: 0,
      totalElements: 0,
      currentPage: 1,

      fetchCountUsers: async () => {
        const response = await GetCountUsers();
        console.log('response stats count: ', response)
        if (response !== null) {
          set({ statsCounts: response });
        }
      },
      fetchUsersList: async (queryParams) => {
        set({ isLoading: true });
        try {
          // Backend Spring thường nhận page index từ 0, UI truyền từ 1 nên cần trừ 1
          const payload = {
            ...queryParams,
            page: queryParams.page > 0 ? queryParams.page - 1 : 0
          };

          // Loại bỏ các param rác hoặc 'All' trước khi gửi xuống BE
          if (!payload.keyword) delete payload.keyword;
          if (payload.role === 'All') delete payload.role;
          if (payload.status === 'All') delete payload.status;
          const response = await SearchUsers(payload);

          if (response) {
            set({
              users: response.content,
              totalPages: response.totalPages,
              totalElements: response.totalElements,
              currentPage: response.pageable?.pageNumber !== undefined ? response.pageable.pageNumber + 1 : payload.page + 1,
              isLoading: false
            });
          }
        } catch (error) {
          console.error("Fetch users list failed:", error);
          set({ isLoading: false, users: [] });
        }
      },
      fetchRolesList: async () => {
        try {
          const response = await GetRoles();
          if (response) {
            set({ roles: response.data || [] });
          }
        } catch (error) {
          console.error("Fetch roles list failed:", error);
          set({ roles: [] });
        }
      }
    }),
    {
      name: 'capital-coffee-users',
      // Chỉ persist những field cần thiết
      partialize: (state) => ({
        users: state.users,
        statsCounts: state.statsCounts,
      }),
    }
  )
)