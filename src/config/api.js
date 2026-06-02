import { HTTP_METHODS } from "@/constraints/index.js";
import { axiosClient, publicAxiosClient } from "./axiosClient";
import ENV from "./env";

export const ENDPOINTS = {
  PUBLIC: {
    login: "/auth/login",
    register: "/auth/register",
    verify: "/auth/verify",
    resendCode: "/auth/resend-code",
    forgotPassword: "/auth/forgot-password",
    confirmForgotPassword: "/auth/forgot-password/confirm",

    // Firebase Auth
    syncUser: "/auth/sync-user",
    me: "/auth/me",

    list: "/products/getall",
    categories: "/products/categories/get-all",
    filterProduct: "/products/filter",
  },

  PROTECTED: {
    USER: {
      logout: "/auth/logout",
      profile: "/auth/users/profile",
      refresh: "/auth/refresh",
      counts: "/auth/users/counts",
      getAll: "/auth/users",
      search: "/auth/users/search",
      searchByIds: "/auth/users/bulk",
      create: "/auth/users",
      changePassword: "/auth/change-password",
      assignRole: (userId) => `/auth/users/${userId}/assign-role`,
      update: (userId) => `/auth/users/${userId}/update`,
      updateProfile: "/auth/users/update-profile",
      delete: (userId) => `/auth/users/delete-account/${userId}`,
      changeStatus: (userId) => `/auth/users/${userId}/update-status`,
      getStaffByFranchise: "/auth/users/franchise/staff",
    },

    PRODUCTS: {
      list: "/products/get-all",
      detail: (id) => `/products/detail/${id}`,
      getAll: "/products/get-all",
      search: "/products/search",
      create: "/products",
      update: "/products",
      delete: (id) => `/products/inactive/${id}`,
      deleteVariant: "/products",
      upload: "/uploads",

      categories: "/products/categories",
      categoryGetAll: "/products/categories/get-all",
      categoryUpdate: (id) => `/products/categories/update/${id}`,
      categoryDelete: (id) => `/products/categories/delete/${id}`,
    },

    INVENTORY: {
      list: "/inventory/franchise",
      franchise: "/inventory/franchise",
      lowStock: "/inventory/low-stock",
      threshold: "/inventory/threshold",
      search: "/inventory/search",
    },

    PROMOTIONS: {
      list: "/promotions",
      detail: (id) => `/promotions/${id}`,
      delete: (id) => `/promotions/${id}`,
      create: "/promotions",
      update: (id) => `/promotions/${id}`,
      available: (userId, franchiseId, orderValue) =>
        `/promotions/available?userId=${userId}&franchiseId=${franchiseId}&orderValue=${orderValue}`,
      scopesByPromotion: (promotionId) => `/promotions/scopes/${promotionId}`,
      createScope: "/promotions/scopes",
      updateScope: (id) => `/promotions/scopes/${id}`,
    },

    ORDER: {
      create: "/orders/create-order",
      list: "/orders",
      detail: (id) => `/orders/detail/${id}`,

      customer: (customerId) => `/orders/customer/${customerId}`,
      franchise: (franchiseId) => `/orders/franchise/${franchiseId}`,
      status: "/orders/status",
      search: "/orders/search",

      updateStatus: (orderId) => `/orders/${orderId}/status`,
      assignStaff: (orderId, staffId) =>
        `/orders/${orderId}/assign-staff/${staffId}`,
      markSpecial: (orderId) => `/orders/${orderId}/mark-special`,
      estimateDelivery: (orderId) => `/orders/${orderId}/estimate-delivery`,
      abandon: (orderId) => `/orders/${orderId}/abandon`,

      addOnlineAddress: "/orders/online/address",
      getOnlineAddress: (customerId) => `/orders/online/${customerId}/address`,
    },

    CART: {
      get: (customerId) => `/carts/online/${customerId}`,
      add: "/carts/online/add",
      update: (customerId, variantId) =>
        `/carts/online/${customerId}/update/${variantId}`,
      remove: (customerId, variantId) =>
        `/carts/online/${customerId}/remove/${variantId}`,

      addPos: "/carts/pos/add",
      getPos: (terminalId) => `/carts/pos/${terminalId}`,
      removePos: (terminalId, variantId) =>
        `/carts/pos/${terminalId}/remove/${variantId}`,
    },

    ADMIN: {
      dashboard: "/admin/dashboard",
      users: "/admin/users",
      branches: "/admin/branches",
      reports: "/admin/reports",
    },

    FRANCHISE: {
      list: "/franchises",
      detail: (id) => `/franchises/${id}`,
      create: "/franchises",
      update: (id) => `/franchises/${id}`,
      delete: (id) => `/franchises/${id}`,
      status: (id) => `/franchises/${id}/status`,
      byStatus: (status) => `/franchises/status/${status}`,
      getAll: "/franchises/get-all",
      getActive: "/franchises/get-active",
      events: "/franchises/events",
    },

    MANAGER: {
      dashboard: "/reports/dashboard",
      staff: "/manager/staff",
      inventory: "/manager/inventory",
    },

    STAFF: {
      dashboard: "/staff/dashboard",
      orders: "/staff/orders",
      queue: "/staff/queue",
    },

    SHIFTS: {
      // ================= SHIFT CONFIGURATION =================
      list: (franchiseId) => `/shifts/franchise/${franchiseId}`,
      create: "/shifts",
      update: (id) => `/shifts/${id}`,
      delete: (id) => `/shifts/${id}`,

      // ================= STAFF SHIFT / ASSIGNMENT =================
      assign: "/shifts/assignments",
      updateAssignment: (assignmentId) => `/shifts/assignments/${assignmentId}`,

      // Backend hiện tại chỉ có:
      // GET /api/shifts/assignments?date=YYYY-MM-DD
      // GET /api/shifts/assignments?date=YYYY-MM-DD&staffId=UUID
      getSchedule: (date, staffId = null) => {
        const params = new URLSearchParams();

        params.append("date", date);

        if (staffId) {
          params.append("staffId", staffId);
        }

        return `/shifts/assignments?${params.toString()}`;
      },

      // Không dùng endpoint này trực tiếp vì backend chưa có /range.
      // Giữ để tránh file cũ import bị crash.
      getScheduleRange: (staffId, startDate, endDate) => {
        const params = new URLSearchParams();

        if (staffId) {
          params.append("staffId", staffId);
        }

        params.append("startDate", startDate);
        params.append("endDate", endDate);

        return `/shifts/assignments/range?${params.toString()}`;
      },

      // ================= ATTENDANCE =================
      checkIn: (id) => `/shifts/assignments/${id}/check-in`,
      checkOut: (id) => `/shifts/assignments/${id}/check-out`,
      markAbsent: (id) => `/shifts/assignments/${id}/absent`,

      // ================= STATISTICS =================
      statistics: (date) => `/shifts/statistics?date=${date}`,
      personalStatistics: (staffId) => `/shifts/statistics/${staffId}`,

      // ================= ATTENDANCE REPORT =================
      incompleteShifts: (date) => `/shifts/attendance/incomplete?date=${date}`,
      attendanceSummary: (date) => `/shifts/attendance/summary?date=${date}`,

      // ================= SSE =================
      events: "/shifts/events",
    },

    PAYMENT: {
      option: "/payments/option",
      getMethods: "/payments/get-method",
      checkStatus: (id) => `/payments/status/${id}`,
      getTransaction: (id) => `/payments/${id}/get-transaction`,
      getPayUrl: (id) => `/payments/pay-url/${id}`,
    },

    DELIVERY: {
      listAll: "/delivery/getall",
      byOrderId: (orderId) => `/delivery/get-by-order-id/${orderId}`,
      create: "/delivery/create",
      update: (deliveryId) => `/delivery/update/${deliveryId}`,
    },

    AI: {
      search: "/ai/search",
      update: "/ai/update",
      translate: "/ai/translate",
      recommendSystem: "/ai/recommendsystem",
      trainAsync: "/ai/recommend/train",
      trainSync: "/ai/recommend/train/sync",
      status: "/ai/recommend/status",
      similar: "/ai/recommend/similar",
      getConfig: "/ai/config",
      updateConfig: "/ai/config",
    },

    REPORTS: {
      dashboard: "/reports/dashboard",
      events: "/reports/events",
    },

    STORE_REQUESTS: {
      create: "/inventory/requests",
      getAll: "/inventory/requests",
      getById: (id) => `/inventory/requests/${id}`,
      getByFranchise: (franchiseId) =>
        `/inventory/requests?franchiseId=${franchiseId}`,
      getByStatus: (status) => `/inventory/requests/status/${status}`,
      getPending: "/inventory/requests/pending",
      getMyRequests: (createdBy) =>
        `/inventory/requests/my-requests/${createdBy}`,
      getMyRequestsByStatus: (createdBy, status) =>
        `/inventory/requests/my-requests/${createdBy}/status/${status}`,
      approve: (id, sourceId, approvedBy) =>
        `/inventory/requests/${id}/approve?sourceLocationId=${sourceId}${
          approvedBy ? `&approvedBy=${approvedBy}` : ""
        }`,
      ship: (id, sourceId) =>
        `/inventory/requests/${id}/ship${
          sourceId ? `?sourceLocationId=${sourceId}` : ""
        }`,
      receive: (id) => `/inventory/requests/${id}/receive`,
      reject: (id, reason) =>
        `/inventory/requests/${id}/reject?reason=${encodeURIComponent(
          reason || ""
        )}`,
      review: (id) => `/inventory/requests/${id}/review`,
      complete: (id) => `/inventory/requests/${id}/complete`,
    },

    CUSTOMER: {
      getAll: "/customers/get-all",

      // ADMIN
      adminAll: "/customers/admin/all",
      adminSearch: "/customers/admin/search",

      // MANAGER / FRANCHISE
      franchiseAll: "/customers/franchise/all",
      franchiseSearch: "/customers/franchise/search",

      // BACKWARD COMPATIBLE SEARCH
      search: "/customers/search",
      searching: "/customers/searching",

      // READ
      bulk: "/customers/bulk",
      detail: (id) => `/customers/${id}`,
      detailByUserFranchise: "/customers/customer-franchise",

      // CREATE / SYNC
      syncInternal: "/customers/internal/sync",
      syncToFranchise: "/customers/sync-to-franchise",
      createAtFranchise: (franchiseId) => `/customers/franchises/${franchiseId}`,

      // ADMIN UPDATE / DELETE
      update: (id) => `/customers/${id}`,
      updateStatus: (id) => `/customers/${id}/status`,
      delete: (id) => `/customers/${id}`,

      // MANAGER UPDATE / DELETE
      managerUpdateStatus: (id) => `/customers/manager/${id}/status`,
      managerDelete: (id) => `/customers/manager/${id}`,
    },
  },
};

