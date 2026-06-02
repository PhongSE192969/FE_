import {
  X,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { formatCurrency } from "@/utils/helpers";
import {
  ORDER_STATUS,
  TYPE_ORDER,
  getOrderStatusLabel,
  getTypeOrderLabel,
  normalizeOrderStatus,
  normalizeTypeOrder,
} from "@/services/orderService";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const getStatusBadgeClass = (status) => {
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

const getCustomerName = (order) => {
  if (order?.customerName && order.customerName.toLowerCase() !== "guest") {
    return order.customerName;
  }

  if (order?.customerId) return "Khách hàng";

  return "Khách lẻ";
};

export default function OrderDetailDrawer({ selectedOrder, setSelectedOrder }) {
  const { language } = useLanguageStore();
  const t =
    translations[language]?.components?.orderDetailDrawer ||
    translations.vi.components.orderDetailDrawer ||
    {};

  if (!selectedOrder) return null;

  const status = normalizeOrderStatus(selectedOrder.orderStatus || selectedOrder.status);
  const typeOrder = normalizeTypeOrder(selectedOrder.typeOrder);
  const orderDetails = Array.isArray(selectedOrder.orderDetails)
    ? selectedOrder.orderDetails
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="flex h-full w-[500px] flex-col bg-white shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {t.title || "Chi tiết đơn phân bón"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Theo dõi sản phẩm, giao hàng và thanh toán
            </p>
          </div>

          <button
            onClick={() => setSelectedOrder(null)}
            className="rounded-full bg-gray-50 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* GENERAL INFO */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Clock size={16} className="text-orange-500" />
              {t.generalInfo || "Thông tin chung"}
            </h3>

            <div className="space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">{t.orderId || "Mã đơn"}</span>
                <span className="max-w-[260px] break-all text-right font-mono font-bold text-orange-600">
                  {selectedOrder.id || "N/A"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">{t.date || "Ngày tạo"}</span>
                <span className="text-right font-semibold text-slate-800">
                  {selectedOrder.createAt
                    ? new Date(selectedOrder.createAt).toLocaleString()
                    : "N/A"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  {t.branchId || "Chi nhánh"}
                </span>
                <span className="max-w-[260px] break-all text-right font-semibold text-slate-800">
                  {selectedOrder.franchiseId || "N/A"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  {t.staffId || "Nhân viên"}
                </span>
                <span className="max-w-[260px] break-all text-right font-semibold text-slate-800">
                  {selectedOrder.staffId || "Chưa phân công"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Loại đơn</span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    typeOrder === TYPE_ORDER.ONLINE
                      ? "border-blue-100 bg-blue-50 text-blue-700"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {getTypeOrderLabel(typeOrder)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">{t.status || "Trạng thái"}</span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                    status
                  )}`}
                >
                  {getStatusIcon(status)}
                  {getOrderStatusLabel(status)}
                </span>
              </div>
            </div>
          </div>

          {/* CUSTOMER */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <User size={16} className="text-emerald-600" />
              {t.customer || "Khách hàng"}
            </h3>

            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <User size={18} />
                </div>

                <div className="min-w-0">
                  <p className="font-bold text-slate-900">
                    {getCustomerName(selectedOrder)}
                  </p>

                  <p className="truncate text-sm text-gray-500">
                    ID: {selectedOrder.customerId || "Khách lẻ"}
                  </p>
                </div>
              </div>

              {typeOrder === TYPE_ORDER.ONLINE && (
                <>
                  <hr className="my-3 border-emerald-100" />

                  <div className="flex gap-2 text-sm text-slate-700">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                    <span>
                      {selectedOrder.address || "Chưa có địa chỉ giao hàng"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* PRODUCTS */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShoppingBag size={16} className="text-emerald-600" />
              {t.productList || "Danh sách phân bón"}
            </h3>

            <div className="space-y-3">
              {orderDetails.length > 0 ? (
                orderDetails.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
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
                        <Package size={22} className="text-gray-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-bold text-slate-900">
                        {item.productNameSnapshot || "Sản phẩm phân bón"}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Mã biến thể: {item.productVariantId || "N/A"}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          SL: <b>{item.quantity || 0}</b>
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(item.cost || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                  Không có sản phẩm trong đơn hàng
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <CreditCard size={16} className="text-orange-500" />
              {t.payment || "Thanh toán"}
            </h3>

            <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng tiền hàng</span>
                <span className="font-semibold">
                  {formatCurrency(selectedOrder.totalItems || 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  {t.shippingPrice || "Phí giao hàng"}
                </span>
                <span className="font-semibold">
                  {formatCurrency(selectedOrder.priceShip || 0)}
                </span>
              </div>

              <div className="flex justify-between text-red-500">
                <span>{t.discount || "Giảm giá"}</span>
                <span className="font-semibold">
                  - {formatCurrency(selectedOrder.totalDiscount || 0)}
                </span>
              </div>

              <hr />

              <div className="flex justify-between font-bold text-slate-900">
                <span>{t.finalAmount || "Tổng thanh toán"}</span>
                <span className="text-lg text-orange-500">
                  {formatCurrency(selectedOrder.totalDue || 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">{t.paymentMethod || "Loại đơn"}</span>
                <span className="font-semibold">
                  {getTypeOrderLabel(typeOrder)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t bg-white p-5">
          <button
            onClick={() => setSelectedOrder(null)}
            className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            Đóng chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}