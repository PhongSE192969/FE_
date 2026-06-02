// src/services/customerService.js
import { apiCall, ENDPOINTS } from "@/config/api";
import { HTTP_METHODS } from "@/constraints";

const CUSTOMER_ENDPOINTS = ENDPOINTS.PROTECTED.CUSTOMER;

export const extractData = (res) => {
  return res?.data?.data || res?.data || res;
};

export const extractCustomerPage = (res) => {
  const data = extractData(res);

  return {
    items: Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
          ? data
          : [],

    currentPage:
      data?.currentPage ??
      data?.pageNo ??
      data?.number ??
      data?.page ??
      0,

    totalPages: data?.totalPages ?? 1,

    totalItems:
      data?.totalItems ??
      data?.totalElements ??
      0,

    pageSize: data?.pageSize ?? data?.size ?? 10,
  };
};

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      value !== "ALL" &&
      value !== "All" &&
      value !== "all"
    ) {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== null && item !== undefined && item !== "") {
            searchParams.append(key, item);
          }
        });
      } else {
        searchParams.append(key, value);
      }
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const normalizeStatus = (status) => {
  if (!status || status === "ALL" || status === "All" || status === "all") {
    return null;
  }

  return String(status).toUpperCase();
};

const normalizeCustomerType = (type) => {
  if (!type) return "REGISTERED";
  return String(type).toUpperCase();
};

const getNestedUser = (data = {}) => {
  return data.user || data.userResponse || data.user_response || {};
};

const getNestedFranchise = (data = {}) => {
  return data.franchise || data.franchiseResponse || data.franchise_response || {};
};

const getCustomerIdFromData = (data = {}) => {
  return (
    data.customerId ||
    data.customer_id ||
    data.customerFranchiseId ||
    data.customer_franchise_id ||
    data.id ||
    null
  );
};

const getUserIdFromData = (data = {}) => {
  const user = getNestedUser(data);

  return (
    data.userId ||
    data.user_id ||
    data.identityUserId ||
    data.identity_user_id ||
    user.id ||
    user.userId ||
    null
  );
};

const normalizeCustomer = (customer = {}) => {
  const user = getNestedUser(customer);
  const franchise = getNestedFranchise(customer);

  const customerId = getCustomerIdFromData(customer);
  const userId = getUserIdFromData(customer);

  return {
    ...customer,

    // Quan trọng:
    // id trong customerService ưu tiên là customerId/customerFranchiseId,
    // không phải userId.
    id: customerId,
    customerId,
    customer_id: customerId,
    customerFranchiseId: customerId,

    userId,
    user_id: userId,
    identityUserId: userId,

    username: user.username || customer.username || "",
    fullName:
      user.fullName ||
      user.full_name ||
      customer.fullName ||
      customer.full_name ||
      customer.name ||
      "",
    email: user.email || customer.email || "",
    phone: user.phone || customer.phone || "",
    gender: user.gender ?? customer.gender,
    avatarUrl: user.avatarUrl || user.avatar_url || customer.avatarUrl || "",
    verifyEmail: Boolean(user.verifyEmail || user.verify_email),
    userStatus: user.status || customer.userStatus || "",

    role: user.role || customer.role || null,
    roleName: user.role?.name || customer.roleName || "",

    franchiseId: franchise.id || customer.franchiseId || customer.franchise_id,
    franchiseName:
      franchise.name ||
      customer.franchiseName ||
      customer.franchise_name ||
      "",
    franchiseAddress:
      franchise.address ||
      customer.franchiseAddress ||
      customer.franchise_address ||
      "",
    franchisePhone:
      franchise.phone ||
      customer.franchisePhone ||
      customer.franchise_phone ||
      "",
    franchiseEmail:
      franchise.email ||
      customer.franchiseEmail ||
      customer.franchise_email ||
      "",

    type: customer.type || "",
    status: customer.status || "ACTIVE",

    firstOrderAt: customer.firstOrderAt || customer.first_order_at || null,
    lastOrderAt: customer.lastOrderAt || customer.last_order_at || null,
    createdAt: customer.createdAt || customer.created_at || null,
    updatedAt: customer.updatedAt || customer.updated_at || null,
  };
};

