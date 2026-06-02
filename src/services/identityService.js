// src/services/identityService.js
import { publicAxiosClient, axiosClient } from "@/config/axiosClient";

/**
 * Helper lấy message lỗi thống nhất.
 */
const getErrorMessage = (error, fallback = "Request failed") => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

/**
 * Helper unwrap response backend.
 * Backend thường trả:
 * {
 *   statusCode,
 *   message,
 *   data
 * }
 */
const unwrap = (res) => res.data;

// ===============================
// AUTH / FIREBASE SYNC API
// ===============================

export const SyncFirebaseUser = async () => {
  try {
    const res = await axiosClient.post("/auth/sync-user");
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to sync Firebase user"));
  }
};

export const GetMe = async () => {
  try {
    const res = await axiosClient.get("/auth/me");
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to get current user"));
  }
};

export const GetProfile = async () => {
  try {
    const res = await axiosClient.get("/auth/users/profile");
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to get user profile"));
  }
};

export const UpdateProfile = async (payload) => {
  try {
    const res = await axiosClient.put("/auth/users/update-profile", payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update profile"));
  }
};

// Giữ lại nếu FE cũ còn gọi verify.
// Nếu backend hiện tại không còn /auth/verify thì không dùng hàm này.
export const Verify = async (payload) => {
  try {
    const res = await publicAxiosClient.post("/auth/verify", payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Verification failed"));
  }
};

// ===============================
// USERS API
// ===============================

export const GetUsers = async (page = 0) => {
  try {
    const res = await axiosClient.get("/auth/users", {
      params: { page },
    });
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load users"));
  }
};

export const SearchUsers = async (params = {}) => {
  try {
    const cleanParams = {
      keyword: params.keyword || undefined,
      role: params.role || undefined,
      status: params.status || undefined,
      gender:
        typeof params.gender === "boolean"
          ? params.gender
          : undefined,
      franchiseId: params.franchiseId || undefined,
      page: params.page ?? 0,
      size: params.size ?? 10,
      sortBy: params.sortBy || "lastLogin",
      sortDir: params.sortDir || "desc",
    };

    const res = await axiosClient.get("/auth/users/search", {
      params: cleanParams,
    });

    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to search users"));
  }
};

export const GetUserById = async (userId) => {
  try {
    const res = await axiosClient.get(`/auth/users/${userId}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to get user detail"));
  }
};

export const CreateUser = async (payload) => {
  try {
    const res = await axiosClient.post("/auth/users", payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to create user"));
  }
};

export const UpdateUser = async (userId, payload) => {
  try {
    const res = await axiosClient.put(`/auth/users/${userId}/update`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update user"));
  }
};

export const UpdateUserStatus = async (userId, status) => {
  try {
    const res = await axiosClient.put(`/auth/users/${userId}/update-status`, null, {
      params: { status },
    });

    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update user status"));
  }
};

/**
 * API mới:
 * ADMIN gán role + franchiseId cho MANAGER/STAFF.
 *
 * PUT /auth/users/{userId}/assign-role?roleName=MANAGER&franchiseId=...
 */
export const AssignRoleAndFranchise = async (userId, roleName, franchiseId) => {
  try {
    const res = await axiosClient.put(`/auth/users/${userId}/assign-role`, null, {
      params: {
        roleName,
        franchiseId,
      },
    });

    return unwrap(res);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to assign role and franchise"),
    );
  }
};

// Alias nếu page cũ đang gọi AssignRole
export const AssignRole = AssignRoleAndFranchise;

export const DeleteUser = async (userId) => {
  try {
    const res = await axiosClient.put(`/auth/users/delete-account/${userId}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete user"));
  }
};

export const GetStaffByFranchise = async (franchiseId, page = 0) => {
  try {
    const res = await axiosClient.get("/auth/users/franchise/staff", {
      params: {
        franchiseId,
        page,
      },
    });

    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load franchise staff"));
  }
};

export const GetUsersByIds = async (ids = []) => {
  try {
    const res = await axiosClient.post("/auth/users/bulk", ids);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch users by ids"));
  }
};

// ===============================
// WALK-IN / CUSTOMER USER
// ===============================

export const createOrFindWalkInUser = async (payload) => {
  try {
    const res = await axiosClient.post("/auth/users", {
      username:
        payload.username ||
        payload.email?.split("@")?.[0] ||
        `walkin_${Date.now()}`,
      fullName: payload.fullName || payload.name || "Walk-in Customer",
      email: payload.email,
      phone: payload.phone,
      gender: payload.gender ?? false,
      roleName: "CUSTOMER",
      franchiseId: null,
    });

    if (res.data?.data?.userResponse) {
      return {
        ...res.data,
        data: res.data.data.userResponse,
      };
    }

    return unwrap(res);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to create or find user profile"),
    );
  }
};

// ===============================
// ROLES API
// ===============================

export const GetRoles = async () => {
  try {
    const res = await axiosClient.get("/auth/roles");
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load roles"));
  }
};

export const GetRoleById = async (roleId) => {
  try {
    const res = await axiosClient.get(`/auth/roles/${roleId}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load role"));
  }
};

export const GetRoleByName = async (roleName) => {
  try {
    const res = await axiosClient.get(`/auth/roles/search/${roleName}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load role by name"));
  }
};

export const CreateRole = async (payload) => {
  try {
    const res = await axiosClient.post("/auth/roles", payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to create role"));
  }
};

export const UpdateRole = async (roleId, payload) => {
  try {
    const res = await axiosClient.put(`/auth/roles/${roleId}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update role"));
  }
};

export const DeleteRole = async (roleId) => {
  try {
    const res = await axiosClient.delete(`/auth/roles/${roleId}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete role"));
  }
};

export const AssignPermissionsToRole = async (roleId, payload) => {
  try {
    const res = await axiosClient.put(
      `/auth/roles/${roleId}/permissions`,
      payload,
    );
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to assign permissions"));
  }
};

// ===============================
// PERMISSIONS API
// ===============================

export const GetPermissions = async () => {
  try {
    const res = await axiosClient.get("/auth/permissions");
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load permissions"));
  }
};

export const CreatePermission = async (payload) => {
  try {
    const res = await axiosClient.post("/auth/permissions", payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to create permission"));
  }
};

export const UpdatePermission = async (permissionId, payload) => {
  try {
    const res = await axiosClient.put(
      `/auth/permissions/${permissionId}`,
      payload,
    );
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update permission"));
  }
};

export const DeletePermission = async (permissionId) => {
  try {
    const res = await axiosClient.delete(`/auth/permissions/${permissionId}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete permission"));
  }
};