export const apiCall = async (method, endpoint, data = null, config = {}) => {
  const isPublic = Object.values(ENDPOINTS.PUBLIC).includes(endpoint);
  const isLoginAction = endpoint === ENDPOINTS.PUBLIC.login;

  const request = isPublic && !isLoginAction ? publicAxiosClient : axiosClient;

  try {
    if (import.meta.env.DEV) {
      console.log("ENV.BASE_URL 01", ENV.BASE_URL);
      console.log(`🚀 [${method}] ${endpoint}`, data || "");
    }

    const response = await request({
      method,
      url: endpoint,
      data,
      ...config,
    });

    if (import.meta.env.DEV) {
      console.log("response.data: ", response.data);
      console.log("response.headers: ", response.headers);
    }

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "API Call Failed";

    console.error(`❌ API Error [${method}] ${endpoint}:`, errorMessage);

    if (error instanceof Error) {
      error.message = errorMessage;
    }

    throw error;
  }
};

const appendParam = (params, key, value) => {
  if (value === undefined || value === null || value === "") return;
  if (value === "ALL" || value === "all") return;

  params.append(key, String(value));
};

const extractArray = (response) => {
  const data = response?.data?.data || response?.data || response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const toLocalDateString = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

const getDatesBetween = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }

  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(toLocalDateString(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const normalizeOrderStatus = (status) => {
  if (!status || status === "ALL" || status === "all") return null;

  const value = String(status).toUpperCase();

  const legacyMap = {
    CREATED: "PENDING_PAYMENT",
    PENDING: "PENDING_PAYMENT",
    CONFIRMED: "WAITING_FOR_CONFIRMATION",
    DELIVERING: "SHIPPING",
    DONE: "COMPLETED",
    FAILED_ORDER: "FAILED",
    FAILED_PAYMENT: "FAILED",
  };

  return legacyMap[value] || value;
};

export const normalizeTypeOrder = (typeOrder) => {
  if (!typeOrder || typeOrder === "ALL" || typeOrder === "all") return null;

  const value = String(typeOrder).toUpperCase();

  if (value === "ONLINE") return "ONLINE";
  if (value === "POS") return "POS";

  return value;
};

const normalizeOrderItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
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
    }))
    .filter((item) => item.productId && item.variantId && item.quantity > 0);
};