const normalizeCustomerSummary = (summary = {}) => {
  const user = getNestedUser(summary);
  const loyaltyInfo = summary.loyaltyInfo || summary.loyalty_info || null;
  const purchasedFranchises = Array.isArray(summary.purchasedFranchises)
    ? summary.purchasedFranchises
    : Array.isArray(summary.purchased_franchises)
      ? summary.purchased_franchises
      : [];

  const customerId = getCustomerIdFromData(summary);
  const userId = getUserIdFromData(summary);

  return {
    ...summary,

    id: customerId,
    customerId,
    customer_id: customerId,
    customerFranchiseId: customerId,

    userId,
    user_id: userId,
    identityUserId: userId,

    username: user.username || summary.username || "",
    fullName:
      user.fullName ||
      user.full_name ||
      summary.fullName ||
      summary.full_name ||
      summary.name ||
      "",
    email: user.email || summary.email || "",
    phone: user.phone || summary.phone || "",
    gender: user.gender ?? summary.gender,
    avatarUrl: user.avatarUrl || user.avatar_url || summary.avatarUrl || "",
    verifyEmail: Boolean(user.verifyEmail || user.verify_email),
    userStatus: user.status || summary.userStatus || "",
    roleName: user.role?.name || summary.roleName || "",

    loyaltyInfo,
    loyaltyTier: loyaltyInfo?.loyaltyTier || summary.loyaltyTier || "BRONZE",
    currentPoint:
      loyaltyInfo?.currentPoint ??
      loyaltyInfo?.currentPoints ??
      summary.currentPoint ??
      summary.currentPoints ??
      0,
    currentPoints:
      loyaltyInfo?.currentPoints ??
      loyaltyInfo?.currentPoint ??
      summary.currentPoints ??
      summary.currentPoint ??
      0,
    totalPoint:
      loyaltyInfo?.totalPoint ??
      summary.totalPoint ??
      0,

    purchasedFranchises,
    franchiseCount: purchasedFranchises.length,
  };
};

/**
 * GET /api/customers/get-all?page=0
 */
export const getAllCustomersLegacy = async (page = 0) => {
  const endpoint = `${CUSTOMER_ENDPOINTS.getAll}${buildQuery({ page })}`;
  const res = await apiCall(HTTP_METHODS.GET, endpoint);
  const data = extractData(res);

  return Array.isArray(data) ? data.map(normalizeCustomer) : [];
};

/**
 * GET /api/customers/admin/all?status=&page=&size=&sort=
 */
export const getCustomersForAdmin = async ({
  status = null,
  page = 0,
  size = 10,
  sort = "createdAt,desc",
} = {}) => {
  const endpoint = `${CUSTOMER_ENDPOINTS.adminAll}${buildQuery({
    status: normalizeStatus(status),
    page,
    size,
    sort,
  })}`;

  const res = await apiCall(HTTP_METHODS.GET, endpoint);
  const pageData = extractCustomerPage(res);

  return {
    ...pageData,
    items: pageData.items.map(normalizeCustomer),
  };
};

/**
 * GET /api/customers/franchise/all?franchiseId=&status=&page=&size=&sort=
 */
export const getCustomersForManager = async ({
  franchiseId,
  status = null,
  page = 0,
  size = 10,
  sort = "createdAt,desc",
} = {}) => {
  if (!franchiseId) {
    return {
      items: [],
      currentPage: page,
      totalPages: 1,
      totalItems: 0,
      pageSize: size,
    };
  }

  const endpoint = `${CUSTOMER_ENDPOINTS.franchiseAll}${buildQuery({
    franchiseId,
    status: normalizeStatus(status),
    page,
    size,
    sort,
  })}`;

  const res = await apiCall(HTTP_METHODS.GET, endpoint);
  const pageData = extractCustomerPage(res);

  return {
    ...pageData,
    items: pageData.items.map(normalizeCustomer),
  };
};

