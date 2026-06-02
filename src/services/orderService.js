import { orderApi } from "@/config/api";

export const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAID: "PAID",
  WAITING_FOR_CONFIRMATION: "WAITING_FOR_CONFIRMATION",
  PREPARING: "PREPARING",
  SHIPPING: "SHIPPING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

export const TYPE_ORDER = {
  ONLINE: "ONLINE",
  POS: "POS",
};

export const FINAL_ORDER_STATUSES = new Set([
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.FAILED,
  ORDER_STATUS.REFUNDED,
]);

export const STATUS_LABELS = {
  PENDING_PAYMENT: "Chờ tạo thanh toán",
  PAYMENT_PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  WAITING_FOR_CONFIRMATION: "Chờ xác nhận",
  PREPARING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn tiền",
};

export const TYPE_ORDER_LABELS = {
  ONLINE: "Online",
  POS: "Tại quầy",
};

export const ORDER_STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: ORDER_STATUS.PENDING_PAYMENT, label: STATUS_LABELS.PENDING_PAYMENT },
  { value: ORDER_STATUS.PAYMENT_PENDING, label: STATUS_LABELS.PAYMENT_PENDING },
  { value: ORDER_STATUS.PAID, label: STATUS_LABELS.PAID },
  {
    value: ORDER_STATUS.WAITING_FOR_CONFIRMATION,
    label: STATUS_LABELS.WAITING_FOR_CONFIRMATION,
  },
  { value: ORDER_STATUS.PREPARING, label: STATUS_LABELS.PREPARING },
  { value: ORDER_STATUS.SHIPPING, label: STATUS_LABELS.SHIPPING },
  { value: ORDER_STATUS.COMPLETED, label: STATUS_LABELS.COMPLETED },
  { value: ORDER_STATUS.CANCELLED, label: STATUS_LABELS.CANCELLED },
  { value: ORDER_STATUS.FAILED, label: STATUS_LABELS.FAILED },
  { value: ORDER_STATUS.REFUNDED, label: STATUS_LABELS.REFUNDED },
];

export const TYPE_ORDER_OPTIONS = [
  { value: "ALL", label: "Tất cả loại đơn" },
  { value: TYPE_ORDER.ONLINE, label: TYPE_ORDER_LABELS.ONLINE },
  { value: TYPE_ORDER.POS, label: TYPE_ORDER_LABELS.POS },
];

export const extractOrderResponseData = (response) => {
  return response?.data?.data || response?.data || response;
};

export const normalizeOrderStatus = (status) => {
  if (!status || status === "ALL" || status === "all") return null;

  const value = String(status).toUpperCase();

  const legacyMap = {
    CREATED: ORDER_STATUS.PENDING_PAYMENT,
    PENDING: ORDER_STATUS.PENDING_PAYMENT,
    CONFIRMED: ORDER_STATUS.WAITING_FOR_CONFIRMATION,
    DELIVERING: ORDER_STATUS.SHIPPING,
    DONE: ORDER_STATUS.COMPLETED,
    FAILED_ORDER: ORDER_STATUS.FAILED,
    FAILED_PAYMENT: ORDER_STATUS.FAILED,
  };

  return legacyMap[value] || value;
};

export const normalizeTypeOrder = (typeOrder) => {
  if (!typeOrder || typeOrder === "ALL" || typeOrder === "all") return null;

  const value = String(typeOrder).toUpperCase();

  if (value === TYPE_ORDER.ONLINE) return TYPE_ORDER.ONLINE;
  if (value === TYPE_ORDER.POS) return TYPE_ORDER.POS;

  return value;
};

export const getOrderStatusLabel = (status) => {
  const normalized = normalizeOrderStatus(status) || ORDER_STATUS.PENDING_PAYMENT;
  return STATUS_LABELS[normalized] || normalized;
};

export const getTypeOrderLabel = (typeOrder) => {
  const normalized = normalizeTypeOrder(typeOrder);
  return TYPE_ORDER_LABELS[normalized] || normalized || "N/A";
};

export const isFinalOrderStatus = (status) => {
  const normalized = normalizeOrderStatus(status);
  return FINAL_ORDER_STATUSES.has(normalized);
};

export const getOrderItems = (order) => {
  if (Array.isArray(order?.orderDetails)) return order.orderDetails;
  if (Array.isArray(order?.items)) return order.items;
  return [];
};

export const normalizeOrderItem = (item = {}) => {
  return {
    productId:
      item.productId ||
      item.product?.id ||
      item.product_id ||
      item.id ||
      null,

    variantId:
      item.variantId ||
      item.productVariantId ||
      item.selectedVariantId ||
      item.variant?.id ||
      item.product_variant_id ||
      null,

    quantity: Number(item.quantity || item.qty || 1),
  };
};