export const orderApi = {
  createOrder: (data = {}) => {
    const payload = {
      franchiseId: data.franchiseId,
      paymentMethodId: data.paymentMethodId,
      customerId: data.customerId || null,
      staffId: data.staffId || null,
      promotionId: data.promotionId || null,
      point: Number(data.point || 0),
      address: data.address || null,

      // BE đang dùng Long distance, nên FE gửi số nguyên để không lỗi JSON parse.
      distance: Math.max(0, Math.round(Number(data.distance || 0))),

      typeOrder: normalizeTypeOrder(data.typeOrder) || "ONLINE",
      items: normalizeOrderItems(data.items),
    };

    return apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.ORDER.create, payload);
  },

  getAllOrders: () => {
    return apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.ORDER.list);
  },

  getOrderById: (orderId) => {
    return apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.ORDER.detail(orderId));
  },

  getOrdersByCustomer: (
    customerId,
    status = null,
    page = 0,
    size = 10
  ) => {
    const params = new URLSearchParams();

    appendParam(params, "status", normalizeOrderStatus(status));
    appendParam(params, "page", page);
    appendParam(params, "size", size);

    return apiCall(
      HTTP_METHODS.GET,
      `${ENDPOINTS.PROTECTED.ORDER.customer(customerId)}?${params.toString()}`
    );
  },

  getOrdersByFranchise: (
    franchiseId,
    status = null,
    typeOrder = null,
    page = 0,
    size = 10
  ) => {
    const params = new URLSearchParams();

    appendParam(params, "status", normalizeOrderStatus(status));
    appendParam(params, "typeOrder", normalizeTypeOrder(typeOrder));
    appendParam(params, "page", page);
    appendParam(params, "size", size);

    return apiCall(
      HTTP_METHODS.GET,
      `${ENDPOINTS.PROTECTED.ORDER.franchise(franchiseId)}?${params.toString()}`
    );
  },

  getOrdersByStatus: (
    status = null,
    typeOrder = null,
    page = 0,
    size = 10
  ) => {
    const params = new URLSearchParams();

    appendParam(params, "status", normalizeOrderStatus(status));
    appendParam(params, "typeOrder", normalizeTypeOrder(typeOrder));
    appendParam(params, "page", page);
    appendParam(params, "size", size);

    return apiCall(
      HTTP_METHODS.GET,
      `${ENDPOINTS.PROTECTED.ORDER.status}?${params.toString()}`
    );
  },

  searchOrders: (franchiseId, keyword = "") => {
    const params = new URLSearchParams();

    appendParam(params, "franchiseId", franchiseId);
    appendParam(params, "keyword", keyword);

    return apiCall(
      HTTP_METHODS.GET,
      `${ENDPOINTS.PROTECTED.ORDER.search}?${params.toString()}`
    );
  },

  searchOrdersById: (keyword = "") => {
    const params = new URLSearchParams();

    appendParam(params, "keyword", keyword);

    return apiCall(
      HTTP_METHODS.GET,
      `${ENDPOINTS.PROTECTED.ORDER.search}?${params.toString()}`
    );
  },

  searchOrdersByIdAndFranchise: (franchiseId, keyword = "") => {
    const params = new URLSearchParams();

    appendParam(params, "franchiseId", franchiseId);
    appendParam(params, "keyword", keyword);

    return apiCall(
      HTTP_METHODS.GET,
      `${ENDPOINTS.PROTECTED.ORDER.search}?${params.toString()}`
    );
  },

  updateStatus: (orderId, status, staffId = null) => {
    const params = new URLSearchParams();

    appendParam(params, "status", normalizeOrderStatus(status));
    appendParam(params, "staffId", staffId);

    return apiCall(
      HTTP_METHODS.PATCH,
      `${ENDPOINTS.PROTECTED.ORDER.updateStatus(orderId)}?${params.toString()}`
    );
  },

  assignStaff: (orderId, staffId) => {
    return apiCall(
      HTTP_METHODS.PUT,
      ENDPOINTS.PROTECTED.ORDER.assignStaff(orderId, staffId)
    );
  },

  markSpecial: (orderId) => {
    return apiCall(
      HTTP_METHODS.PUT,
      ENDPOINTS.PROTECTED.ORDER.markSpecial(orderId)
    );
  },

  estimateDelivery: (orderId, eta) => {
    const params = new URLSearchParams();

    appendParam(params, "eta", eta);

    return apiCall(
      HTTP_METHODS.PUT,
      `${ENDPOINTS.PROTECTED.ORDER.estimateDelivery(orderId)}?${params.toString()}`
    );
  },

  abandonOrder: (orderId) => {
    return apiCall(
      HTTP_METHODS.DELETE,
      ENDPOINTS.PROTECTED.ORDER.abandon(orderId)
    );
  },

  addOnlineAddress: ({ customerId, address }) => {
    return apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.ORDER.addOnlineAddress, {
      customerId,
      address,
    });
  },

  getOnlineAddress: (customerId) => {
    return apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.ORDER.getOnlineAddress(customerId)
    );
  },
};

