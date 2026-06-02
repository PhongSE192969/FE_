import { apiCall } from "@/config/api";
import { HTTP_METHODS } from "@/constraints/index.js";

export const PAYMENT_ENDPOINTS = {
  init: "/payments/init",
  getMethods: "/payments/get-method",
  checkStatus: (orderId) => `/payments/status/${orderId}`,
  getTransaction: (orderId) => `/payments/${orderId}/get-transaction`,

  // BE hiện tại chưa có endpoint này.
  // Giữ lại constant để tránh code cũ bị gãy import, nhưng không gọi cứng.
  getPayUrl: (orderId) => `/payments/pay-url/${orderId}`,
};

export const PAYMENT_METHOD = {
  MOMO: "MOMO",
  VNPAY: "VNPAY",
  COD: "COD",
};

export const PAYMENT_STATUS = {
  CREATED: "CREATED",
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  REFUNDED: "REFUNDED",
};

export const PAYMENT_STATUS_LABELS = {
  CREATED: "Đã tạo giao dịch",
  PENDING: "Đang chờ thanh toán",
  SUCCESS: "Thanh toán thành công",
  FAILED: "Thanh toán thất bại",
  CANCELLED: "Đã hủy thanh toán",
  EXPIRED: "Giao dịch hết hạn",
  REFUNDED: "Đã hoàn tiền",
};

export const PAYMENT_METHOD_LABELS = {
  MOMO: "MoMo",
  VNPAY: "VNPay",
  COD: "Thanh toán khi nhận hàng",
};

export const extractPaymentResponseData = (response) => {
  return response?.data?.data || response?.data || response;
};

export const normalizePaymentMethodName = (methodName) => {
  if (!methodName) return "";

  const value = String(methodName).trim().toUpperCase();

  if (value === "MOMO") return PAYMENT_METHOD.MOMO;
  if (value === "VNPAY") return PAYMENT_METHOD.VNPAY;
  if (value === "COD") return PAYMENT_METHOD.COD;
  if (value === "TIỀN MẶT" || value === "TIEN MAT" || value === "CASH") {
    return PAYMENT_METHOD.COD;
  }

  return value;
};

export const normalizePaymentStatus = (status) => {
  if (!status) return null;

  const value = String(status).trim().toUpperCase();

  const legacyMap = {
    PAID: PAYMENT_STATUS.SUCCESS,
    SUCCESSFUL: PAYMENT_STATUS.SUCCESS,
    FAIL: PAYMENT_STATUS.FAILED,
    CANCELED: PAYMENT_STATUS.CANCELLED,
  };

  return legacyMap[value] || value;
};

export const getPaymentStatusLabel = (status) => {
  const normalized = normalizePaymentStatus(status);
  return PAYMENT_STATUS_LABELS[normalized] || normalized || "N/A";
};

export const getPaymentMethodLabel = (methodName) => {
  const normalized = normalizePaymentMethodName(methodName);
  return PAYMENT_METHOD_LABELS[normalized] || normalized || "N/A";
};

export const isOnlinePaymentMethod = (methodName) => {
  const normalized = normalizePaymentMethodName(methodName);
  return normalized === PAYMENT_METHOD.MOMO || normalized === PAYMENT_METHOD.VNPAY;
};

export const isCodPaymentMethod = (methodName) => {
  return normalizePaymentMethodName(methodName) === PAYMENT_METHOD.COD;
};

export const isPaymentSuccess = (status) => {
  return normalizePaymentStatus(status) === PAYMENT_STATUS.SUCCESS;
};

export const isPaymentFinal = (status) => {
  const normalized = normalizePaymentStatus(status);

  return [
    PAYMENT_STATUS.SUCCESS,
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.CANCELLED,
    PAYMENT_STATUS.EXPIRED,
    PAYMENT_STATUS.REFUNDED,
  ].includes(normalized);
};

export const normalizePaymentMethod = (method = {}) => {
  const methodName = normalizePaymentMethodName(method.methodName);

  return {
    ...method,
    methodName,
    label: getPaymentMethodLabel(methodName),
    active: Boolean(method.active),
  };
};

export const normalizePaymentMethodsResponse = (response) => {
  const data = extractPaymentResponseData(response);

  if (!Array.isArray(data)) return [];

  return data.map(normalizePaymentMethod);
};

export const normalizePaymentTransaction = (transaction = {}) => {
  const methodName =
    transaction.paymentMethodName ||
    transaction.paymentMethodResponse?.methodName ||
    transaction.method ||
    "";

  return {
    ...transaction,
    status: normalizePaymentStatus(transaction.status),
    paymentMethodName: normalizePaymentMethodName(methodName),
    paymentMethodLabel: getPaymentMethodLabel(methodName),
  };
};

