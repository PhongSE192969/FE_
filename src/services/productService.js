import { productApi } from "@/config/api";
import { apiCall, ENDPOINTS } from "@/config/api.js";
import { HTTP_METHODS } from "@/constraints/index.js";

const PRODUCTS = ENDPOINTS.PROTECTED.PRODUCTS;

const extractData = (res) => {
  return res?.data?.data || res?.data || res;
};

const extractPageData = (res) => {
  return extractData(res);
};

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

const resolveEndpoint = (endpoint, ...args) => {
  return typeof endpoint === "function" ? endpoint(...args) : endpoint;
};

const appendIdIfNeeded = (endpoint, id) => {
  const raw = resolveEndpoint(endpoint, id);

  if (!id) return raw;
  if (String(raw).includes(String(id))) return raw;

  return `${raw}/${id}`;
};

const toNumberOrNull = (value) => {
  if (value === "" || value == null) return null;

  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const toNumberOrZero = (value) => {
  if (value === "" || value == null) return 0;

  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
};

const normalizeImageUrls = (variant = {}) => {
  if (Array.isArray(variant.imageUrls)) {
    return variant.imageUrls.filter(Boolean);
  }

  if (variant.imageUrl) {
    return [variant.imageUrl];
  }

  if (variant.images && typeof variant.images === "object") {
    return Object.values(variant.images).filter(Boolean);
  }

  return [];
};

const normalizeVariantPayload = (variant = {}, isUpdate = false) => {
  const sellingPrice = toNumberOrZero(
    variant.sellingPrice ?? variant.price
  );

  const salePrice =
    variant.salePrice === "" || variant.salePrice == null
      ? sellingPrice
      : toNumberOrZero(variant.salePrice);

  const packageSize = toNumberOrNull(variant.packageSize);

  const normalized = {
    sku: variant.sku || `SKU_${Date.now()}`,
    variantName:
      variant.variantName ||
      (packageSize && variant.packageUnit
        ? `${packageSize} ${variant.packageUnit}`
        : "Default variant"),
    packageSize,
    packageUnit: String(variant.packageUnit || "KG").toUpperCase(),
    importPrice: toNumberOrZero(variant.importPrice),
    sellingPrice,
    salePrice,
    imageUrls: normalizeImageUrls(variant),
  };

  if (isUpdate && variant.id) {
    normalized.id = variant.id;
  }

  if (isUpdate && variant.status) {
    normalized.status = variant.status;
  }

  return normalized;
};

const normalizeProductPayload = (payload = {}, isUpdate = false) => {
  const variants = Array.isArray(payload.variants) ? payload.variants : [];

  const normalized = {
    name: payload.name?.trim() || "",
    description: payload.description?.trim() || "No description",
    categoryId: payload.categoryId || payload.category?.id || null,
    brand: payload.brand?.trim() || "No Brand",
    variants: variants.map((variant) =>
      normalizeVariantPayload(variant, isUpdate)
    ),
  };

  if (isUpdate) {
    if (payload.productType) normalized.productType = payload.productType;
    if (payload.unit) normalized.unit = payload.unit;
    if (payload.status) normalized.status = payload.status;
  }

  return normalized;
};

const normalizeSearchParams = (payload = {}) => {
  const status =
    payload.status && payload.status !== "All" && payload.status !== "ALL"
      ? String(payload.status).toUpperCase()
      : undefined;

  const packageUnit =
    payload.packageUnit &&
    payload.packageUnit !== "All" &&
    payload.packageUnit !== "ALL"
      ? String(payload.packageUnit).toUpperCase()
      : undefined;

  return {
    keyword: payload.keyword?.trim() || undefined,
    categoryName:
      payload.categoryName &&
      payload.categoryName !== "All" &&
      payload.categoryName !== "ALL"
        ? payload.categoryName.trim()
        : undefined,
    status,
    packageUnit,
    fromPrice:
      payload.fromPrice !== "" && payload.fromPrice != null
        ? payload.fromPrice
        : undefined,
    toPrice:
      payload.toPrice !== "" && payload.toPrice != null
        ? payload.toPrice
        : undefined,
    page: payload.page != null ? Math.max(Number(payload.page) - 1, 0) : 0,
    sizePage: payload.sizePage ?? 10,
    sortBy: payload.sortBy || "name",
    sortDir: payload.sortDir || "asc",
  };
};

export const getAllProducts = async () => {
  const res = await productApi.getAllProducts();
  const data = extractData(res);

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : [];

  return list.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    brand: product.brand,
    status: product.status,
    category: product.category,
    categoryId: product.category?.id,
    categoryName: product.category?.name,
    variants: product.variants || [],
  }));
};