export const shiftApi = {
  getByFranchise: (franchiseId) =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.SHIFTS.list(franchiseId)),

  createConfig: (data) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.SHIFTS.create, {
      franchiseId: data.franchiseId,
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes:
        data.breakMinutes === "" || data.breakMinutes === undefined
          ? null
          : data.breakMinutes,
    }),

  updateConfig: (id, data) =>
    apiCall(HTTP_METHODS.PUT, ENDPOINTS.PROTECTED.SHIFTS.update(id), {
      franchiseId: data.franchiseId,
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes:
        data.breakMinutes === "" || data.breakMinutes === undefined
          ? null
          : data.breakMinutes,
    }),

  deleteConfig: (id) =>
    apiCall(HTTP_METHODS.DELETE, ENDPOINTS.PROTECTED.SHIFTS.delete(id)),

  assign: (data) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.SHIFTS.assign, {
      staffId: data.staffId,
      shiftConfigId: data.shiftConfigId,
      workDate: data.workDate,
    }),

  updateAssignment: (assignmentId, data) =>
    apiCall(
      HTTP_METHODS.PUT,
      ENDPOINTS.PROTECTED.SHIFTS.updateAssignment(assignmentId),
      {
        staffId: data.staffId,
        shiftConfigId: data.shiftConfigId,
        workDate: data.workDate,
      }
    ),

  getSchedule: (date, staffId = null) =>
    apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.SHIFTS.getSchedule(date, staffId)
    ),

  // Backend shift hiện tại chưa có /assignments/range.
  // Hàm này tự gọi từng ngày bằng endpoint getSchedule(date, staffId).
  getScheduleRange: async (staffId, startDate, endDate) => {
    const dates = getDatesBetween(startDate, endDate);

    if (dates.length === 0) return [];

    const results = await Promise.all(
      dates.map((date) =>
        apiCall(
          HTTP_METHODS.GET,
          ENDPOINTS.PROTECTED.SHIFTS.getSchedule(date, staffId)
        ).catch((error) => {
          console.error("Load shift schedule date failed:", date, error);
          return [];
        })
      )
    );

    return results.flatMap(extractArray);
  },

  checkIn: (id) =>
    apiCall(HTTP_METHODS.PUT, ENDPOINTS.PROTECTED.SHIFTS.checkIn(id)),

  checkOut: (id) =>
    apiCall(HTTP_METHODS.PUT, ENDPOINTS.PROTECTED.SHIFTS.checkOut(id)),

  markAbsent: (id) =>
    apiCall(HTTP_METHODS.PUT, ENDPOINTS.PROTECTED.SHIFTS.markAbsent(id)),

  getStatsByDate: (date) =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.SHIFTS.statistics(date)),

  getPersonalStats: (staffId) =>
    apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.SHIFTS.personalStatistics(staffId)
    ),

  getIncompleteShifts: (date) =>
    apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.SHIFTS.incompleteShifts(date)
    ),

  getAttendanceSummary: (date) =>
    apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.SHIFTS.attendanceSummary(date)
    ),
};

