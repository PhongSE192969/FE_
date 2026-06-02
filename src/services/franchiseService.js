import { apiCall, ENDPOINTS } from "@/config/api";
import { HTTP_METHODS } from "@/constraints";

const unwrapResponse = (res) => {
  return res?.data?.data || res?.data || res;
};

const normalizeList = (res) => {
  const data = unwrapResponse(res);
  return Array.isArray(data) ? data : [];
};

const getErrorMessage = (error, fallback = "Franchise request failed") => {
  return error?.response?.data?.message || error?.message || fallback;
};

// ===============================
// FRANCHISE READ API
// ===============================

// GET /api/franchises
export const getFranchises = async () => {
  try {
    const res = await apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.FRANCHISE.list
    );

    return unwrapResponse(res);
  } catch (error) {
    console.error("Get franchises error:", error);
    throw new Error(getErrorMessage(error, "Failed to load franchises"));
  }
};

// GET /api/franchises/get-all
export const getAllFranchises = async () => {
  try {
    const res = await apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.FRANCHISE.getAll
    );

    return unwrapResponse(res);
  } catch (error) {
    console.error("Get all franchises error:", error);
    throw new Error(getErrorMessage(error, "Failed to load all franchises"));
  }
};

// GET /api/franchises/get-active
export const getActiveFranchises = async () => {
  try {
    const res = await apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.FRANCHISE.getActive
    );

    return normalizeList(res);
  } catch (error) {
    console.error("Get active franchises error:", error);
    throw new Error(getErrorMessage(error, "Failed to load active franchises"));
  }
};

// GET /api/franchises/status/{status}
export const getFranchisesByStatus = async (status) => {
  try {
    const res = await apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.FRANCHISE.byStatus(status)
    );

    return unwrapResponse(res);
  } catch (error) {
    console.error("Get franchises by status error:", error);
    throw new Error(
      getErrorMessage(error, "Failed to load franchises by status")
    );
  }
};

// GET /api/franchises/{id}
export const getFranchiseById = async (id) => {
  try {
    const res = await apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.FRANCHISE.detail(id)
    );

    return unwrapResponse(res);
  } catch (error) {
    console.error("Get franchise by id error:", error);
    throw new Error(getErrorMessage(error, "Failed to load franchise detail"));
  }
};

// ===============================
// FRANCHISE WRITE API
// ===============================

// POST /api/franchises
export const createFranchise = async (payload) => {
  try {
    const res = await apiCall(
      HTTP_METHODS.POST,
      ENDPOINTS.PROTECTED.FRANCHISE.create,
      payload
    );

    return unwrapResponse(res);
  } catch (error) {
    console.error("Create franchise error:", error);
    throw new Error(getErrorMessage(error, "Failed to create franchise"));
  }
};

// PUT /api/franchises/{id}
export const updateFranchise = async (id, payload) => {
  try {
    const res = await apiCall(
      HTTP_METHODS.PUT,
      ENDPOINTS.PROTECTED.FRANCHISE.update(id),
      payload
    );

    return unwrapResponse(res);
  } catch (error) {
    console.error("Update franchise error:", error);
    throw new Error(getErrorMessage(error, "Failed to update franchise"));
  }
};

// DELETE /api/franchises/{id}
export const deleteFranchise = async (id) => {
  try {
    const res = await apiCall(
      HTTP_METHODS.DELETE,
      ENDPOINTS.PROTECTED.FRANCHISE.delete(id)
    );

    return unwrapResponse(res);
  } catch (error) {
    console.error("Delete franchise error:", error);
    throw new Error(getErrorMessage(error, "Failed to delete franchise"));
  }
};

// PATCH /api/franchises/{id}/status
export const updateFranchiseStatus = async (id, status) => {
  try {
    const res = await apiCall(
      HTTP_METHODS.PATCH,
      ENDPOINTS.PROTECTED.FRANCHISE.status(id),
      `"${status}"`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return unwrapResponse(res);
  } catch (error) {
    console.error("Update franchise status error:", error);
    throw new Error(
      getErrorMessage(error, "Failed to update franchise status")
    );
  }
};

// ===============================
// BACKWARD COMPATIBILITY EXPORTS
// Giữ tên cũ để các page đang import không bị lỗi.
// Sau này có thể đổi dần sang camelCase.
// ===============================

export const GetAllFranchises = getAllFranchises;
export const GetFranchiseActive = getActiveFranchises;