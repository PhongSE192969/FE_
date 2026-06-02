import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useLanguageStore = create(
  persist(
    (set) => ({
      language: "vi", // Mặc định là Tiếng Việt ('vi' | 'en' | 'jp')
      
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "capital-coffee-language", // Tên key lưu trong localStorage
    }
  )
);