export const deliveryApi = {
  getAllDeliveries: () =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.DELIVERY.listAll),

  getDeliveryByOrderId: (id) =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.DELIVERY.byOrderId(id)),

  createDelivery: (payload) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.DELIVERY.create, payload),

  updateDeliveryById: (deliveryId, payload) =>
    apiCall(
      HTTP_METHODS.PUT,
      ENDPOINTS.PROTECTED.DELIVERY.update(deliveryId),
      payload
    ),
};

export const cartApi = {
  addItemOnline: (data) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.CART.add, {
      customerId: data.customerId,
      productId: data.productId,
      variantId: data.variantId || data.productVariantId,
      quantity: Number(data.quantity || data.qty || 1),
    }),

  getCartOnline: (customerId) =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.CART.get(customerId)),

  updateItemOnline: (customerId, variantId, quantity) =>
    apiCall(
      HTTP_METHODS.PUT,
      `${ENDPOINTS.PROTECTED.CART.update(customerId, variantId)}?quantity=${Number(
        quantity || 1
      )}`
    ),

  removeItemOnline: (customerId, variantId) =>
    apiCall(
      HTTP_METHODS.DELETE,
      ENDPOINTS.PROTECTED.CART.remove(customerId, variantId)
    ),

  addItemPos: (data) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.CART.addPos, {
      terminalId: data.terminalId,
      productId: data.productId,
      variantId: data.variantId || data.productVariantId,
      quantity: Number(data.quantity || data.qty || 1),
    }),

  getCartPos: (terminalId) =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.CART.getPos(terminalId)),

  removeItemPos: (terminalId, variantId) =>
    apiCall(
      HTTP_METHODS.DELETE,
      ENDPOINTS.PROTECTED.CART.removePos(terminalId, variantId)
    ),
};

