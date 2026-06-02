import { useEffect, useRef, useState } from "react";
import {
  Eye,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
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

const ResizableHeader = ({ width, onResize, children }) => {
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = (event) => {
    event.preventDefault();
    setIsResizing(true);
    startX.current = event.clientX;
    startWidth.current = width;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event) => {
      const newWidth = Math.max(
        70,
        startWidth.current + (event.clientX - startX.current)
      );
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onResize]);

  return (
    <th
      className="group relative select-none p-4 text-left transition-colors hover:bg-gray-100"
      style={{ width: width ? `${width}px` : undefined }}
    >
      <div className="flex items-center justify-between">
        <span className="truncate">{children}</span>
      </div>

      <div
        onMouseDown={handleMouseDown}
        className={`absolute bottom-0 right-0 top-0 z-10 w-1 cursor-col-resize hover:bg-orange-500 ${
          isResizing ? "bg-orange-500" : "bg-transparent group-hover:bg-gray-300"
        }`}
      />
    </th>
  );
};

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

const getCustomerText = (order) => {
  if (order?.customerName && order.customerName.toLowerCase() !== "guest") {
    return order.customerName;
  }

  if (order?.customerId) return order.customerId;

  return "Khách lẻ";
};

const getTypeBadgeClass = (typeOrder) => {
  const normalized = normalizeTypeOrder(typeOrder);

  if (normalized === TYPE_ORDER.ONLINE) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (normalized === TYPE_ORDER.POS) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  return "bg-gray-50 text-gray-600 border-gray-100";
};

export default function OrderTable({
  orders = [],
  loading = false,
  showBranch = false,
  setSelectedOrder,
}) {
  const { language } = useLanguageStore();
  const t =
    translations[language]?.components?.orderTable ||
    translations.vi.components.orderTable ||
    {};

  const [widths, setWidths] = useState({
    id: 170,
    date: 180,
    branch: 170,
    customer: 190,
    typeOrder: 120,
    total: 140,
    status: 190,
    action: 110,
  });

  const handleResize = (column, newWidth) => {
    setWidths((prev) => ({
      ...prev,
      [column]: newWidth,
    }));
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="font-semibold text-gray-500">
          {t.loading || "Đang tải danh sách đơn phân bón..."}
        </p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
        <ShoppingBag size={46} className="mx-auto mb-3 text-gray-300" />
        <p className="font-bold text-gray-600">
          {t.empty || "Không có đơn phân bón"}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Đơn hàng sẽ hiển thị tại đây khi khách đặt mua phân bón.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full min-w-[1050px] table-fixed">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <ResizableHeader
              width={widths.id}
              onResize={(width) => handleResize("id", width)}
            >
              {t.colOrderId || "Mã đơn"}
            </ResizableHeader>

            <ResizableHeader
              width={widths.date}
              onResize={(width) => handleResize("date", width)}
            >
              {t.colDate || "Ngày tạo"}
            </ResizableHeader>

            {showBranch && (
              <ResizableHeader
                width={widths.branch}
                onResize={(width) => handleResize("branch", width)}
              >
                {t.colBranch || "Chi nhánh"}
              </ResizableHeader>
            )}

            <ResizableHeader
              width={widths.customer}
              onResize={(width) => handleResize("customer", width)}
            >
              {t.colCustomer || "Khách hàng"}
            </ResizableHeader>

            <ResizableHeader
              width={widths.typeOrder}
              onResize={(width) => handleResize("typeOrder", width)}
            >
              Loại đơn
            </ResizableHeader>

            <ResizableHeader
              width={widths.total}
              onResize={(width) => handleResize("total", width)}
            >
              {t.colTotal || "Tổng tiền"}
            </ResizableHeader>

            <ResizableHeader
              width={widths.status}
              onResize={(width) => handleResize("status", width)}
            >
              {t.colStatus || "Trạng thái"}
            </ResizableHeader>

            <ResizableHeader
              width={widths.action}
              onResize={(width) => handleResize("action", width)}
            >
              {t.colAction || "Thao tác"}
            </ResizableHeader>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const status = normalizeOrderStatus(order.orderStatus || order.status);
            const typeOrder = normalizeTypeOrder(order.typeOrder);

            return (
              <tr
                key={order.id}
                className="border-t transition-colors hover:bg-emerald-50/30"
              >
                <td className="truncate p-4 font-mono font-bold text-orange-600">
                  {order.id || "N/A"}
                </td>

                <td className="truncate p-4 text-sm text-gray-600">
                  {order.createAt
                    ? new Date(order.createAt).toLocaleString()
                    : t.na || "N/A"}
                </td>

                {showBranch && (
                  <td className="truncate p-4 text-sm text-gray-600">
                    {order.franchiseId || t.na || "N/A"}
                  </td>
                )}

                <td className="truncate p-4 text-sm font-semibold text-slate-800">
                  {getCustomerText(order)}
                </td>

                <td className="p-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getTypeBadgeClass(
                      typeOrder
                    )}`}
                  >
                    {getTypeOrderLabel(typeOrder)}
                  </span>
                </td>

                <td className="truncate p-4 font-bold text-slate-900">
                  {formatCurrency(order.totalDue || 0)}
                </td>

                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                      status
                    )}`}
                  >
                    {getStatusIcon(status)}
                    {getOrderStatusLabel(status)}
                  </span>
                </td>

                <td className="p-4">
                  <button
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-orange-600 transition hover:bg-orange-50 hover:text-orange-700"
                    onClick={() => setSelectedOrder?.(order)}
                  >
                    <Eye size={16} />
                    Xem
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}