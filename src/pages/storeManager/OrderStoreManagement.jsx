import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
  RefreshCw,
  Truck,
} from "lucide-react";
import toast from "react-hot-toast";

import { formatCurrency } from "../../utils/helpers";
import { useLanguageStore, useAuthStore } from "@/stores";
import { translations } from "@/locales";
import {
  getOrdersByFranchise,
  searchOrders,
  updateOrderStatus,
  ORDER_STATUS,
} from "@/services/orderService";
import { getFranchises } from "@/services/franchiseService";
import OrderDetailModal from "@/components/order/OrderDetailModal";

const ORDER_STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING_PAYMENT", label: "Pending Payment Init" },
  { value: "PAYMENT_PENDING", label: "Payment Pending" },
  { value: "PAID", label: "Paid" },
  { value: "WAITING_FOR_CONFIRMATION", label: "Waiting For Confirmation" },
  { value: "PREPARING", label: "Preparing" },
  { value: "SHIPPING", label: "Shipping" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const TYPE_ORDER_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "POS", label: "In-Store / POS" },
  { value: "ONLINE", label: "Online Delivery" },
];

const STATUS_LABELS = {
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

const TYPE_ORDER_LABELS = {
  POS: "Tại quầy",
  ONLINE: "Online",
};

const normalizeResponseData = (response) => {
  return response?.data?.data || response?.data || response;
};

const normalizeStatus = (status) => {
  if (!status || status === "ALL") return "ALL";

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

const normalizeTypeOrder = (typeOrder) => {
  if (!typeOrder || typeOrder === "ALL") return "ALL";

  const value = String(typeOrder).toUpperCase();

  if (value === "ONLINE") return "ONLINE";
  if (value === "POS") return "POS";

  return value;
};

const normalizeStatusOptions = (options) => {
  if (!Array.isArray(options) || options.length === 0) {
    return ORDER_STATUS_OPTIONS;
  }

  const validValues = new Set(ORDER_STATUS_OPTIONS.map((item) => item.value));

  const normalized = options
    .map((item) => ({
      ...item,
      value: normalizeStatus(item.value),
    }))
    .filter((item) => validValues.has(item.value));

  const hasAll = normalized.some((item) => item.value === "ALL");

  return hasAll
    ? normalized
    : [{ value: "ALL", label: "All Statuses" }, ...normalized];
};

const normalizeTypeOptions = (options) => {
  if (!Array.isArray(options) || options.length === 0) {
    return TYPE_ORDER_OPTIONS;
  }

  const validValues = new Set(TYPE_ORDER_OPTIONS.map((item) => item.value));

  const normalized = options
    .map((item) => ({
      ...item,
      value: normalizeTypeOrder(item.value),
    }))
    .filter((item) => validValues.has(item.value));

  const hasAll = normalized.some((item) => item.value === "ALL");

  return hasAll
    ? normalized
    : [{ value: "ALL", label: "All Types" }, ...normalized];
};

const normalizePageData = (response) => {
  const data = normalizeResponseData(response);

  return {
    content: Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data)
        ? data
        : [],
    totalPages: data?.totalPages || 1,
  };
};

const normalizeSearchData = (response) => {
  const data = normalizeResponseData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;

  return [];
};

const getStatusLabel = (status, dict = {}) => {
  const normalized = normalizeStatus(status);

  if (normalized === "ALL") return "ALL";

  return dict?.[normalized] || STATUS_LABELS[normalized] || normalized;
};

const getTypeOrderLabel = (typeOrder) => {
  const normalized = normalizeTypeOrder(typeOrder);

  if (normalized === "ALL") return "ALL";

  return TYPE_ORDER_LABELS[normalized] || normalized;
};

const getStatusBadge = (status) => {
  const normalized = normalizeStatus(status);

  const styles = {
    PENDING_PAYMENT: "bg-orange-100 text-orange-700 border-orange-200",
    PAYMENT_PENDING: "bg-orange-100 text-orange-700 border-orange-200",
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
    WAITING_FOR_CONFIRMATION:
      "bg-amber-100 text-amber-700 border-amber-200",
    PREPARING: "bg-indigo-100 text-indigo-700 border-indigo-200",
    SHIPPING: "bg-blue-100 text-blue-700 border-blue-200",
    COMPLETED: "bg-green-100 text-green-700 border-green-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
    FAILED: "bg-red-100 text-red-700 border-red-200",
    REFUNDED: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return styles[normalized] || "bg-gray-100 text-gray-700 border-gray-200";
};

const getStatusIcon = (status) => {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "PAID":
    case "COMPLETED":
      return <CheckCircle2 size={14} />;

    case "WAITING_FOR_CONFIRMATION":
    case "PENDING_PAYMENT":
    case "PAYMENT_PENDING":
      return <Clock size={14} />;

    case "PREPARING":
      return <Package size={14} />;

    case "SHIPPING":
      return <Truck size={14} />;

    case "CANCELLED":
    case "FAILED":
    case "REFUNDED":
      return <XCircle size={14} />;

    default:
      return <Clock size={14} />;
  }
};

const canManagerConfirmOrder = (status) => {
  const normalized = normalizeStatus(status);

  return [
    "PENDING_PAYMENT",
    "PAYMENT_PENDING",
    "PAID",
    "WAITING_FOR_CONFIRMATION",
  ].includes(normalized);
};

const getOrderDate = (order) => {
  const raw = order.createAt || order.createdAt || order.created_at;

  if (!raw) return "";

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString();
};

const getCustomerName = (order) => {
  return (
    order.customerName ||
    order.customerFullName ||
    order.customer?.fullName ||
    (order.customerId ? "Khách hàng" : "Khách lẻ")
  );
};

export default function OrderStoreManagement() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const t =
    (translations[language] || translations.vi).staff?.orderManagement || {};
  const rootOrder =
    (translations[language] || translations.vi).orderManagement || {};

  const STATUS_OPTIONS = normalizeStatusOptions(rootOrder.statusOptions);
  const TYPE_OPTIONS = normalizeTypeOptions(rootOrder.typeOptions);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeOrderFilter, setTypeOrderFilter] = useState("ALL");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [franchiseMap, setFranchiseMap] = useState({});

  const franchiseId =
    user?.franchise?.id ||
    user?.franchiseId ||
    user?.franchise_id ||
    null;

  useEffect(() => {
    const loadFranchises = async () => {
      try {
        const response = await getFranchises();
        const data = normalizeResponseData(response);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : [];

        const map = {};

        list.forEach((franchise) => {
          map[franchise.id] =
            franchise.name || franchise.franchiseName || franchise.id;
        });

        setFranchiseMap(map);
      } catch (error) {
        console.error("Failed to fetch franchises:", error);
      }
    };

    loadFranchises();
  }, []);

  const fetchOrders = async () => {
    if (!franchiseId) return;

    setLoading(true);

    try {
      let response;

      if (searchQuery.trim()) {
        response = await searchOrders(franchiseId, searchQuery.trim());

        const list = normalizeSearchData(response);

        setOrders(list);
        setTotalPages(1);
      } else {
        const safeStatus = normalizeStatus(statusFilter);
        const safeTypeOrder = normalizeTypeOrder(typeOrderFilter);

        response = await getOrdersByFranchise(
          franchiseId,
          safeStatus === "ALL" ? null : safeStatus,
          safeTypeOrder === "ALL" ? null : safeTypeOrder,
          page,
          10
        );

        const pageData = normalizePageData(response);

        setOrders(pageData.content);
        setTotalPages(pageData.totalPages);
      }
    } catch (error) {
      console.error("Load orders failed:", error);
      toast.error("Không tải được danh sách đơn hàng");
      setOrders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(0);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, typeOrderFilter, page, franchiseId, searchQuery]);

  const filteredOrders = useMemo(() => orders, [orders]);

  const handleConfirmOrder = async (order) => {
    if (!order?.id || updatingOrderId) return;

    try {
      setUpdatingOrderId(order.id);

      await updateOrderStatus(order.id, ORDER_STATUS.PREPARING, user?.id);

      toast.success("Đã xác nhận đơn hàng");

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                orderStatus: ORDER_STATUS.PREPARING,
                staffId: user?.id || item.staffId,
              }
            : item
        )
      );

      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                orderStatus: ORDER_STATUS.PREPARING,
                staffId: user?.id || prev.staffId,
              }
            : prev
        );
      }

      fetchOrders();
    } catch (error) {
      console.error("Confirm order failed:", error);
      toast.error("Xác nhận đơn thất bại");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleQuickNextStatus = async (order, nextStatus, successMessage) => {
    if (!order?.id || updatingOrderId) return;

    try {
      setUpdatingOrderId(order.id);

      await updateOrderStatus(order.id, nextStatus, user?.id);

      toast.success(successMessage || "Đã cập nhật đơn hàng");

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                orderStatus: nextStatus,
                staffId: user?.id || item.staffId,
              }
            : item
        )
      );

      fetchOrders();
    } catch (error) {
      console.error("Update order status failed:", error);
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const renderQuickAction = (order) => {
    const status = normalizeStatus(order.orderStatus || order.status);

    if (canManagerConfirmOrder(status)) {
      return (
        <button
          disabled={updatingOrderId === order.id}
          onClick={() => handleConfirmOrder(order)}
          className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updatingOrderId === order.id ? "Đang xác nhận..." : "Xác nhận đơn"}
        </button>
      );
    }

    if (status === "PREPARING") {
      return (
        <button
          disabled={updatingOrderId === order.id}
          onClick={() =>
            handleQuickNextStatus(
              order,
              ORDER_STATUS.SHIPPING,
              "Đã chuyển sang giao hàng"
            )
          }
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updatingOrderId === order.id ? "Đang cập nhật..." : "Giao hàng"}
        </button>
      );
    }

    if (status === "SHIPPING") {
      return (
        <button
          disabled={updatingOrderId === order.id}
          onClick={() =>
            handleQuickNextStatus(
              order,
              ORDER_STATUS.COMPLETED,
              "Đã hoàn tất đơn hàng"
            )
          }
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updatingOrderId === order.id ? "Đang hoàn tất..." : "Hoàn tất"}
        </button>
      );
    }

    return null;
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((order) =>
      canManagerConfirmOrder(order.orderStatus || order.status)
    ).length,
    preparing: orders.filter(
      (order) => normalizeStatus(order.orderStatus || order.status) === "PREPARING"
    ).length,
    ready: orders.filter(
      (order) => normalizeStatus(order.orderStatus || order.status) === "SHIPPING"
    ).length,
    completed: orders.filter(
      (order) => normalizeStatus(order.orderStatus || order.status) === "COMPLETED"
    ).length,
    totalRevenue: orders.reduce(
      (sum, order) => sum + Number(order.totalDue || order.total || 0),
      0
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center relative z-20">
        <div>
          <h1 className="text-2xl font-black text-primary">
            {t.title || "Quản lý đơn phân bón"}
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            {t.subtitle || "Xem và xử lý đơn hàng tại chi nhánh"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchOrders}
            className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-slate-600 border border-gray-200 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>{t.refresh || "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
          <p className="text-xl font-black text-primary">{stats.total}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Waiting</p>
          <p className="text-xl font-black text-orange-600">{stats.pending}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">
            Preparing
          </p>
          <p className="text-xl font-black text-indigo-600">
            {stats.preparing}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Shipping</p>
          <p className="text-xl font-black text-blue-600">{stats.ready}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">
            Completed
          </p>
          <p className="text-xl font-black text-green-600">
            {stats.completed}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Revenue</p>
          <p className="text-sm font-black text-primary">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Tìm đơn hàng theo mã đơn"
              value={searchInput}
              onChange={(event) => {
                setPage(0);
                setSearchInput(event.target.value);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#d9a13b]/20 focus:border-[#d9a13b] transition-all outline-none"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={typeOrderFilter}
              onChange={(event) => {
                setPage(0);
                setTypeOrderFilter(normalizeTypeOrder(event.target.value));
              }}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#d9a13b]/20 focus:border-[#d9a13b] cursor-pointer"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(0);
                setStatusFilter(normalizeStatus(event.target.value));
              }}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#d9a13b]/20 focus:border-[#d9a13b] cursor-pointer"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw
              size={48}
              className="mx-auto mb-3 animate-spin opacity-50"
            />
            <p className="font-medium">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package size={48} className="mx-auto mb-3 opacity-50" />

            <p className="font-medium">
              {t.empty?.title || "No orders found"}
            </p>

            <p className="text-sm mt-1">
              {t.empty?.subtitle || "Orders will appear here after checkout"}
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      {t.table?.orderId || "Order ID"}
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      {t.modal?.branch || "Chi nhánh"}
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      {t.table?.customer || "Customer"}
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Loại đơn
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      {t.table?.total || "Total"}
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      {t.table?.time || "Time"}
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      {t.table?.status || "Status"}
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      {t.table?.actions || "Actions"}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const orderStatus = normalizeStatus(order.orderStatus);
                    const typeOrder = normalizeTypeOrder(order.typeOrder);

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td
                          className="px-6 py-4 font-bold text-primary text-sm font-mono cursor-pointer hover:text-primary/80 transition-colors"
                          onClick={() =>
                            setExpandedOrderId(
                              expandedOrderId === order.id ? null : order.id
                            )
                          }
                          title={order.id}
                        >
                          {expandedOrderId === order.id
                            ? order.id
                            : `${String(order.id).substring(0, 8)}...`}
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                            {franchiseMap[order.franchiseId] ||
                              order.franchiseName ||
                              order.franchiseId ||
                              "N/A"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">
                            {getCustomerName(order)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            {getTypeOrderLabel(typeOrder)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-primary">
                            {formatCurrency(order.totalDue || 0)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {getOrderDate(order)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                              orderStatus
                            )}`}
                          >
                            {getStatusIcon(orderStatus)}
                            {getStatusLabel(
                              orderStatus,
                              rootOrder.statusBadge
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1"
                            >
                              <Eye size={16} />
                              {t.table?.view || "View"}
                            </button>

                            {renderQuickAction(order)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white px-6 py-3 border-t border-gray-100">
              <div className="text-sm text-gray-500 font-bold">
                Trang <span className="text-primary">{page + 1}</span> /{" "}
                {totalPages}
              </div>

              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setPage(index)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                      page === index
                        ? "bg-primary text-white border-primary"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages - 1, current + 1)
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={fetchOrders}
          showActions={true}
          showBranch={false}
          showOrderIdInHeader={false}
        />
      )}
    </div>
  );
}