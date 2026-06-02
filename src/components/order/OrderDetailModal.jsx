import { useEffect, useMemo, useState } from "react";
import {
  XCircle,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CreditCard,
  Banknote,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

import { formatCurrency } from "../../utils/helpers";
import { useLanguageStore, useAuthStore } from "@/stores";
import { translations } from "@/locales";
import {
  updateOrderStatus,
  getOrderById,
  ORDER_STATUS,
  TYPE_ORDER,
  getOrderStatusLabel,
  getTypeOrderLabel,
  normalizeOrderStatus,
  normalizeTypeOrder,
} from "@/services/orderService";
import {
  getPaymentTransaction,
  extractPaymentResponseData,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  normalizePaymentStatus,
} from "@/services/paymentService";
import { SearchUsersByIds } from "@/services/userService";

const getFirstImage = (imageStr) => {
  if (!imageStr) return null;

  const value = String(imageStr);

  if (value.startsWith("http")) return value;

  try {
    const images = JSON.parse(value);

    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
  } catch {
    return value;
  }

  return null;
};

const extractOrderData = (response) => {
  return response?.data?.data || response?.data || response;
};

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

const canCancelOrder = (status) => {
  const normalized = normalizeOrderStatus(status);

  return [
    ORDER_STATUS.PENDING_PAYMENT,
    ORDER_STATUS.PAYMENT_PENDING,
    ORDER_STATUS.PAID,
    ORDER_STATUS.WAITING_FOR_CONFIRMATION,
    ORDER_STATUS.PREPARING,
  ].includes(normalized);
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

const getCustomerDisplayName = (order, customerName) => {
  if (customerName) return customerName;

  if (order?.customerName && order.customerName.toLowerCase() !== "guest") {
    return order.customerName;
  }

  if (order?.customerId) return "Khách hàng";

  return "Khách lẻ";
};

export default function OrderDetailModal({
  order,
  onClose,
  onRefresh,
  showActions = true,
  franchiseMap = {},
  showBranch = true,
  showOrderIdInHeader = true,
}) {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();

  const t =
    (translations[language] || translations.vi).staff?.orderManagement || {};
  const rootOrder =
    (translations[language] || translations.vi).orderManagement || {};

  const [paymentDetails, setPaymentDetails] = useState(null);
  const [staffName, setStaffName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [fullOrder, setFullOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const displayOrder = fullOrder || order;

  const normalizedStatus = normalizeOrderStatus(
    displayOrder?.orderStatus || displayOrder?.status
  );

  const normalizedTypeOrder = normalizeTypeOrder(displayOrder?.typeOrder);

  const orderDetails = useMemo(() => {
    if (Array.isArray(displayOrder?.orderDetails)) return displayOrder.orderDetails;
    if (Array.isArray(order?.orderDetails)) return order.orderDetails;
    return [];
  }, [displayOrder, order]);

  const paymentMethodName =
    paymentDetails?.paymentMethodName ||
    paymentDetails?.paymentMethodResponse?.methodName ||
    paymentDetails?.method ||
    null;

  const paymentStatus = normalizePaymentStatus(paymentDetails?.status);

  useEffect(() => {
    const fetchData = async () => {
      if (!order?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const promises = [
          getPaymentTransaction(order.id).catch((error) => {
            console.log("No payment transaction found", error);
            return null;
          }),
          getOrderById(order.id).catch((error) => {
            console.error("Failed to fetch full order details", error);
            return null;
          }),
        ];

        const userIdsToFetch = [];

        if (order.staffId) userIdsToFetch.push(order.staffId);

        if (
          order.customerId &&
          (!order.customerName || order.customerName.toLowerCase() === "guest")
        ) {
          userIdsToFetch.push(order.customerId);
        }

        if (userIdsToFetch.length > 0) {
          promises.push(
            SearchUsersByIds(userIdsToFetch).catch((error) => {
              console.error("Failed to fetch user names", error);
              return null;
            })
          );
        }

        const [paymentResponse, orderResponse, usersResponse] =
          await Promise.all(promises);

        const paymentData = extractPaymentResponseData(paymentResponse);
        setPaymentDetails(paymentData || null);

        const orderData = extractOrderData(orderResponse);
        setFullOrder(orderData || order);

        const usersData =
          usersResponse?.data?.data ||
          usersResponse?.data ||
          usersResponse ||
          [];

        if (Array.isArray(usersData) && usersData.length > 0) {
          const staffUser = usersData.find((item) => item.id === order.staffId);
          const customerUser = usersData.find(
            (item) => item.id === order.customerId
          );

          if (staffUser) {
            setStaffName(
              staffUser.fullName || staffUser.username || staffUser.email || ""
            );
          } else {
            setStaffName(order.staffId || "");
          }

          if (customerUser) {
            setCustomerName(
              customerUser.fullName ||
                customerUser.username ||
                customerUser.email ||
                ""
            );
          } else {
            setCustomerName(order.customerName || "");
          }
        } else {
          setStaffName(order.staffId || "");
          setCustomerName(order.customerName || "");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [order]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId || isUpdating) return;

    try {
      setIsUpdating(true);

      await updateOrderStatus(orderId, newStatus, user?.id);

      toast.success(`Đã cập nhật đơn sang: ${getOrderStatusLabel(newStatus)}`);

      setFullOrder((prev) =>
        prev
          ? {
              ...prev,
              orderStatus: newStatus,
              staffId: user?.id || prev.staffId,
            }
          : prev
      );

      if (newStatus !== ORDER_STATUS.CANCELLED) {
        setStaffName(user?.fullName || user?.username || user?.email || staffName);
      }

      if (onRefresh) onRefresh();

      if (newStatus === ORDER_STATUS.CANCELLED && onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Update order status failed", error);
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderPrimaryAction = () => {
    if (!showActions) return null;

    if (canStaffConfirmOrder(normalizedStatus)) {
      return (
        <button
          disabled={isUpdating}
          onClick={() =>
            handleStatusChange(displayOrder.id, ORDER_STATUS.PREPARING)
          }
          className="flex-1 rounded-xl bg-orange-600 py-3 text-sm font-black text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-700 active:scale-95 disabled:opacity-60"
        >
          {isUpdating ? "Đang xác nhận..." : "Xác nhận đơn"}
        </button>
      );
    }

    if (normalizedStatus === ORDER_STATUS.PREPARING) {
      return (
        <button
          disabled={isUpdating}
          onClick={() =>
            handleStatusChange(displayOrder.id, ORDER_STATUS.SHIPPING)
          }
          className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-60"
        >
          {isUpdating ? "Đang cập nhật..." : "Chuyển sang giao hàng"}
        </button>
      );
    }

    if (normalizedStatus === ORDER_STATUS.SHIPPING) {
      return (
        <button
          disabled={isUpdating}
          onClick={() =>
            handleStatusChange(displayOrder.id, ORDER_STATUS.COMPLETED)
          }
          className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
        >
          {isUpdating ? "Đang hoàn tất..." : "Hoàn tất đơn hàng"}
        </button>
      );
    }

    return null;
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl animate-in overflow-y-auto rounded-2xl bg-white shadow-2xl duration-200 fade-in zoom-in">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              {t.modal?.title || "Chi tiết đơn phân bón"}
            </h3>

            {showOrderIdInHeader && (
              <p className="mt-0.5 font-mono text-xs text-gray-400">
                {displayOrder?.id || order.id}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:text-gray-600"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              <p className="animate-pulse font-bold text-gray-500">
                Đang tải chi tiết đơn phân bón...
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in duration-300 fade-in slide-in-from-bottom-2">
              {/* GENERAL INFO */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                <h4 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold text-gray-900">
                  <Clock size={16} className="text-orange-500" />
                  {t.modal?.generalInfo || "Thông tin chung"}
                </h4>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  {showBranch && displayOrder?.franchiseId && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Chi nhánh
                      </label>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {franchiseMap[displayOrder.franchiseId] ||
                          displayOrder.franchiseId}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Khách hàng
                    </label>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {getCustomerDisplayName(displayOrder, customerName)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Nhân viên xác nhận
                    </label>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {staffName || "Chưa có nhân viên xác nhận"}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Thời gian đặt
                    </label>
                    <p className="mt-1 text-sm text-gray-700">
                      {displayOrder?.createAt
                        ? new Date(displayOrder.createAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Trạng thái
                    </label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black ${getStatusBadge(
                          normalizedStatus
                        )}`}
                      >
                        {getStatusIcon(normalizedStatus)}
                        {rootOrder.statusBadge?.[normalizedStatus] ||
                          getOrderStatusLabel(normalizedStatus)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Loại đơn
                    </label>
                    <p
                      className={`mt-1 inline-block rounded-md px-2 py-0.5 text-sm font-bold ${
                        normalizedTypeOrder === TYPE_ORDER.ONLINE
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {getTypeOrderLabel(normalizedTypeOrder)}
                    </p>
                  </div>
                </div>
              </div>

              {/* DELIVERY INFO */}
              {normalizedTypeOrder === TYPE_ORDER.ONLINE && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                  <h4 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold text-gray-900">
                    <MapPin size={16} className="text-emerald-600" />
                    Thông tin giao hàng
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Địa chỉ nhận hàng
                      </label>
                      <p className="mt-1 rounded-xl border border-gray-100 bg-white p-3 text-sm leading-relaxed text-gray-700 shadow-sm">
                        {displayOrder?.address || "Chưa cập nhật"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-xl bg-white p-3 border border-gray-100">
                        <p className="text-xs text-gray-400">Khoảng cách</p>
                        <p className="font-bold text-slate-900">
                          {displayOrder?.distance != null
                            ? `${displayOrder.distance} km`
                            : "N/A"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3 border border-gray-100">
                        <p className="text-xs text-gray-400">Phí giao hàng</p>
                        <p className="font-bold text-slate-900">
                          {formatCurrency(displayOrder?.priceShip || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ITEMS */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                <h4 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold text-gray-900">
                  <ShoppingBag size={16} className="text-emerald-600" />
                  Danh sách sản phẩm phân bón
                </h4>

                <div className="space-y-3">
                  {orderDetails.length > 0 ? (
                    orderDetails.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-colors hover:border-emerald-300"
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                          {item.productImageUrl ? (
                            <img
                              src={getFirstImage(item.productImageUrl)}
                              alt={item.productNameSnapshot}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.target.onerror = null;
                                event.target.src =
                                  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=400";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <Package size={24} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-900">
                            {item.productNameSnapshot || "Sản phẩm phân bón"}
                          </h4>

                          <p className="mt-1 text-xs font-bold text-gray-500">
                            Số lượng: {item.quantity}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Mã biến thể: {item.productVariantId || "N/A"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-black text-slate-900">
                            {formatCurrency(
                              Number(item.priceSnapshot || 0) *
                                Number(item.quantity || 0)
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {formatCurrency(item.priceSnapshot || 0)} / sản phẩm
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
                      Không có chi tiết sản phẩm
                    </div>
                  )}
                </div>
              </div>

              {/* PAYMENT SUMMARY */}
              <div className="space-y-3 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="font-medium">Tổng tiền hàng</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(displayOrder?.totalItems || 0)}
                  </span>
                </div>

                {normalizedTypeOrder === TYPE_ORDER.ONLINE && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="font-medium">Phí giao hàng</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(displayOrder?.priceShip || 0)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-red-500">
                  <span className="font-medium">Giảm giá</span>
                  <span className="font-bold">
                    - {formatCurrency(displayOrder?.totalDiscount || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1 font-medium">
                    <CreditCard size={14} />
                    Phương thức thanh toán
                  </span>
                  <span className="font-bold text-gray-900">
                    {paymentMethodName
                      ? getPaymentMethodLabel(paymentMethodName)
                      : "Chưa có thông tin"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Banknote size={14} />
                    Trạng thái thanh toán
                  </span>
                  <span className="font-bold text-gray-900">
                    {paymentStatus
                      ? getPaymentStatusLabel(paymentStatus)
                      : "Chưa có giao dịch"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
                  <span className="text-base font-black uppercase tracking-wider text-slate-900">
                    Tổng thanh toán
                  </span>
                  <span className="text-2xl font-black text-orange-500">
                    {formatCurrency(displayOrder?.totalDue || 0)}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              {showActions && (
                <div className="flex gap-3 border-t border-gray-100 pt-6">
                  {canCancelOrder(normalizedStatus) && (
                    <button
                      disabled={isUpdating}
                      onClick={() => setOrderToCancel(displayOrder)}
                      className="rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-black text-red-600 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-60"
                    >
                      Hủy đơn
                    </button>
                  )}

                  {renderPrimaryAction()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {orderToCancel && (
        <div className="fixed inset-0 z-[60] flex animate-in items-center justify-center bg-black/60 p-4 duration-200 fade-in backdrop-blur-sm">
          <div className="w-full max-w-sm animate-in space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl duration-200 zoom-in">
            <div className="flex items-center gap-3 text-red-600">
              <XCircle size={28} />
              <h3 className="text-xl font-black">Xác nhận hủy đơn</h3>
            </div>

            <p className="text-sm font-medium leading-relaxed text-gray-500">
              Bạn có chắc chắn muốn hủy đơn phân bón{" "}
              <strong className="font-mono text-slate-900">
                {String(orderToCancel.id).substring(0, 8)}...
              </strong>{" "}
              không? Thao tác này không thể hoàn tác.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                disabled={isUpdating}
                onClick={() => setOrderToCancel(null)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-60"
              >
                Đóng
              </button>

              <button
                disabled={isUpdating}
                onClick={async () => {
                  await handleStatusChange(
                    orderToCancel.id,
                    ORDER_STATUS.CANCELLED
                  );
                  setOrderToCancel(null);
                }}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-60"
              >
                {isUpdating ? "Đang hủy..." : "Hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}