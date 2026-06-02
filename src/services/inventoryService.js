import { apiCall, ENDPOINTS } from "@/config/api";

const HTTP = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
};

export const extractData = (res) => {
  return res?.data?.data || res?.data || res;
};

export const extractPageContent = (res) => {
  const data = extractData(res);

  return Array.isArray(data?.content)
    ? data.content
    : Array.isArray(res?.data?.data?.content)
      ? res.data.data.content
      : Array.isArray(res?.data?.content)
        ? res.data.content
        : Array.isArray(res?.content)
          ? res.content
          : Array.isArray(data)
            ? data
            : [];
};

export const extractPageMeta = (res) => {
  const data = extractData(res);

  return {
    content: extractPageContent(res),
    pageNo: data?.pageNo ?? data?.number ?? data?.page ?? 0,
    pageSize: data?.pageSize ?? data?.size ?? 10,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 1,
    last: data?.last ?? true,
  };
};

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.append(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const toBackendPage = (page = 0) => {
  const number = Number(page || 0);

  if (Number.isNaN(number) || number < 0) return 0;

  // Nếu FE truyền 1, 2, 3 thì đổi sang 0, 1, 2.
  // Nếu FE đã truyền 0 thì giữ nguyên.
  return number > 0 ? number - 1 : 0;
};

const normalizeQuantity = (value, fallback = 1) => {
  const number = Number(value ?? fallback);

  if (Number.isNaN(number) || number <= 0) return fallback;

  return number;
};

const normalizeItems = (items = []) => {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      productVariantId: item.productVariantId || item.variantId,
      quantity: normalizeQuantity(item.quantity ?? item.qty, 1),
    }))
    .filter((item) => item.productVariantId);
};

/**
 * Lấy danh sách tồn kho.
 * Backend:
 * GET /api/inventory/stocks?locationId=&lowStock=false&page=0&size=10
 */
export const getStocks = async (
  locationId = null,
  lowStock = false,
  page = 0,
  size = 10
) => {
  try {
    const endpoint = `/inventory/stocks${buildQuery({
      locationId,
      lowStock: lowStock ? "true" : null,
      page: toBackendPage(page),
      size,
    })}`;

    return await apiCall(HTTP.GET, endpoint);
  } catch (error) {
    console.error("Get stocks error:", error);
    throw error;
  }
};

/**
 * Nhập kho ban đầu.
 * Backend:
 * POST /api/inventory/stocks/receipt
 */
export const addInitialStock = async (payload = {}) => {
  try {
    const endpoint = "/inventory/stocks/receipt";

    const normalizedPayload = {
      productVariantId: payload.productVariantId || payload.variantId,
      quantity: normalizeQuantity(payload.quantity, 1),
      locationId: payload.locationId || null,
      notes: payload.notes || "",
      createdBy: payload.createdBy || null,
    };

    return await apiCall(HTTP.POST, endpoint, normalizedPayload);
  } catch (error) {
    console.error("Add initial stock error:", error);
    throw error;
  }
};

/**
 * Lấy variant còn hàng theo location.
 * Backend:
 * GET /api/inventory/stocks/variants/in-stock?locationId=
 */
export const getInStockVariantIds = async (locationId) => {
  try {
    const endpoint = `/inventory/stocks/variants/in-stock${buildQuery({
      locationId,
    })}`;

    return await apiCall(HTTP.GET, endpoint);
  } catch (error) {
    console.error("Get in-stock variant ids error:", error);
    throw error;
  }
};

/**
 * Lấy danh sách chi nhánh có thể đáp ứng.
 * Backend:
 * POST /api/inventory/stocks/capable-branches
 */
export const getCapableBranches = async (payload) => {
  try {
    const endpoint = "/inventory/stocks/capable-branches";
    return await apiCall(HTTP.POST, endpoint, normalizeItems(payload));
  } catch (error) {
    console.error("Get capable branches error:", error);
    throw error;
  }
};

/**
 * Reserve stock.
 * Backend:
 * POST /api/inventory/stocks/reserve?locationId=
 */
export const reserveStock = async (items, locationId) => {
  try {
    const endpoint = `/inventory/stocks/reserve${buildQuery({ locationId })}`;
    return await apiCall(HTTP.POST, endpoint, normalizeItems(items));
  } catch (error) {
    console.error("Reserve stock error:", error);
    throw error;
  }
};

