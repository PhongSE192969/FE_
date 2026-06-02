import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, CreditCard, QrCode, WalletCards } from "lucide-react";
import { getPaymentMethods } from "@/services/paymentService";
import { useLanguageStore } from "../../stores";
import { translations } from "../../locales";

const extractData = (response) => {
  return response?.data?.data || response?.data || response || [];
};

const normalizeMethodName = (methodName) => {
  if (!methodName) return "";

  const value = String(methodName).trim().toUpperCase();

  if (value === "TIỀN MẶT" || value === "TIEN MAT" || value === "CASH") {
    return "COD";
  }

  if (value === "MOMO") return "MOMO";
  if (value === "VNPAY") return "VNPAY";
  if (value === "COD") return "COD";

  return value;
};

const getMethodLabel = (methodName, t = {}) => {
  const normalized = normalizeMethodName(methodName);

  const labels = {
    MOMO: t.MOMO || "Ví MoMo",
    VNPAY: t.VNPAY || "VNPay",
    COD: t.COD || "Thanh toán khi nhận hàng",
  };

  return labels[normalized] || methodName || "Phương thức thanh toán";
};

const getMethodDescription = (methodName) => {
  const normalized = normalizeMethodName(methodName);

  if (normalized === "MOMO") {
    return "Thanh toán online bằng ví MoMo";
  }

  if (normalized === "VNPAY") {
    return "Thanh toán online bằng cổng VNPay";
  }

  if (normalized === "COD") {
    return "Nhận phân bón rồi thanh toán cho nhân viên giao hàng";
  }

  return "Phương thức thanh toán khả dụng";
};

const getMethodIcon = (methodName) => {
  const normalized = normalizeMethodName(methodName);

  if (normalized === "MOMO") {
    return <WalletCards size={24} className="text-pink-600" />;
  }

  if (normalized === "VNPAY") {
    return <QrCode size={24} className="text-blue-600" />;
  }

  if (normalized === "COD") {
    return <Banknote size={24} className="text-emerald-600" />;
  }

  return <CreditCard size={24} className="text-slate-600" />;
};

export default function PaymentMethod({ paymentMethod, setPaymentMethod }) {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).customer?.paymentMethods || {};

  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  const activeMethods = useMemo(() => {
    return methods
      .map((method) => ({
        ...method,
        methodName: normalizeMethodName(method.methodName),
      }))
      .filter((method) => method.active !== false);
  }, [methods]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (activeMethods.length === 0 || paymentMethod) return;

    const codMethod = activeMethods.find(
      (method) => normalizeMethodName(method.methodName) === "COD"
    );

    if (codMethod) {
      setPaymentMethod(codMethod.id);
      return;
    }

    setPaymentMethod(activeMethods[0].id);
  }, [activeMethods, paymentMethod, setPaymentMethod]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);

      const response = await getPaymentMethods();
      const data = extractData(response);

      setMethods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Cannot load payment methods", error);
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-[82px] rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (activeMethods.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
        <p className="text-sm font-semibold text-gray-600">
          Chưa có phương thức thanh toán khả dụng
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Vui lòng kiểm tra payment-service hoặc dữ liệu payment_methods.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeMethods.map((method) => {
        const normalizedName = normalizeMethodName(method.methodName);
        const isSelected = paymentMethod === method.id;

        return (
          <label
            key={method.id}
            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
              isSelected
                ? "border-orange-500 bg-orange-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 hover:shadow-sm"
            }`}
          >
            <input
              type="radio"
              name="payment"
              value={method.id}
              checked={isSelected}
              onChange={() => setPaymentMethod(method.id)}
              className="accent-orange-500"
            />

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                isSelected
                  ? "border-orange-200 bg-white"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {getMethodIcon(normalizedName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-800">
                {getMethodLabel(normalizedName, t)}
              </p>

              <p className="mt-0.5 text-sm text-gray-500">
                {method.provider || getMethodDescription(normalizedName)}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {getMethodDescription(normalizedName)}
              </p>
            </div>

            {isSelected && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-sm font-black text-white">
                ✓
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
}