/**
 * Chọn phương thức thanh toán và tạo QR / payUrl.
 *
 * Payload BE cần:
 * {
 *   orderId: UUID,
 *   paymentMethodId: UUID
 * }
 */
export const optionPaymentMethod = async (data = {}) => {
  try {
    const payload = {
      orderId: data.orderId,
      paymentMethodId: data.paymentMethodId,
    };

    return await apiCall(HTTP_METHODS.POST, PAYMENT_ENDPOINTS.init, payload);
  } catch (error) {
    console.error("Option payment method error:", error);
    throw error;
  }
};

/**
 * Alias để code cũ hoặc code mới đều gọi được.
 */
export const initPayment = optionPaymentMethod;

/**
 * Lấy danh sách payment method khả dụng.
 *
 * BE trả:
 * {
 *   message,
 *   data: [{ id, methodName, provider, active }],
 *   statusCode
 * }
 *
 * Hàm này giữ nguyên ApiResponse để component cũ dùng res.data không bị lỗi.
 */
export const getPaymentMethods = async () => {
  try {
    return await apiCall(HTTP_METHODS.GET, PAYMENT_ENDPOINTS.getMethods);
  } catch (error) {
    console.error("Get payment methods error:", error);
    throw error;
  }
};

/**
 * Lấy danh sách payment method đã normalize.
 * Dùng cho component mới nếu muốn nhận thẳng array.
 */
export const getNormalizedPaymentMethods = async () => {
  const response = await getPaymentMethods();
  return normalizePaymentMethodsResponse(response);
};

/**
 * Kiểm tra trạng thái giao dịch theo orderId.
 *
 * BE trả data là enum:
 * CREATED | PENDING | SUCCESS | FAILED | CANCELLED | EXPIRED | REFUNDED
 */
export const checkPaymentStatus = async (orderId) => {
  try {
    return await apiCall(
      HTTP_METHODS.GET,
      PAYMENT_ENDPOINTS.checkStatus(orderId)
    );
  } catch (error) {
    console.error("Check payment status error:", error);
    throw error;
  }
};

/**
 * Lấy trạng thái đã normalize.
 */
export const getNormalizedPaymentStatus = async (orderId) => {
  const response = await checkPaymentStatus(orderId);
  const data = extractPaymentResponseData(response);

  return normalizePaymentStatus(data);
};

/**
 * Lấy chi tiết giao dịch theo orderId.
 *
 * BE trả:
 * {
 *   id,
 *   userId,
 *   orderId,
 *   amount,
 *   status,
 *   transactionRef,
 *   createdAt,
 *   paymentMethodResponse,
 *   paymentMethodName
 * }
 */
export const getPaymentTransaction = async (orderId) => {
  try {
    return await apiCall(
      HTTP_METHODS.GET,
      PAYMENT_ENDPOINTS.getTransaction(orderId)
    );
  } catch (error) {
    console.error("Get payment transaction error:", error);
    throw error;
  }
};

/**
 * Lấy transaction đã normalize.
 */
export const getNormalizedPaymentTransaction = async (orderId) => {
  const response = await getPaymentTransaction(orderId);
  const data = extractPaymentResponseData(response);

  if (!data) return null;

  return normalizePaymentTransaction(data);
};

/**
 * FE cũ có gọi getPaymentUrl(orderId), nhưng BE hiện tại chưa có endpoint pay-url.
 *
 * Vì vậy hàm này KHÔNG gọi API cứng để tránh lỗi 404.
 * PayUrl thật đã được trả ngay sau createOrder/init payment qua paymentUrl.
 */
export const getPaymentUrl = async () => {
  return {
    message: "Payment URL endpoint is not available in current backend",
    data: null,
    statusCode: 200,
    errors: null,
  };
};

export default {
  PAYMENT_ENDPOINTS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,

  extractPaymentResponseData,
  normalizePaymentMethodName,
  normalizePaymentStatus,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  isOnlinePaymentMethod,
  isCodPaymentMethod,
  isPaymentSuccess,
  isPaymentFinal,
  normalizePaymentMethod,
  normalizePaymentMethodsResponse,
  normalizePaymentTransaction,

  optionPaymentMethod,
  initPayment,
  getPaymentMethods,
  getNormalizedPaymentMethods,
  checkPaymentStatus,
  getNormalizedPaymentStatus,
  getPaymentTransaction,
  getNormalizedPaymentTransaction,
  getPaymentUrl,
};