/**
 * GET /api/customers/admin/search?franchiseId=&status=&userIds=&page=&size=
 */
export const searchCustomerFranchisesForAdmin = async ({
  franchiseId = null,
  status = null,
  userIds = [],
  page = 0,
  size = 10,
  sort = "createdAt,desc",
} = {}) => {
  const endpoint = `${CUSTOMER_ENDPOINTS.adminSearch || CUSTOMER_ENDPOINTS.search}${buildQuery({
    franchiseId,
    status: normalizeStatus(status),
    userIds,
    page,
    size,
    sort,
  })}`;

  const res = await apiCall(HTTP_METHODS.GET, endpoint);
  const pageData = extractCustomerPage(res);

  return {
    ...pageData,
    items: pageData.items.map(normalizeCustomer),
  };
};

/**
 * GET /api/customers/franchise/search?franchiseId=&status=&userIds=&page=&size=
 */
export const searchCustomerFranchisesForManager = async ({
  franchiseId,
  status = null,
  userIds = [],
  page = 0,
  size = 10,
  sort = "createdAt,desc",
} = {}) => {
  if (!franchiseId) {
    return {
      items: [],
      currentPage: page,
      totalPages: 1,
      totalItems: 0,
      pageSize: size,
    };
  }

  const endpoint = `${CUSTOMER_ENDPOINTS.franchiseSearch || CUSTOMER_ENDPOINTS.search}${buildQuery({
    franchiseId,
    status: normalizeStatus(status),
    userIds,
    page,
    size,
    sort,
  })}`;

  const res = await apiCall(HTTP_METHODS.GET, endpoint);
  const pageData = extractCustomerPage(res);

  return {
    ...pageData,
    items: pageData.items.map(normalizeCustomer),
  };
};

/**
 * Backward-compatible search.
 */
export const searchCustomerFranchises = searchCustomerFranchisesForAdmin;

/**
 * GET /api/customers/searching?keyword=&status=&franchiseId=&page=&size=&sortBy=&sortDir=
 */
export const searchCustomers = async ({
  keyword = "",
  status = null,
  franchiseId = null,
  page = 0,
  size = 10,
  sortBy = "lastOrderAt",
  sortDir = "desc",
} = {}) => {
  const endpoint = `${CUSTOMER_ENDPOINTS.searching}${buildQuery({
    keyword,
    status: normalizeStatus(status),
    franchiseId,
    page,
    size,
    sortBy,
    sortDir,
  })}`;

  const res = await apiCall(HTTP_METHODS.GET, endpoint);
  const data = extractData(res);

  const items = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];

  return {
    items: items.map(normalizeCustomerSummary),
    currentPage:
      data?.number ??
      data?.pageNo ??
      data?.currentPage ??
      page,
    totalPages: data?.totalPages ?? 1,
    totalItems: data?.totalElements ?? data?.totalItems ?? items.length,
    pageSize: data?.size ?? size,
  };
};

/**
 * POST /api/customers/bulk
 */
export const getCustomersByIds = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const res = await apiCall(
    HTTP_METHODS.POST,
    CUSTOMER_ENDPOINTS.bulk,
    ids
  );

  const data = extractData(res);

  return Array.isArray(data) ? data.map(normalizeCustomer) : [];
};

/**
 * GET /api/customers/{id}
 */
export const getCustomerById = async (id) => {
  const res = await apiCall(
    HTTP_METHODS.GET,
    CUSTOMER_ENDPOINTS.detail
      ? CUSTOMER_ENDPOINTS.detail(id)
      : `/customers/${id}`
  );

  const data = extractData(res);
  return data ? normalizeCustomer(data) : null;
};

/**
 * GET /api/customers/customer-franchise?userId=&franchiseId=
 */
