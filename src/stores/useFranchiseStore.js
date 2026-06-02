import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFranchiseStore = create(
  persist(
    (set) => ({
      selectedFranchiseId: null,
      selectedFranchiseName: "",

      setFranchise: (id, name) => {
        set({
          selectedFranchiseId: id,
          selectedFranchiseName: name,
        });
      },

      clearFranchise: () => {
        set({
          selectedFranchiseId: null,
          selectedFranchiseName: "",
        });
      },
    }),
    {
      name: "capital-coffee-franchise",
      partialize: (state) => ({
        selectedFranchiseId: state.selectedFranchiseId,
        selectedFranchiseName: state.selectedFranchiseName,
      }),
    }
  )
);
