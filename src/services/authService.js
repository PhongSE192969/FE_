// src/services/authService.js
import { apiCall, ENDPOINTS } from "@/config/api";
import { HTTP_METHODS } from "@/constraints/index.js";

const extractData = (res) => {
  return res?.data?.data || res?.data || res;
};

const getSyncUserEndpoint = () => {
  return ENDPOINTS?.PUBLIC?.syncUser || "/auth/sync-user";
};

const getMeEndpoint = () => {
  return ENDPOINTS?.PUBLIC?.me || "/auth/me";
};

/**
 * Sync Firebase user với backend.
 *
 * Backend hiện tại:
 * POST /api/auth/sync-user
 *
 * Backend đang đọc user từ Authorization Bearer Firebase ID token.
 */
export const SyncFirebaseUser = async (firebaseIdToken, profileData = null) => {
  try {
    if (!firebaseIdToken) {
      throw new Error("Missing Firebase ID token");
    }

    const res = await apiCall(
      HTTP_METHODS.POST,
      getSyncUserEndpoint(),
      profileData,
      {
        headers: {
          Authorization: `Bearer ${firebaseIdToken}`,
        },
      }
    );

    return extractData(res);
  } catch (error) {
    console.error("Sync Firebase user error:", error);
    throw error;
  }
};

/**
 * Lấy thông tin user hiện tại từ backend bằng Firebase token.
 *
 * Backend hiện tại:
 * GET /api/auth/me
 */
export const GetMe = async (firebaseIdToken) => {
  try {
    if (!firebaseIdToken) {
      throw new Error("Missing Firebase ID token");
    }

    const res = await apiCall(
      HTTP_METHODS.GET,
      getMeEndpoint(),
      null,
      {
        headers: {
          Authorization: `Bearer ${firebaseIdToken}`,
        },
      }
    );

    return extractData(res);
  } catch (error) {
    console.error("Get me error:", error);
    throw error;
  }
};

/**
 * Login mới dùng Firebase ID token.
 * Không gọi /auth/login cũ nữa.
 */
export const Login = async ({ idToken }) => {
  if (!idToken) {
    throw new Error("Missing Firebase ID token");
  }

  return await SyncFirebaseUser(idToken);
};

/**
 * Register mới:
 * 1. FE tạo user trên Firebase
 * 2. FE lấy Firebase ID token
 * 3. FE gọi backend sync-user
 *
 * Lưu ý:
 * Nếu backend chưa đọc body profileData thì các field như phone/gender/avatarUrl/roleName
 * chưa có tác dụng. Backend hiện tại thường tự sync CUSTOMER từ Firebase token.
 */
export const Register = async ({
  idToken,
  username,
  fullName,
  email,
  phone,
  gender,
  avatarUrl,
  roleName = "CUSTOMER",
}) => {
  if (!idToken) {
    throw new Error("Missing Firebase ID token");
  }

  const payload = {
    username,
    fullName,
    email,
    phone,
    gender,
    avatarUrl,
    roleName,
  };

  return await SyncFirebaseUser(idToken, payload);
};

export const Logout = async () => {
  return true;
};

/**
 * Flow cũ: giữ lại để tránh lỗi import ở page cũ.
 * Không nên dùng cho Firebase auth mới.
 */
export const Verify = async (payload) => {
  return await apiCall(HTTP_METHODS.POST, ENDPOINTS.PUBLIC.verify, payload);
};

export const ResendCode = async (payload) => {
  return await apiCall(HTTP_METHODS.POST, ENDPOINTS.PUBLIC.resendCode, payload);
};

export const ForgotPassword = async (payload) => {
  return await apiCall(
    HTTP_METHODS.POST,
    ENDPOINTS.PUBLIC.forgotPassword,
    payload
  );
};

export const ConfirmForgotPassword = async (payload) => {
  return await apiCall(
    HTTP_METHODS.POST,
    ENDPOINTS.PUBLIC.confirmForgotPassword,
    payload
  );
};

// Alias để tránh vỡ import cũ bị typo
export const ConfirmForrgotPassword = ConfirmForgotPassword;