export const getCustomerFranchiseDetail = async ({ userId, franchiseId }) => {
  const endpoint = `${CUSTOMER_ENDPOINTS.detailByUserFranchise}${buildQuery({
    userId,
    franchiseId,
  })}`;

  const res = await apiCall(HTTP_METHODS.GET, endpoint);
  const data = extractData(res);

  return data ? normalizeCustomer(data) : null;
};

/**
 * POST /api/customers/internal/sync?userId=&franchiseId=&type=
 */
export const syncCustomerFromIdentity = async ({
  userId,
  franchiseId,
  type = "REGISTERED",
}) => {
  if (!userId || !franchiseId) {
    throw new Error("Missing userId or franchiseId when syncing customer");
  }

  const endpoint = `${CUSTOMER_ENDPOINTS.syncInternal}${buildQuery({
    userId,
    franchiseId,
    type: normalizeCustomerType(type),
  })}`;

  const res = await apiCall(HTTP_METHODS.POST, endpoint);

  return extractData(res);
};

/**
 * POST /api/customers/sync-to-franchise?userId=&franchiseId=&type=
 */
export const syncCustomerToFranchise = async ({
  userId,
  franchiseId,
  type = "ONLINE",
}) => {
  if (!userId || !franchiseId) {
    throw new Error("Missing userId or franchiseId when syncing customer to franchise");
  }

  const endpoint = `${CUSTOMER_ENDPOINTS.syncToFranchise || "/customers/sync-to-franchise"}${buildQuery({
    userId,
    franchiseId,
    type: normalizeCustomerType(type),
  })}`;

  const res = await apiCall(HTTP_METHODS.POST, endpoint);

  return extractData(res);
};

/**
 * POST /api/customers/franchises/{franchiseId}?customerId=
 */
export const createCustomerAtFranchise = async ({
  customerId,
  franchiseId,
}) => {
  if (!customerId || !franchiseId) {
    throw new Error("Missing customerId or franchiseId");
  }

  const endpoint = `${CUSTOMER_ENDPOINTS.createAtFranchise
    ? CUSTOMER_ENDPOINTS.createAtFranchise(franchiseId)
    : `/customers/franchises/${franchiseId}`
  }${buildQuery({ customerId })}`;

  const res = await apiCall(HTTP_METHODS.POST, endpoint);

  return extractData(res);
};

/**
 * PUT /api/customers/{id}
 */
export const updateCustomer = async (id, payload = {}) => {
  const normalizedPayload = {
    fullName: payload.fullName,
    phone: payload.phone,
    status: normalizeStatus(payload.status),
  };

  const res = await apiCall(
    HTTP_METHODS.PUT,
    CUSTOMER_ENDPOINTS.update(id),
    normalizedPayload
  );

  return extractData(res);
};

/**
 * PATCH /api/customers/{id}/status?status=
 */
export const updateCustomerStatus = async (id, status) => {
  const endpoint = `${CUSTOMER_ENDPOINTS.updateStatus(id)}${buildQuery({
    status: normalizeStatus(status),
  })}`;

  const res = await apiCall(HTTP_METHODS.PATCH, endpoint);

  return extractData(res);
};

/**
 * PATCH /api/customers/manager/{id}/status?status=&managerFranchiseId=
 */
export const updateCustomerStatusForManager = async ({
  id,
  status,
  managerFranchiseId,
}) => {
  if (!id || !managerFranchiseId) {
    throw new Error("Missing customerFranchiseId or managerFranchiseId");
  }

  const endpoint = `${CUSTOMER_ENDPOINTS.managerUpdateStatus
    ? CUSTOMER_ENDPOINTS.managerUpdateStatus(id)
    : `/customers/manager/${id}/status`
  }${buildQuery({
    status: normalizeStatus(status),
    managerFranchiseId,
  })}`;

  const res = await apiCall(HTTP_METHODS.PATCH, endpoint);

  return extractData(res);
};

/**
 * DELETE /api/customers/{id}
 */
