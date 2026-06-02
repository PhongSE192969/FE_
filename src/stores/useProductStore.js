import { create } from "zustand";

import {
  GetAllCategories,
  SearchProducts,
  getPaginatedProducts,
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  uploadImages as uploadImagesApi,
  DeleteProduct as deleteProductApi,
} from "@/services/productService";

const extractData = (res) => {
  return res?.data?.data || res?.data || res;
};

const extractPage = (res) => {
  const data = extractData(res);

  return {
    content: Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [],
    totalPages: data?.totalPages ?? 1,
    totalElements: data?.totalElements ?? 0,
    page: data?.number ?? data?.page ?? 0,
    size: data?.size ?? 10,
  };
};

const hasSearchOrFilter = (params = {}) => {
  return Boolean(
    params.keyword?.trim() ||
      (params.categoryName && params.categoryName !== "All") ||
      (params.status && params.status !== "All") ||
      (params.packageUnit && params.packageUnit !== "All") ||
      (params.fromPrice !== "" && params.fromPrice != null) ||
      (params.toPrice !== "" && params.toPrice != null)
  );
};

const buildSearchParams = (params = {}) => {
  return {
    keyword: params.keyword?.trim() || undefined,

    categoryName:
      params.categoryName && params.categoryName !== "All"
        ? params.categoryName
        : undefined,

    status:
      params.status && params.status !== "All"
        ? String(params.status).toUpperCase()
        : undefined,

    packageUnit:
      params.packageUnit && params.packageUnit !== "All"
        ? String(params.packageUnit).toUpperCase()
        : undefined,

    fromPrice:
      params.fromPrice !== "" && params.fromPrice != null
        ? Number(params.fromPrice)
        : undefined,

    toPrice:
      params.toPrice !== "" && params.toPrice != null
        ? Number(params.toPrice)
        : undefined,

    // Quan trọng:
    // Truyền page UI 1-based xuống productService.
    // productService.js sẽ tự đổi sang backend 0-based.
    page: params.page || 1,

    sizePage: params.sizePage || 10,
    sortBy: params.sortBy || "name",
    sortDir: params.sortDir || "asc",
  };
};

const calculateStats = (products = [], totalElements = 0) => {
  const activeCount = products.filter((product) => product.status === "ACTIVE")
    .length;

  const outOfStockCount = products.filter((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];

    return (
      variants.length === 0 ||
      variants.every((variant) => variant.status && variant.status !== "ACTIVE")
    );
  }).length;

  return {
    totalElements: totalElements || products.length || 0,
    active: activeCount,
    outOfStock: outOfStockCount,
  };
};

export const useProductStore = create((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  totalPages: 1,
  totalElements: 0,
  currentPage: 1,
  lastFetchParams: {
    page: 1,
    sizePage: 10,
    sortBy: "name",
    sortDir: "asc",
  },

  statsCounts: {
    totalElements: 0,
    active: 0,
    outOfStock: 0,
  },

  fetchCategoriesList: async () => {
    try {
      const res = await GetAllCategories();
      const data = extractData(res);

      set({
        categories: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      console.error("Fetch categories failed:", error);
      set({ categories: [] });
    }
  },

  fetchProductsList: async (params = {}) => {
    set({ isLoading: true });

    try {
      const page = params.page || 1;
      const sizePage = params.sizePage || 10;

      const finalParams = {
        ...params,
        page,
        sizePage,
      };

      let res;

      if (hasSearchOrFilter(finalParams)) {
        const cleanParams = buildSearchParams(finalParams);
        res = await SearchProducts(cleanParams);
      } else {
        // getPaginatedProducts nhận backend page 0-based
        res = await getPaginatedProducts(page - 1);
      }

      const pageData = extractPage(res);
      const content = pageData.content;
      const totalElements = pageData.totalElements || content.length || 0;

      set({
        products: content,
        totalPages: pageData.totalPages || 1,
        totalElements,
        currentPage: page,
        lastFetchParams: finalParams,
        statsCounts: calculateStats(content, totalElements),
      });
    } catch (error) {
      console.error("Fetch products failed:", error);

      set({
        products: [],
        totalPages: 1,
        totalElements: 0,
        statsCounts: {
          totalElements: 0,
          active: 0,
          outOfStock: 0,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  createProduct: async (payload) => {
    set({ isLoading: true });

    try {
      const res = await createProductApi(payload);

      await get().fetchProductsList({
        ...get().lastFetchParams,
        page: 1,
      });

      return res;
    } catch (error) {
      console.error("Create product failed:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProduct: async (id, payload) => {
    set({ isLoading: true });

    try {
      const res = await updateProductApi(id, payload);

      await get().fetchProductsList({
        ...get().lastFetchParams,
        page: get().currentPage || 1,
      });

      return res;
    } catch (error) {
      console.error("Update product failed:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true });

    try {
      const res = await deleteProductApi(id);

      await get().fetchProductsList({
        ...get().lastFetchParams,
        page: get().currentPage || 1,
      });

      return res;
    } catch (error) {
      console.error("Delete product failed:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  uploadImages: async (files) => {
    try {
      const res = await uploadImagesApi(files);
      return extractData(res);
    } catch (error) {
      console.error("Upload images failed:", error);
      throw error;
    }
  },
}));