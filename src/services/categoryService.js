import { apiCall } from "@/config/api";
import { ENDPOINTS } from "@/config/api";

/**
 * ============================
 * GET ALL
 * ============================
 */
export const getCategories = async () => {
  try {
    const endpoint = ENDPOINTS.PROTECTED.PRODUCTS.categoryGetAll;

    const res = await apiCall("GET", endpoint);

    const data = res?.data?.data || res?.data || res;

    if (!Array.isArray(data)) return [];

    return data.map((c) => ({
      ...c,
      description: c.description || "",
      productCount: c.productCount ?? 0,
      status: c.status ?? "INACTIVE", // 🔥 FIX
      lastUpdated: c.lastUpdated || c.updatedAt || c.createdAt || null,
    }));

  } catch (error) {
    console.error("Get categories error:", error);
    throw error;
  }
};

/**
 * ============================
 * CREATE
 * ============================
 */
export const createCategory = async (data) => {
  try {
    const endpoint = ENDPOINTS.PROTECTED.PRODUCTS.categories;

    const payload = {
      name: data.name?.trim(),
      description: data.description?.trim() || "",
    };

    const res = await apiCall("POST", endpoint, payload);

    return res?.data?.data || res?.data || res;

  } catch (error) {
    console.error("Create category error:", error);
    throw error;
  }
};

/**
 * ============================
 * UPDATE
 * ============================
 */
export const updateCategory = async (id, data) => {
  try {
    const endpoint = ENDPOINTS.PROTECTED.PRODUCTS.categoryUpdate(id);

    const payload = {
      name: data.name?.trim(),
      description: data.description?.trim() || "",
      ...(data.status && { status: data.status.toUpperCase() }),
    };

    const res = await apiCall("PUT", endpoint, payload);

    return res?.data?.data || res?.data || res;

  } catch (error) {
    console.error("Update category error:", error);
    throw error;
  }
};

/**
 * ============================
 * DELETE (SOFT DELETE)
 * ============================
 */
export const deleteCategory = async (id) => {
  try {
    const endpoint = ENDPOINTS.PROTECTED.PRODUCTS.categoryDelete(id);

    await apiCall("DELETE", endpoint);

    return true;

  } catch (error) {
    console.error("Delete category error:", error);
    throw error;
  }
};

/* ============================
   SERVICE
============================ */

export const categoryService = {
  getAll: getCategories,
};

// backward compatible
export const getAllCategories = getCategories;