export const deleteCustomer = async (id) => {
  const res = await apiCall(
    HTTP_METHODS.DELETE,
    CUSTOMER_ENDPOINTS.delete(id)
  );

  return extractData(res);
};

/**
 * DELETE /api/customers/manager/{id}?managerFranchiseId=
 */
export const deleteCustomerForManager = async ({
  id,
  managerFranchiseId,
}) => {
  if (!id || !managerFranchiseId) {
    throw new Error("Missing customerFranchiseId or managerFranchiseId");
  }

  const endpoint = `${CUSTOMER_ENDPOINTS.managerDelete
    ? CUSTOMER_ENDPOINTS.managerDelete(id)
    : `/customers/manager/${id}`
  }${buildQuery({
    managerFranchiseId,
  })}`;

  const res = await apiCall(HTTP_METHODS.DELETE, endpoint);

  return extractData(res);
};

/**
 * Search user/customer cho POS hoặc staff.
 * Quan trọng:
 * - id ưu tiên là customerId để POS create order gửi đúng customerId.
 * - userId vẫn giữ riêng để loyalty/customer sync dùng.
 */
export const searchUsers = async (keyword = "") => {
  try {
    const page = await searchCustomers({
      keyword,
      page: 0,
      size: 10,
    });

    return page.items.map((item) => {
      const customerId = getCustomerIdFromData(item);
      const userId = getUserIdFromData(item);

      return {
        ...item,

        // POS cần id này là customerId.
        id: customerId || userId,
        customerId,
        customer_id: customerId,
        customerFranchiseId: customerId,

        userId,
        user_id: userId,
        identityUserId: userId,

        username: item.username || "",
        fullName: item.fullName || "",
        email: item.email || "",
        phone: item.phone || "",
        avatarUrl: item.avatarUrl || "",

        loyaltyInfo: {
          loyaltyTier: item.loyaltyTier || item.loyaltyInfo?.loyaltyTier || "BRONZE",
          currentPoint:
            item.currentPoint ??
            item.currentPoints ??
            item.loyaltyInfo?.currentPoint ??
            item.loyaltyInfo?.currentPoints ??
            0,
          currentPoints:
            item.currentPoints ??
            item.currentPoint ??
            item.loyaltyInfo?.currentPoints ??
            item.loyaltyInfo?.currentPoint ??
            0,
          totalPoint:
            item.totalPoint ??
            item.loyaltyInfo?.totalPoint ??
            0,
        },
      };
    });
  } catch (error) {
    console.error("Search users failed:", error);
    return [];
  }
};

/**
 * Backward-compatible aliases
 */
export const SearchCustomers = searchCustomers;
export const GetCustomers = getCustomersForAdmin;
export const UpdateCustomer = updateCustomer;
export const DeleteCustomer = deleteCustomer;
export const UpdateCustomerStatus = updateCustomerStatus;

export const SaveCustomerFranchise = syncCustomerFromIdentity;

export const customerService = {
  getAllCustomersLegacy,
  getCustomersForAdmin,
  getCustomersForManager,
  searchCustomerFranchises,
  searchCustomerFranchisesForAdmin,
  searchCustomerFranchisesForManager,
  searchCustomers,
  searchUsers,
  getCustomersByIds,
  getCustomerById,
  getCustomerFranchiseDetail,
  syncCustomerFromIdentity,
  syncCustomerToFranchise,
  createCustomerAtFranchise,
  updateCustomer,
  updateCustomerStatus,
  updateCustomerStatusForManager,
  deleteCustomer,
  deleteCustomerForManager,

  // aliases giữ tương thích với code cũ
  searchAll: searchCustomers,
  searchByFranchise: searchCustomerFranchisesForManager,

  // bản cũ thiếu franchiseId nên không còn nên dùng
  syncCustomerInternal: ({ userId, franchiseId, type = "REGISTERED" }) =>
    syncCustomerFromIdentity({ userId, franchiseId, type }),
};

export default customerService;