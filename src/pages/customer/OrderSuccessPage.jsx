import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";

import { checkPaymentStatus } from "@/services/paymentService";
import { useCartStore } from "../../stores/cartStore";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const extractData = (response) => {
  return response?.data?.data || response?.data || response;
};

const normalizeStatus = (status) => {
  if (!status) return "UNKNOWN";

  const value = String(status).trim().toUpperCase();

  const legacyMap = {
    PAID: "SUCCESS",
    SUCCESSFUL: "SUCCESS",
    FAIL: "FAILED",
    CANCELED: "CANCELLED",
  };

  return legacyMap[value] || value;
};

const getStatusConfig = (status, t = {}) => {
  const normalized = normalizeStatus(status);

  const configs = {
    SUCCESS: {
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      bgClass: "bg-emerald-50 border-emerald-200",
      title: t.success?.title || "Đặt đơn phân bón thành công!",
      subtitle:
        t.success?.subtitle ||
        "Cảm ơn bạn đã đặt hàng. Cửa hàng sẽ xử lý đơn trong thời gian sớm nhất.",
      statusLabel: "Thanh toán thành công",
      statusClass: "text-emerald-600",
    },

    PENDING: {
      icon: Clock,
      iconClass: "text-orange-600",
      bgClass: "bg-orange-50 border-orange-200",
      title: "Đơn hàng đang chờ thanh toán",
      subtitle:
        "Giao dịch đang được xử lý. Bạn có thể vào chi tiết đơn hàng để kiểm tra lại trạng thái.",
      statusLabel: "Đang chờ thanh toán",
      statusClass: "text-orange-600",
    },

    CREATED: {
      icon: Clock,
      iconClass: "text-orange-600",
      bgClass: "bg-orange-50 border-orange-200",
      title: "Đã tạo giao dịch thanh toán",
      subtitle:
        "Giao dịch đã được tạo nhưng chưa hoàn tất. Vui lòng kiểm tra lại sau.",
      statusLabel: "Đã tạo giao dịch",
      statusClass: "text-orange-600",
    },

    CANCELLED: {
      icon: XCircle,
      iconClass: "text-red-600",
      bgClass: "bg-red-50 border-red-200",
      title: t.failed?.title || "Thanh toán đã bị hủy",
      subtitle:
        t.failed?.subtitle ||
        "Giao dịch chưa hoàn tất. Bạn có thể quay lại giỏ hàng hoặc kiểm tra đơn hàng.",
      statusLabel: "Đã hủy thanh toán",
      statusClass: "text-red-600",
    },

    FAILED: {
      icon: XCircle,
      iconClass: "text-red-600",
      bgClass: "bg-red-50 border-red-200",
      title: t.failed?.title || "Thanh toán thất bại",
      subtitle:
        t.failed?.subtitle ||
        "Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức khác.",
      statusLabel: "Thanh toán thất bại",
      statusClass: "text-red-600",
    },

    EXPIRED: {
      icon: XCircle,
      iconClass: "text-red-600",
      bgClass: "bg-red-50 border-red-200",
      title: "Giao dịch đã hết hạn",
      subtitle:
        "Thời gian thanh toán đã hết. Vui lòng tạo lại đơn hoặc chọn phương thức thanh toán khác.",
      statusLabel: "Đã hết hạn",
      statusClass: "text-red-600",
    },

    REFUNDED: {
      icon: RefreshCw,
      iconClass: "text-slate-600",
      bgClass: "bg-slate-50 border-slate-200",
      title: "Giao dịch đã hoàn tiền",
      subtitle: "Khoản thanh toán của đơn hàng này đã được hoàn lại.",
      statusLabel: "Đã hoàn tiền",
      statusClass: "text-slate-600",
    },

    UNKNOWN: {
      icon: Clock,
      iconClass: "text-slate-600",
      bgClass: "bg-slate-50 border-slate-200",
      title: "Chưa xác định trạng thái thanh toán",
      subtitle:
        "Không lấy được trạng thái giao dịch. Bạn vẫn có thể vào chi tiết đơn hàng để kiểm tra.",
      statusLabel: "Không xác định",
      statusClass: "text-slate-600",
    },
  };

  return configs[normalized] || configs.UNKNOWN;
};

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("orderId");

  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).customer?.orderResult || {};

  const { clearCart, removeSelected } = useCartStore();

  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  const normalizedStatus = normalizeStatus(status);
  const config = useMemo(
    () => getStatusConfig(normalizedStatus, t),
    [normalizedStatus, t]
  );

  const StatusIcon = config.icon;

  const isSuccess = normalizedStatus === "SUCCESS";
  const isPending = normalizedStatus === "PENDING" || normalizedStatus === "CREATED";

  useEffect(() => {
    if (!orderId) {
      setStatus("UNKNOWN");
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        setLoading(true);

        const response = await checkPaymentStatus(orderId);
        const data = extractData(response);

        setStatus(normalizeStatus(data));
      } catch (error) {
        console.error("Failed to get payment status", error);
        setStatus("UNKNOWN");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [orderId]);

  useEffect(() => {
    if (!isSuccess) return;

    try {
      const purchasedItems = JSON.parse(
        localStorage.getItem("checkoutItems") || "[]"
      );

      const keysToRemove = purchasedItems
        .map((item) => item.key)
        .filter(Boolean);

      if (keysToRemove.length > 0) {
        removeSelected(keysToRemove);
      } else {
        clearCart();
      }

      localStorage.removeItem("checkoutItems");
    } catch (error) {
      console.error("Failed to clear purchased items", error);
      clearCart();
    }
  }, [isSuccess, clearCart, removeSelected]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf5] flex items-center justify-center px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <RefreshCw className="mx-auto mb-4 animate-spin text-orange-500" size={42} />
          <h1 className="text-xl font-black text-slate-800">
            Đang kiểm tra thanh toán...
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Hệ thống đang cập nhật trạng thái đơn phân bón của bạn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf5] px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div
          className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border ${config.bgClass}`}
        >
          <StatusIcon size={52} className={config.iconClass} />
        </div>

        <h1 className="mb-4 text-3xl font-black text-slate-900">
          {config.title}
        </h1>

        <p className="mx-auto mb-6 max-w-xl text-gray-500">
          {config.subtitle}
        </p>

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm">
          <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
            <ShoppingBag className="text-emerald-600" size={22} />
            <div>
              <h2 className="font-black text-slate-800">
                Thông tin đơn hàng
              </h2>
              <p className="text-xs text-gray-400">
                Đơn hàng franchise phân bón
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <span className="text-gray-500">
                {t.orderId || "Mã đơn hàng"}
              </span>
              <span className="break-all text-right font-mono font-bold text-slate-800">
                {orderId || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">
                {t.status || "Trạng thái thanh toán"}
              </span>
              <span className={`font-black ${config.statusClass}`}>
                {config.statusLabel}
              </span>
            </div>

            {isPending && (
              <div className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
                Giao dịch có thể cần thêm thời gian để cập nhật. Nếu bạn đã thanh toán,
                vui lòng mở chi tiết đơn để kiểm tra lại sau.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {orderId && (
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
            >
              {t.viewOrder || "Xem chi tiết đơn"}
            </button>
          )}

          <button
            onClick={() => navigate("/products")}
            className="rounded-xl border border-emerald-600 px-6 py-3 font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            {t.continueShopping || "Tiếp tục mua phân bón"}
          </button>

          {!isSuccess && (
            <button
              onClick={() => navigate("/checkout-payment")}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-bold text-gray-700 transition hover:bg-white"
            >
              <ArrowLeft size={16} />
              {t.backToCheckout || "Quay lại thanh toán"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}