export const normalizeCreateOrderPayload = (payload = {}) => {
  return {
    franchiseId: payload.franchiseId,
    paymentMethodId: payload.paymentMethodId,
    customerId: payload.customerId || null,
    staffId: payload.staffId || null,
    promotionId: payload.promotionId || null,
    point: Number(payload.point || 0),
    address: payload.address || null,

    // BE CreateOrderRequest hiện đang dùng Long distance,
    // nên FE gửi số nguyên để tránh lỗi parse JSON khi distance là số lẻ.
    distance: Math.max(0, Math.round(Number(payload.distance || 0))),

    typeOrder: normalizeTypeOrder(payload.typeOrder) || TYPE_ORDER.ONLINE,

    items: Array.isArray(payload.items)
      ? payload.items
          .map(normalizeOrderItem)
          .filter((item) => item.productId && item.variantId && item.quantity > 0)
      : [],
  };
};

export const normalizePageResponse = (response) => {
  const data = extractOrderResponseData(response);

  return {
    content: Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data)
        ? data
        : [],
    totalPages: Number(data?.totalPages || 1),
    totalElements: Number(data?.totalElements || 0),
    number: Number(data?.number || 0),
    size: Number(data?.size || 10),
  };
};

export const normalizeListResponse = (response) => {
  const data = extractOrderResponseData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;

  return [];
};

export const createOrder = async (payload) => {
  const normalizedPayload = normalizeCreateOrderPayload(payload);
  return orderApi.createOrder(normalizedPayload);
};

export const getAllOrders = async () => {
  return orderApi.getAllOrders();
};

export const getOrderById = async (orderId) => {
  return orderApi.getOrderById(orderId);
};

export const getOrderDetail = async (orderId) => {
  return orderApi.getOrderById(orderId);
};

export const getOrdersByCustomer = async (
  customerId,
  status = null,
  page = 0,
  size = 10
) => {
  return orderApi.getOrdersByCustomer(
    customerId,
    normalizeOrderStatus(status),
    page,
    size
  );
};

export const getOrdersByFranchise = async (
  franchiseId,
  status = null,
  typeOrder = null,
  page = 0,
  size = 10
) => {
  return orderApi.getOrdersByFranchise(
    franchiseId,
    normalizeOrderStatus(status),
    normalizeTypeOrder(typeOrder),
    page,
    size
  );
};

export const getOrdersByStatus = async (
  status = null,
  typeOrder = null,
  page = 0,
  size = 10
) => {
  return orderApi.getOrdersByStatus(
    normalizeOrderStatus(status),
    normalizeTypeOrder(typeOrder),
    page,
    size
  );
};

export const searchOrders = async (franchiseId, keyword = "") => {
  return orderApi.searchOrders(franchiseId, keyword);
};

export const searchOrdersById = async (keyword = "") => {
  return orderApi.searchOrdersById(keyword);
};

export const searchOrdersByIdAndFranchise = async (
  franchiseId,
  keyword = ""
) => {
  return orderApi.searchOrdersByIdAndFranchise(franchiseId, keyword);
};

export const updateOrderStatus = async (orderId, status, staffId = null) => {
  return orderApi.updateStatus(orderId, normalizeOrderStatus(status), staffId);
};

export const assignStaff = async (orderId, staffId) => {
  return orderApi.assignStaff(orderId, staffId);
};

export const markSpecial = async (orderId) => {
  return orderApi.markSpecial(orderId);
};

export const estimateDelivery = async (orderId, eta) => {
  return orderApi.estimateDelivery(orderId, eta);
};

export const abandonOrder = async (orderId) => {
  return orderApi.abandonOrder(orderId);
};

export const addOnlineAddress = async ({ customerId, address }) => {
  return orderApi.addOnlineAddress({ customerId, address });
};

export const getOnlineAddress = async (customerId) => {
  return orderApi.getOnlineAddress(customerId);
};

export default {
  ORDER_STATUS,
  TYPE_ORDER,
  STATUS_LABELS,
  TYPE_ORDER_LABELS,
  ORDER_STATUS_OPTIONS,
  TYPE_ORDER_OPTIONS,
  FINAL_ORDER_STATUSES,

  extractOrderResponseData,
  normalizeOrderStatus,
  normalizeTypeOrder,
  getOrderStatusLabel,
  getTypeOrderLabel,
  isFinalOrderStatus,
  getOrderItems,
  normalizeOrderItem,
  normalizeCreateOrderPayload,
  normalizePageResponse,
  normalizeListResponse,

  createOrder,
  getAllOrders,
  getOrderById,
  getOrderDetail,
  getOrdersByCustomer,
  getOrdersByFranchise,
  getOrdersByStatus,
  searchOrders,
  searchOrdersById,
  searchOrdersByIdAndFranchise,
  updateOrderStatus,
  assignStaff,
  markSpecial,
  estimateDelivery,
  abandonOrder,
  addOnlineAddress,
  getOnlineAddress,
};