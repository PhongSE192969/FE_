import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
  BellIcon,
  RefreshCw,
  Truck,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import { Client } from "@stomp/stompjs";

import { formatCurrency } from "../../utils/helpers";
import { useLanguageStore, useAuthStore } from "@/stores";
import { translations } from "@/locales";
import ENV from "@/config/env";
import {
  getOrdersByFranchise,
  searchOrders,
  updateOrderStatus,
  normalizeListResponse,
  normalizePageResponse,
  ORDER_STATUS,
  TYPE_ORDER,
  ORDER_STATUS_OPTIONS,
  TYPE_ORDER_OPTIONS,
  getOrderStatusLabel,
  getTypeOrderLabel,
  normalizeOrderStatus,
  normalizeTypeOrder,
} from "@/services/orderService";
import { SearchUsersByIds } from "@/services/userService";
import OrderDetailModal from "@/components/order/OrderDetailModal";

const getStatusBadge = (status) => {
  const normalized = normalizeOrderStatus(status) || ORDER_STATUS.PENDING_PAYMENT;

  const styles = {
    PENDING_PAYMENT: "bg-orange-100 text-orange-700 border-orange-200",
    PAYMENT_PENDING: "bg-orange-100 text-orange-700 border-orange-200",
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
    WAITING_FOR_CONFIRMATION: "bg-amber-100 text-amber-700 border-amber-200",
    PREPARING: "bg-indigo-100 text-indigo-700 border-indigo-200",
    SHIPPING: "bg-blue-100 text-blue-700 border-blue-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
    FAILED: "bg-red-100 text-red-700 border-red-200",
    REFUNDED: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return styles[normalized] || "bg-gray-100 text-gray-700 border-gray-200";
};

const getStatusIcon = (status) => {
  const normalized = normalizeOrderStatus(status) || ORDER_STATUS.PENDING_PAYMENT;

  switch (normalized) {
    case ORDER_STATUS.PENDING_PAYMENT:
    case ORDER_STATUS.PAYMENT_PENDING:
    case ORDER_STATUS.WAITING_FOR_CONFIRMATION:
      return <Clock size={14} />;

    case ORDER_STATUS.PAID:
    case ORDER_STATUS.COMPLETED:
      return <CheckCircle2 size={14} />;

    case ORDER_STATUS.PREPARING:
      return <Package size={14} />;

    case ORDER_STATUS.SHIPPING:
      return <Truck size={14} />;

    case ORDER_STATUS.CANCELLED:
    case ORDER_STATUS.FAILED:
    case ORDER_STATUS.REFUNDED:
      return <XCircle size={14} />;

    default:
      return <Clock size={14} />;
  }
};

const canStaffConfirmOrder = (status) => {
  const normalized = normalizeOrderStatus(status);

  return [
    ORDER_STATUS.PENDING_PAYMENT,
    ORDER_STATUS.PAYMENT_PENDING,
    ORDER_STATUS.PAID,
    ORDER_STATUS.WAITING_FOR_CONFIRMATION,
  ].includes(normalized);
};

const getCustomerDisplayName = (order, userMap = {}) => {
  if (order.customerName && order.customerName.toLowerCase() !== "guest") {
    return order.customerName;
  }

  if (order.customerId && userMap[order.customerId]) {
    return userMap[order.customerId];
  }

  if (order.customerId) {
    return "Khách hàng";
  }

  return "Khách lẻ";
};

const getStaffDisplayName = (order, userMap = {}) => {
  if (order.staffId && userMap[order.staffId]) {
    return userMap[order.staffId];
  }

  if (order.staffId) {
    return order.staffId;
  }

  return "Chưa phân công";
};

const isUnhandledOnlineOrder = (order) => {
  const typeOrder = normalizeTypeOrder(order.typeOrder);
  const status = normalizeOrderStatus(order.orderStatus || order.status);

  return (
    typeOrder === TYPE_ORDER.ONLINE &&
    canStaffConfirmOrder(status)
  );
};

export default function OrderManagement() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const t =
    (translations[language] || translations.vi).staff?.orderManagement || {};
  const rootOrder =
    (translations[language] || translations.vi).orderManagement || {};

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeOrderFilter, setTypeOrderFilter] = useState("ALL");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userMap, setUserMap] = useState({});

  const notificationRef = useRef(null);

  const franchiseId =
    user?.franchise?.id ||
    user?.franchiseId ||
    user?.franchise_id ||
    null;

  const filteredOrders = useMemo(() => orders, [orders]);

  const unhandledOnlineOrdersList = useMemo(() => {
    return orders.filter(isUnhandledOnlineOrder);
  }, [orders]);

  const unhandledOnlineOrdersCount = unhandledOnlineOrdersList.length;

  const stats = useMemo(() => {
    return {
      total: orders.length,
      waiting: orders.filter((order) =>
        canStaffConfirmOrder(order.orderStatus || order.status)
      ).length,
      preparing: orders.filter(
        (order) =>
          normalizeOrderStatus(order.orderStatus || order.status) ===
          ORDER_STATUS.PREPARING
      ).length,
      shipping: orders.filter(
        (order) =>
          normalizeOrderStatus(order.orderStatus || order.status) ===
          ORDER_STATUS.SHIPPING
      ).length,
      completed: orders.filter(
        (order) =>
          normalizeOrderStatus(order.orderStatus || order.status) ===
          ORDER_STATUS.COMPLETED
      ).length,
      totalRevenue: orders.reduce(
        (sum, order) => sum + Number(order.totalDue || order.total || 0),
        0
      ),
    };
  }, [orders]);

  useEffect(() => {
    if (!franchiseId) return;

    const stompClient = new Client({
      brokerURL: `${ENV.BASE_URL.replace(
        /^http/,
        "ws"
      )}/api/inventory/ws-inventory`,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log("Stomp Debug: ", str),
    });

    stompClient.onConnect = () => {
      console.log("Connected to WebSocket!");

      stompClient.subscribe(`/topic/franchise/${franchiseId}/orders`, (message) => {
        console.log("WebSocket Message Received:", message.body);

        if (message.body === "NEW_ORDER") {
          toast.success("Có đơn phân bón online mới!", { icon: "🔔" });
        }

        setRefreshTrigger((prev) => prev + 1);
      });
    };

    stompClient.onStompError = (frame) => {
      console.error("WebSocket Error:", frame.headers.message);
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [franchiseId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    if (!franchiseId) {
      setOrders([]);
      setTotalPages(1);
      return;
    }

    setLoading(true);

    try {
      if (searchQuery.trim()) {
        const response = await searchOrders(franchiseId, searchQuery.trim());
        const list = normalizeListResponse(response);

        setOrders(list);
        setTotalPages(1);
      } else {
        const response = await getOrdersByFranchise(
          franchiseId,
          statusFilter,
          typeOrderFilter,
          page,
          10
        );

        const pageData = normalizePageResponse(response);

        setOrders(pageData.content);
        setTotalPages(pageData.totalPages || 1);
      }
    } catch (error) {
      console.error("Load fertilizer orders failed:", error);
      toast.error("Không tải được danh sách đơn phân bón");
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
  }, [
    statusFilter,
    typeOrderFilter,
    page,
    franchiseId,
    searchQuery,
    refreshTrigger,
  ]);

  useEffect(() => {
    const fetchUserNames = async () => {
      const ids = new Set();

      orders.forEach((order) => {
        if (order.staffId) ids.add(order.staffId);
        if (order.customerId) ids.add(order.customerId);
      });

      const missingIds = Array.from(ids).filter((id) => !userMap[id]);

      if (missingIds.length === 0) return;

      try {
        const response = await SearchUsersByIds(missingIds);
        const list = response?.data?.data || response?.data || response || [];

        if (!Array.isArray(list)) return;

        const newNames = {};

        list.forEach((item) => {
          newNames[item.id] =
            item.fullName || item.username || item.email || item.id;
        });

        setUserMap((prev) => ({
          ...prev,
          ...newNames,
        }));
      } catch (error) {
        console.error("Failed to fetch user names", error);
      }
    };

    if (orders.length > 0) {
      fetchUserNames();
    }
  }, [orders, userMap]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId || updatingOrderId) return;

    try {
      setUpdatingOrderId(orderId);

      await updateOrderStatus(orderId, newStatus, user?.id);

      toast.success(`Đã cập nhật đơn sang: ${getOrderStatusLabel(newStatus)}`);

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                orderStatus: newStatus,
                staffId: user?.id || order.staffId,
              }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                orderStatus: newStatus,
                staffId: user?.id || prev.staffId,
              }
            : prev
        );
      }

      fetchOrders();
    } catch (error) {
      console.error("Update status failed", error);
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const renderQuickAction = (order) => {
    const status = normalizeOrderStatus(order.orderStatus || order.status);

    if (canStaffConfirmOrder(status)) {
      return (
        <button
          disabled={updatingOrderId === order.id}
          onClick={() => handleStatusChange(order.id, ORDER_STATUS.PREPARING)}
          className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updatingOrderId === order.id ? "Đang xác nhận..." : "Xác nhận đơn"}
        </button>
      );
    }

    if (status === ORDER_STATUS.PREPARING) {
      return (
        <button
          disabled={updatingOrderId === order.id}
          onClick={() => handleStatusChange(order.id, ORDER_STATUS.SHIPPING)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updatingOrderId === order.id ? "Đang cập nhật..." : "Giao hàng"}
        </button>
      );
    }

    if (status === ORDER_STATUS.SHIPPING) {
      return (
        <button
          disabled={updatingOrderId === order.id}
          onClick={() => handleStatusChange(order.id, ORDER_STATUS.COMPLETED)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updatingOrderId === order.id ? "Đang hoàn tất..." : "Hoàn tất"}
        </button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="relative z-20 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t.title || "Quản lý đơn phân bón"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t.subtitle ||
              "Theo dõi và xử lý đơn hàng phân bón tại chi nhánh"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchOrders}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-gray-100 active:scale-95"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>{t.refresh || "Làm mới"}</span>
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition-colors hover:bg-orange-50"
            >
              <BellIcon
                size={20}
                className={
                  unhandledOnlineOrdersCount > 0
                    ? "text-orange-500"
                    : "text-gray-400"
                }
              />

              {unhandledOnlineOrdersCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 animate-pulse items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                  {unhandledOnlineOrdersCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50 px-4 py-3">
                  <span className="text-sm font-bold text-orange-900">
                    Đơn online chờ xử lý
                  </span>
                  <span className="rounded-full bg-orange-200 px-2 py-0.5 text-xs font-bold text-orange-800">
                    {unhandledOnlineOrdersCount}
                  </span>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {unhandledOnlineOrdersCount === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">
                      <BellIcon size={32} className="mx-auto mb-2 opacity-20" />
                      <p>Không có đơn phân bón online mới.</p>
                    </div>
                  ) : (
                    unhandledOnlineOrdersList.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowNotifications(false);
                        }}
                        className="cursor-pointer border-b border-gray-50 p-4 transition-colors hover:bg-orange-50/50"
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {String(order.id).substring(0, 8)}...
                          </span>
                          <span className="rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                            {getOrderStatusLabel(order.orderStatus)}
                          </span>
                        </div>

                        <div className="text-sm font-semibold text-gray-800">
                          {getCustomerDisplayName(order, userMap)}
                        </div>

                        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                          <span>{order.orderDetails?.length || 0} sản phẩm</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(order.totalDue || 0)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Tổng đơn</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.total}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Chờ xác nhận</p>
          <p className="mt-1 text-2xl font-black text-orange-600">
            {stats.waiting}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Đang chuẩn bị</p>
          <p className="mt-1 text-2xl font-black text-indigo-600">
            {stats.preparing}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Đang giao</p>
          <p className="mt-1 text-2xl font-black text-blue-600">
            {stats.shipping}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Doanh thu trang</p>
          <p className="mt-1 text-lg font-black text-emerald-700">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="relative w-full flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Tìm đơn phân bón theo mã đơn hoặc khách hàng"
              value={searchInput}
              onChange={(event) => {
                setPage(0);
                setSearchInput(event.target.value);
              }}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="flex w-full gap-3 md:w-auto">
            <select
              value={typeOrderFilter}
              onChange={(event) => {
                setPage(0);
                setTypeOrderFilter(event.target.value);
              }}
              className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              {(rootOrder.typeOptions || TYPE_ORDER_OPTIONS).map((option) => (
                <option
                  key={option.value}
                  value={normalizeTypeOrder(option.value) || option.value}
                >
                  {option.label || getTypeOrderLabel(option.value)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(0);
                setStatusFilter(event.target.value);
              }}
              className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              {(rootOrder.statusOptions || ORDER_STATUS_OPTIONS).map((option) => (
                <option
                  key={option.value}
                  value={normalizeOrderStatus(option.value) || option.value}
                >
                  {option.label || getOrderStatusLabel(option.value)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw
              size={48}
              className="mx-auto mb-3 animate-spin opacity-50"
            />
            <p className="font-medium">Đang tải đơn phân bón...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShoppingBag size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">
              {t.empty?.title || "Không tìm thấy đơn hàng"}
            </p>
            <p className="mt-1 text-sm">
              {t.empty?.subtitle || "Đơn phân bón sẽ hiển thị tại đây sau khi đặt hàng"}
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-700">
                      Mã đơn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-700">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-700">
                      Loại đơn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-700">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-700">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-700">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const status = normalizeOrderStatus(order.orderStatus);
                    const typeOrder = normalizeTypeOrder(order.typeOrder);

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-emerald-50/30"
                      >
                        <td
                          className="cursor-pointer px-6 py-4 font-mono text-sm font-bold text-slate-900 transition-colors hover:text-orange-600"
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
                          <span className="text-sm font-semibold text-gray-800">
                            {getCustomerDisplayName(order, userMap)}
                          </span>
                          <div className="mt-0.5 text-[10px] text-gray-400">
                            Nhân viên: {getStaffDisplayName(order, userMap)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                              typeOrder === TYPE_ORDER.ONLINE
                                ? "bg-blue-50 text-blue-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {getTypeOrderLabel(typeOrder)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">
                            {formatCurrency(order.totalDue || 0)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {order.createAt
                              ? new Date(order.createAt).toLocaleString()
                              : ""}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusBadge(
                              status
                            )}`}
                          >
                            {getStatusIcon(status)}
                            {getOrderStatusLabel(status)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
                            >
                              <Eye size={16} />
                              Xem
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

            {/* PAGINATION */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-3">
              <div className="text-sm font-bold text-gray-500">
                Trang <span className="text-slate-900">{page + 1}</span> /{" "}
                {totalPages}
              </div>

              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setPage(index)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                      page === index
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages - 1, prev + 1))
                  }
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
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