/**
 * Release reserved stock.
 * Backend:
 * POST /api/inventory/stocks/release?locationId=
 */
export const releaseStock = async (items, locationId) => {
  try {
    const endpoint = `/inventory/stocks/release${buildQuery({ locationId })}`;
    return await apiCall(HTTP.POST, endpoint, normalizeItems(items));
  } catch (error) {
    console.error("Release stock error:", error);
    throw error;
  }
};

/**
 * Commit stock.
 * Backend:
 * POST /api/inventory/stocks/commit?locationId=
 */
export const commitStock = async (items, locationId) => {
  try {
    const endpoint = `/inventory/stocks/commit${buildQuery({ locationId })}`;
    return await apiCall(HTTP.POST, endpoint, normalizeItems(items));
  } catch (error) {
    console.error("Commit stock error:", error);
    throw error;
  }
};

/**
 * Lấy lịch sử giao dịch.
 * Backend:
 * GET /api/inventory/transactions?locationId=&from=&to=&page=&size=
 */
export const getTransactions = async (
  locationId = null,
  from = null,
  to = null,
  page = 0,
  size = 10
) => {
  try {
    const endpoint = `/inventory/transactions${buildQuery({
      locationId,
      from,
      to,
      page: toBackendPage(page),
      size,
    })}`;

    return await apiCall(HTTP.GET, endpoint);
  } catch (error) {
    console.error("Get transactions error:", error);
    throw error;
  }
};

/**
 * Lấy danh sách lệnh điều chuyển.
 * Backend:
 * GET /api/inventory/transfers?page=&size=&fromLocationId=
 */
export const getTransfers = async (
  page = 0,
  size = 10,
  fromLocationId = null
) => {
  try {
    const endpoint = `/inventory/transfers${buildQuery({
      page: toBackendPage(page),
      size,
      fromLocationId,
    })}`;

    return await apiCall(HTTP.GET, endpoint);
  } catch (error) {
    console.error("Get transfers error:", error);
    throw error;
  }
};

/**
 * Lấy chi tiết lệnh điều chuyển.
 * Backend:
 * GET /api/inventory/transfers/{id}
 */
export const getTransferById = async (transferId) => {
  try {
    const endpoint = `/inventory/transfers/${transferId}`;
    return await apiCall(HTTP.GET, endpoint);
  } catch (error) {
    console.error("Get transfer detail error:", error);
    throw error;
  }
};

/**
 * Tạo lệnh điều chuyển.
 * Backend:
 * POST /api/inventory/transfers
 */
export const createTransfer = async (payload = {}) => {
  try {
    const endpoint = "/inventory/transfers";

    const normalizedPayload = {
      fromLocationId: payload.fromLocationId,
      toLocationId: payload.toLocationId,
      type: payload.type || "WAREHOUSE_TO_FRANCHISE",
      notes: payload.notes || "",
      createdBy: payload.createdBy || null,
      referenceRequestId: payload.referenceRequestId || null,
      items: normalizeItems(payload.items),
    };

    return await apiCall(HTTP.POST, endpoint, normalizedPayload);
  } catch (error) {
    console.error("Create transfer error:", error);
    throw error;
  }
};

/**
 * Xuất hàng lệnh điều chuyển.
 * Backend:
 * PUT /api/inventory/transfers/{id}/ship
 */
export const shipStockTransfer = async (transferId) => {
  try {
    const endpoint = `/inventory/transfers/${transferId}/ship`;
    return await apiCall(HTTP.PUT, endpoint);
  } catch (error) {
    console.error("Ship transfer error:", error);
    throw error;
  }
};

/**
 * Nhận hàng lệnh điều chuyển.
 * Backend:
 * PUT /api/inventory/transfers/{id}/receive
 */
export const receiveStockTransfer = async (transferId) => {
  try {
    const endpoint = `/inventory/transfers/${transferId}/receive`;
    return await apiCall(HTTP.PUT, endpoint);
  } catch (error) {
    console.error("Receive transfer error:", error);
    throw error;
  }
};

/**
 * Từ chối lệnh điều chuyển.
 * Backend:
 * PUT /api/inventory/transfers/{id}/reject
 */
export const rejectTransfer = async (transferId) => {
  try {
    const endpoint = `/inventory/transfers/${transferId}/reject`;
    return await apiCall(HTTP.PUT, endpoint);
  } catch (error) {
    console.error("Reject transfer error:", error);
    throw error;
  }
};