export const productApi = {
  getAllProducts: () => apiCall(HTTP_METHODS.GET, ENDPOINTS.PUBLIC.list),
};

export const categoryApi = {
  getAll: () => apiCall(HTTP_METHODS.GET, ENDPOINTS.PUBLIC.categories),
};

export const aiApi = {
  semanticSearch: (payload) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.AI.search, payload),

  updateVectorStore: () =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.AI.update),

  translateTexts: (payload) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.AI.translate, payload),

  getRecommendations: (payload) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.AI.recommendSystem, payload),

  trainRecommendModelAsync: () =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.AI.trainAsync),

  trainRecommendModelSync: () =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.AI.trainSync),

  getRecommendModelStatus: () =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.AI.status),

  getSimilarProducts: (payload) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.AI.similar, payload),

  getConfig: () => apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.AI.getConfig),

  updateConfig: (payload) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.AI.updateConfig, payload),
};

export const reportApi = {
  getDashboard: () =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.REPORTS.dashboard),

  getDashboardByDate: (fromDate, toDate, franchiseId = null) => {
    const params = { from: fromDate, to: toDate };

    if (franchiseId) {
      params.franchiseId = franchiseId;
    }

    return apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.REPORTS.dashboard,
      null,
      { params }
    );
  },
};

export const storeRequestApi = {
  create: (data) =>
    apiCall(HTTP_METHODS.POST, ENDPOINTS.PROTECTED.STORE_REQUESTS.create, {
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      franchiseId: data.franchiseId,
      items: data.items,
      notes: data.notes,
      totalAmount: data.totalAmount,
    }),

  getAll: () =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.STORE_REQUESTS.getAll),

  getById: (id) =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.STORE_REQUESTS.getById(id)),

  getByFranchise: (franchiseId) =>
    apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.STORE_REQUESTS.getByFranchise(franchiseId)
    ),

  getByStatus: (status) =>
    apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.STORE_REQUESTS.getByStatus(status)
    ),

  getPending: () =>
    apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.STORE_REQUESTS.getPending),

  getMyRequests: (createdBy) =>
    apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.STORE_REQUESTS.getMyRequests(createdBy)
    ),

  getMyRequestsByStatus: (createdBy, status) =>
    apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.STORE_REQUESTS.getMyRequestsByStatus(
        createdBy,
        status
      )
    ),

  approve: (id, sourceId, approvedBy) =>
    apiCall(
      HTTP_METHODS.PATCH,
      ENDPOINTS.PROTECTED.STORE_REQUESTS.approve(id, sourceId, approvedBy)
    ),

  ship: (id, sourceId) =>
    apiCall(
      HTTP_METHODS.PATCH,
      ENDPOINTS.PROTECTED.STORE_REQUESTS.ship(id, sourceId)
    ),

  receive: (id) =>
    apiCall(HTTP_METHODS.PATCH, ENDPOINTS.PROTECTED.STORE_REQUESTS.receive(id)),

  reject: (id, reason) =>
    apiCall(
      HTTP_METHODS.PATCH,
      ENDPOINTS.PROTECTED.STORE_REQUESTS.reject(id, reason)
    ),

  review: (id, reviewData) =>
    apiCall(
      HTTP_METHODS.PATCH,
      ENDPOINTS.PROTECTED.STORE_REQUESTS.review(id),
      reviewData
    ),

  complete: (id) =>
    apiCall(HTTP_METHODS.PATCH, ENDPOINTS.PROTECTED.STORE_REQUESTS.complete(id)),
};