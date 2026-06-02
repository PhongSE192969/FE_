import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  Phone,
  MapPin,
  ArrowLeft,
  XCircle,
  Clock,
  CreditCard,
  RefreshCw,
  Banknote,
} from "lucide-react";
import toast from "react-hot-toast";
import { Client } from "@stomp/stompjs";

import { formatCurrency } from "@/utils/helpers";
import { getOrderById, updateOrderStatus } from "@/services/orderService";
import {
  getPaymentTransaction,
  extractPaymentResponseData,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  normalizePaymentStatus,
} from "@/services/paymentService";
import { useLanguageStore, useAuthStore } from "@/stores";
import { translations } from "@/locales";
import ENV from "@/config/env";

const ORDER_STATUS = {
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

const normalizeOrderStatus = (status) => {
  if (!status) return ORDER_STATUS.PENDING_PAYMENT;

  const value = String(status).trim().toUpperCase();

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

const normalizeTypeOrder = (typeOrder) => {
  if (!typeOrder) return "";

  const value = String(typeOrder).trim().toUpperCase();

  if (value === "ONLINE") return "ONLINE";
  if (value === "POS") return "POS";

  return value;
};

const getFirstImage = (imageStr) => {
  if (!imageStr) return null;
  if (String(imageStr).startsWith("http")) return imageStr;

  try {
    const images = JSON.parse(imageStr);
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
  } catch {
    return imageStr;
  }

  return null;
};

const getOrderData = (response) => {
  return response?.data?.data || response?.data || response;
};

const getOrderStatusLabel = (status) => {
  const normalized = normalizeOrderStatus(status);

  const labels = {
    PENDING_PAYMENT: "Chờ tạo thanh toán",
    PAYMENT_PENDING: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    WAITING_FOR_CONFIRMATION: "Chờ xác nhận",
    PREPARING: "Đang chuẩn bị",
    SHIPPING: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    FAILED: "Thất bại",
    REFUNDED: "Đã hoàn tiền",
  };

  return labels[normalized] || normalized;
};

const getOrderStatusClass = (status) => {
  const normalized = normalizeOrderStatus(status);

  const classes = {
    PENDING_PAYMENT: "bg-orange-100 text-orange-800 border-orange-200",
    PAYMENT_PENDING: "bg-orange-100 text-orange-800 border-orange-200",
    PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
    WAITING_FOR_CONFIRMATION: "bg-amber-100 text-amber-800 border-amber-200",
    PREPARING: "bg-indigo-100 text-indigo-800 border-indigo-200",
    SHIPPING: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
    REFUNDED: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return classes[normalized] || "bg-gray-100 text-gray-700 border-gray-200";
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

const getProgressIndex = (status) => {
  const normalized = normalizeOrderStatus(status);

  const map = {
    PENDING_PAYMENT: 0,
    PAYMENT_PENDING: 0,
    PAID: 0,
    WAITING_FOR_CONFIRMATION: 0,
    PREPARING: 1,
    SHIPPING: 2,
    COMPLETED: 3,
  };

  return map[normalized] ?? 0;
};

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id: orderId } = useParams();

  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t =
    (translations[language] || translations.vi).customer?.orderDetail || {};

  const [order, setOrder] = useState(null);
  const [paymentTransaction, setPaymentTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const normalizedStatus = normalizeOrderStatus(order?.orderStatus);
  const normalizedTypeOrder = normalizeTypeOrder(order?.typeOrder);

  const steps = useMemo(
    () => [
      {
        label: t.steps?.waiting_for_confirmation || "Chờ xác nhận",
        icon: ShoppingBag,
      },
      {
        label: t.steps?.preparing || "Đang chuẩn bị",
        icon: Package,
      },
      {
        label: t.steps?.shipping || "Đang giao",
        icon: Truck,
      },
      {
        label: t.steps?.completed || "Hoàn thành",
        icon: CheckCircle,
      },
    ],
    [t]
  );

  const currentStep = getProgressIndex(normalizedStatus);

  const paymentMethodName =
    paymentTransaction?.paymentMethodName ||
    paymentTransaction?.paymentMethodResponse?.methodName ||
    paymentTransaction?.method ||
    null;

  const paymentStatus = normalizePaymentStatus(paymentTransaction?.status);

  const loadOrder = async () => {
    if (!orderId) return;

    try {
      setLoading(true);

      const response = await getOrderById(orderId);
      const data = getOrderData(response);

      setOrder(data || null);
    } catch (error) {
      console.error("Fetch order error:", error);
      setOrder(null);
      toast.error("Không tải được chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentTransaction = async () => {
    if (!orderId) return;

    try {
      const response = await getPaymentTransaction(orderId);
      const data = extractPaymentResponseData(response);

      setPaymentTransaction(data || null);
    } catch (error) {
      console.log("No payment transaction available", error);
      setPaymentTransaction(null);
    }
  };

  useEffect(() => {
    loadOrder();
    loadPaymentTransaction();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;

    const stompClient = new Client({
      brokerURL: `${ENV.BASE_URL.replace(
        /^http/,
        "ws"
      )}/api/inventory/ws-inventory`,
      reconnectDelay: 5000,
      debug: (str) => console.log("Stomp Debug: ", str),
    });

    stompClient.onConnect = () => {
      console.log("Connected to WebSocket (OrderDetail)!");

      stompClient.subscribe(`/topic/order/${orderId}`, (message) => {
        console.log("WebSocket Status Update:", message.body);

        const newStatus = normalizeOrderStatus(message.body);

        setOrder((prev) =>
          prev ? { ...prev, orderStatus: newStatus } : prev
        );

        toast.success(`Trạng thái đơn hàng: ${getOrderStatusLabel(newStatus)}`, {
          icon: "🔔",
        });
      });
    };

    stompClient.onStompError = (frame) => {
      console.error("WebSocket Error (OrderDetail):", frame.headers.message);
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [orderId]);

  const handleConfirmReceipt = async () => {
    if (!orderId) return;

    try {
      setIsConfirming(true);

      await updateOrderStatus(orderId, ORDER_STATUS.COMPLETED);

      setOrder((prev) =>
        prev ? { ...prev, orderStatus: ORDER_STATUS.COMPLETED } : prev
      );

      toast.success("Đã xác nhận nhận hàng thành công");
    } catch (error) {
      console.error("Confirm receipt failed", error);
      toast.error(t.toasts?.confirmFailed || "Xác nhận thất bại!");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;

    try {
      setIsCancelling(true);

      await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);

      setOrder((prev) =>
        prev ? { ...prev, orderStatus: ORDER_STATUS.CANCELLED } : prev
      );

      setIsCancelModalOpen(false);
      toast.success("Đã hủy đơn hàng");
    } catch (error) {
      console.error("Cancel order failed", error);
      toast.error(t.toasts?.cancelFailed || "Hủy đơn thất bại!");
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf5] px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <RefreshCw className="mx-auto mb-4 animate-spin text-orange-500" size={42} />
          <p className="font-semibold text-slate-700">
            {t.loading || "Đang tải đơn hàng..."}
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf5] px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto mb-4 text-red-500" size={46} />
          <h1 className="text-xl font-black text-slate-800">
            {t.notFound || "Không tìm thấy đơn hàng"}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 font-bold text-white hover:bg-orange-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf5] px-4 py-10 lg:px-20">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          {t.back || "Quay lại"}
        </button>

        {/* HEADER */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {t.detailsTitle || "Chi tiết đơn phân bón"}
              </h1>

              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
                <Clock size={14} className="text-gray-400/80" />
                {order.createAt
                  ? `Đặt lúc ${new Date(order.createAt).toLocaleString()}`
                  : "Không có thời gian tạo đơn"}
              </p>

              <p className="mt-2 break-all font-mono text-xs text-gray-400">
                Mã đơn: {order.id}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${getOrderStatusClass(
                  normalizedStatus
                )}`}
              >
                {getOrderStatusLabel(normalizedStatus)}
              </span>

              {normalizedStatus === ORDER_STATUS.SHIPPING && (
                <button
                  disabled={isConfirming}
                  onClick={handleConfirmReceipt}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white transition ${
                    isConfirming
                      ? "cursor-not-allowed bg-emerald-400"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isConfirming ? (
                    <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  {isConfirming
                    ? t.confirming || "Đang xác nhận..."
                    : t.confirmReceipt || "Xác nhận đã nhận"}
                </button>
              )}

              {canCancelOrder(normalizedStatus) && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                >
                  <XCircle size={14} />
                  {t.cancelOrder || "Hủy đơn"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-bold text-slate-900">
            {t.productList || "Danh sách phân bón"}
          </h2>

          <div className="space-y-4">
            {order.orderDetails?.length > 0 ? (
              order.orderDetails.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border-b border-gray-50 px-2 py-4 transition-colors last:border-0 hover:bg-emerald-50/40"
                >
                  <div className="flex size-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
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
                      <div className="text-emerald-600/50">
                        <ShoppingBag size={22} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-900">
                      {item.productNameSnapshot || "Sản phẩm phân bón"}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {t.quantity
                        ? t.quantity.replace("{count}", item.quantity)
                        : `Số lượng: ${item.quantity}`}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Mã biến thể: {item.productVariantId || "N/A"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">
                      {formatCurrency(item.cost || 0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(item.priceSnapshot || 0)} / sản phẩm
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                Không có chi tiết sản phẩm trong đơn hàng
              </div>
            )}
          </div>
        </div>

        {/* ORDER STATUS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-bold text-slate-900">
            {t.orderStatus || "Trạng thái đơn hàng"}
          </h2>

          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-5 h-[2px] w-full bg-gray-200" />

            {steps.map((step, index) => {
              const active = index <= currentStep;
              const Icon = step.icon;

              return (
                <div
                  key={index}
                  className="relative flex flex-1 flex-col items-center text-center"
                >
                  <div
                    className={`z-10 flex size-10 items-center justify-center rounded-full shadow ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Icon size={16} />
                  </div>

                  <p
                    className={`mt-2 text-xs font-bold ${
                      active ? "text-emerald-700" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* CUSTOMER */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">
              {t.customerInfo?.title || "Thông tin khách hàng"}
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">
                  {t.customerInfo?.name || "Tên khách hàng"}
                </span>
                <span className="text-right font-semibold">
                  {user?.fullName || order.customerName || "Khách hàng"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Loại đơn</span>
                <span className="font-semibold">
                  {normalizedTypeOrder === "ONLINE"
                    ? "Giao hàng online"
                    : normalizedTypeOrder === "POS"
                      ? "Mua tại cửa hàng"
                      : "N/A"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-400">
                  {t.customerInfo?.address || "Địa chỉ"}
                </span>
                <span className="max-w-[260px] text-right font-semibold">
                  {order.address || "Không có địa chỉ"}
                </span>
              </div>

              {normalizedTypeOrder === "ONLINE" && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Khoảng cách</span>
                  <span className="font-semibold">
                    {order.distance != null ? `${order.distance} km` : "N/A"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">
              {t.paymentInfo?.title || "Thông tin thanh toán"}
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">
                  {t.paymentInfo?.subtotal || "Tổng tiền hàng"}
                </span>
                <span className="font-semibold">
                  {formatCurrency(order.totalItems || 0)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-400">
                  {t.paymentInfo?.shipping || "Phí vận chuyển"}
                </span>

                <span className="font-semibold">
                  {Number(order.priceShip || 0) === 0
                    ? t.paymentInfo?.free || "Miễn phí"
                    : formatCurrency(order.priceShip || 0)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Giảm giá</span>
                <span className="font-semibold text-red-500">
                  - {formatCurrency(order.totalDiscount || 0)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="flex items-center gap-1 text-gray-400">
                  <CreditCard size={14} />
                  Phương thức
                </span>
                <span className="font-semibold">
                  {paymentMethodName
                    ? getPaymentMethodLabel(paymentMethodName)
                    : "Chưa có thông tin"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="flex items-center gap-1 text-gray-400">
                  <Banknote size={14} />
                  Trạng thái thanh toán
                </span>
                <span className="font-semibold">
                  {paymentStatus
                    ? getPaymentStatusLabel(paymentStatus)
                    : "Chưa có giao dịch"}
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between gap-4 text-lg font-bold text-slate-900">
                  <span>{t.paymentInfo?.total || "Tổng thanh toán"}</span>
                  <span className="text-orange-500">
                    {formatCurrency(order.totalDue || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CANCEL CONFIRMATION MODAL */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
            <div className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle size={24} />
                <h3 className="text-lg font-black">
                  {t.cancelConfirm || "Hủy đơn hàng"}
                </h3>
              </div>

              <p className="text-sm text-gray-500">
                {t.cancelConfirmDesc ||
                  "Bạn có chắc chắn muốn hủy đơn phân bón này không? Thao tác này không thể hoàn tác."}
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-60"
                >
                  {t.close || "Đóng"}
                </button>

                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 disabled:opacity-60"
                >
                  {isCancelling ? "Đang hủy..." : t.cancelButton || "Hủy đơn"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}