/**
 * Tạo yêu cầu nhập hàng.
 * Backend:
 * POST /api/inventory/requests
 */
export const createStockRequest = async (payload = {}) => {
  try {
    const endpoint =
      ENDPOINTS?.PROTECTED?.STORE_REQUESTS?.create || "/inventory/requests";

    const normalizedPayload = {
      franchiseId: payload.franchiseId,
      notes: payload.notes || "",
      createdBy: payload.createdBy || null,
      items: normalizeItems(payload.items),
    };

    return await apiCall(HTTP.POST, endpoint, normalizedPayload);
  } catch (error) {
    console.error("Create stock request error:", error);
    throw error;
  }
};

/**
 * Lấy danh sách yêu cầu nhập hàng.
 * Backend:
 * GET /api/inventory/requests
 * GET /api/inventory/requests?franchiseId=
 */
export const getStockRequests = async (franchiseId = null) => {
  try {
    const endpoint = `/inventory/requests${buildQuery({ franchiseId })}`;
    return await apiCall(HTTP.GET, endpoint);
  } catch (error) {
    console.error("Get stock requests error:", error);
    throw error;
  }
};

/**
 * Lấy chi tiết yêu cầu nhập hàng.
 * Backend:
 * GET /api/inventory/requests/{id}
 */
export const getStockRequestById = async (requestId) => {
  try {
    const endpoint = `/inventory/requests/${requestId}`;
    return await apiCall(HTTP.GET, endpoint);
  } catch (error) {
    console.error("Get stock request detail error:", error);
    throw error;
  }
};

/**
 * Phê duyệt yêu cầu nhập hàng.
 * Backend:
 * PUT /api/inventory/requests/{id}/approve?sourceLocationId=&approvedBy=
 */
export const approveStockRequest = async (
  requestId,
  sourceLocationId,
  approvedBy = null
) => {
  try {
    const endpoint = `/inventory/requests/${requestId}/approve${buildQuery({
      sourceLocationId,
      approvedBy,
    })}`;

    return await apiCall(HTTP.PUT, endpoint);
  } catch (error) {
    console.error("Approve request error:", error);
    throw error;
  }
};

/**
 * Xuất hàng yêu cầu nhập hàng.
 * Backend:
 * PUT /api/inventory/requests/{id}/ship
 */
export const shipStockRequest = async (requestId) => {
  try {
    const endpoint = `/inventory/requests/${requestId}/ship`;
    return await apiCall(HTTP.PUT, endpoint);
  } catch (error) {
    console.error("Ship request error:", error);
    throw error;
  }
};

/**
 * Nhận hàng yêu cầu nhập hàng.
 * Backend:
 * PUT /api/inventory/requests/{id}/receive
 */
export const receiveStockRequest = async (requestId) => {
  try {
    const endpoint = `/inventory/requests/${requestId}/receive`;
    return await apiCall(HTTP.PUT, endpoint);
  } catch (error) {
    console.error("Receive request error:", error);
    throw error;
  }
};

/**
 * Từ chối yêu cầu nhập hàng.
 * Backend:
 * PUT /api/inventory/requests/{id}/reject?reason=
 */
export const rejectStockRequest = async (requestId, reason = "") => {
  try {
    const endpoint = `/inventory/requests/${requestId}/reject${buildQuery({
      reason,
    })}`;

    return await apiCall(HTTP.PUT, endpoint);
  } catch (error) {
    console.error("Reject request error:", error);
    throw error;
  }
};

/**
 * Legacy compatible aliases
 */
export const getInventory = getStocks;

export const getInventoryByFranchise = async (franchiseId) => {
  return getStocks(franchiseId, false, 0, 10);
};

export const getLowStockInventory = async () => {
  return getStocks(null, true, 0, 10);
};

export const searchInventory = async (productName, franchiseId) => {
  const res = await getStocks(franchiseId, false, 0, 500);
  const page = extractPageMeta(res);

  const keyword = productName?.trim().toLowerCase();

  if (!keyword) return page.content;

  return page.content.filter((item) =>
    item.productName?.toLowerCase().includes(keyword)
  );
};

export const updateInventoryThreshold = async () => {
  throw new Error(
    "updateInventoryThreshold is not supported by current inventory-service backend."
  );
};

export const approveTransfer = shipStockTransfer;
export const completeTransfer = receiveStockTransfer;