export const getProducts = async () => {
  try {
    const endpoint = PRODUCTS.getAll || PRODUCTS.list;
    const res = await apiCall(HTTP_METHODS.GET, endpoint, null, {
      params: { page: 0 },
    });

    return res;
  } catch (error) {
    console.error("Get all product error:", error);
    throw new Error(getErrorMessage(error, "Failed to load products"));
  }
};

export const GetAllCategories = async () => {
  try {
    const response = await apiCall(
      HTTP_METHODS.GET,
      PRODUCTS.categoryGetAll
    );

    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load categories"));
  }
};

export const SearchProducts = async (payload = {}) => {
  try {
    const params = normalizeSearchParams(payload);

    const response = await apiCall(
      HTTP_METHODS.GET,
      PRODUCTS.search,
      null,
      { params }
    );

    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to search products"));
  }
};

export const SearchProductsByIds = async (ids) => {
  try {
    const response = await apiCall(
      HTTP_METHODS.POST,
      "/products/search-by-ids",
      ids
    );

    return extractData(response);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to search products by ids")
    );
  }
};

export const getProductDetail = async (id) => {
  try {
    const endpoint = resolveEndpoint(PRODUCTS.detail, id);

    const response = await apiCall(
      HTTP_METHODS.GET,
      endpoint
    );

    return extractData(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to get product detail"));
  }
};

export const createProduct = async (payload) => {
  try {
    const normalizedPayload = normalizeProductPayload(payload, false);

    const response = await apiCall(
      HTTP_METHODS.POST,
      PRODUCTS.create,
      normalizedPayload
    );

    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Create product failed"));
  }
};

export const updateProduct = async (id, payload) => {
  try {
    const normalizedPayload = normalizeProductPayload(payload, true);
    const endpoint = appendIdIfNeeded(PRODUCTS.update, id);

    const response = await apiCall(
      HTTP_METHODS.PUT,
      endpoint,
      normalizedPayload
    );

    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Update product failed"));
  }
};

export const DeleteProduct = async (id) => {
  try {
    const endpoint = resolveEndpoint(PRODUCTS.delete, id);

    const response = await apiCall(
      HTTP_METHODS.DELETE,
      endpoint
    );

    return response;
  } catch (error) {
    console.log("DELETE ERROR STATUS:", error.response?.status);
    console.log("DELETE ERROR DATA:", error.response?.data);
    throw new Error(getErrorMessage(error, "Delete product failed"));
  }
};

export const deleteVariant = async (productId, variantId) => {
  try {
    const baseEndpoint = resolveEndpoint(PRODUCTS.deleteVariant);

    const endpoint = String(baseEndpoint).includes("inactive-variant")
      ? resolveEndpoint(PRODUCTS.deleteVariant, productId, variantId)
      : `${baseEndpoint}/${productId}/inactive-variant/${variantId}`;

    const response = await apiCall(
      HTTP_METHODS.DELETE,
      endpoint
    );

    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Delete variant failed"));
  }
};

export const uploadImages = async (files) => {
  try {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await apiCall(
      HTTP_METHODS.POST,
      PRODUCTS.upload,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return extractData(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Upload failed"));
  }
};

export const getPaginatedProducts = async (page = 0) => {
  try {
    const response = await apiCall(
      HTTP_METHODS.GET,
      PRODUCTS.list,
      null,
      { params: { page } }
    );

    return extractPageData(response);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to get paginated products")
    );
  }
};

export const getProductsByFranchise = async (locationId, payload = {}) => {
  try {
    const params = normalizeSearchParams(payload);

    const response = await apiCall(
      HTTP_METHODS.GET,
      `/products/franchise/${locationId}`,
      null,
      { params }
    );

    return extractPageData(response);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to get products by franchise")
    );
  }
};

export const filterProductsByCustomer = async (params = {}) => {
  try {
    const response = await apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PUBLIC.filterProduct,
      null,
      { params }
    );

    return extractPageData(response);
  } catch (error) {
    console.error("Filter products error:", error);
    throw error;
  }
};