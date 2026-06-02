import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { formatCurrency } from "../../utils/helpers";
import { createOrder, extractOrderResponseData } from "@/services/orderService";
import { getAvailablePromotions } from "@/services/promotionService.js";
import { loyaltyApi } from "@/services/loyaltyApi.js";
import PaymentMethod from "../../components/customer/PaymentMethod";
import { useAuthStore, useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { useCartStore } from "@/stores/cartStore";

const buildFullAddress = (shipping = {}) => {
  return [
    shipping.address,
    shipping.ward,
    shipping.district,
    shipping.province,
  ]
    .filter(Boolean)
    .join(", ");
};

const extractCreateOrderResult = (response) => {
  const data = extractOrderResponseData(response);

  return {
    orderId: data?.orderId || response?.orderId || null,
    paymentTransactionId:
      data?.paymentTransactionId || response?.paymentTransactionId || null,
    paymentUrl: data?.paymentUrl || response?.paymentUrl || null,
    qrCodeUrl: data?.qrCodeUrl || response?.qrCodeUrl || null,
    amount: data?.amount || response?.amount || null,
    method: data?.method || response?.method || null,
  };
};

const normalizeCheckoutItem = (item = {}) => {
  return {
    productId:
      item.productId ||
      item.product?.id ||
      item.product_id ||
      item.id ||
      null,

    variantId:
      item.variantId ||
      item.productVariantId ||
      item.selectedVariantId ||
      item.options?.variantId ||
      item.variant?.id ||
      item.product_variant_id ||
      null,

    quantity: Number(item.quantity || item.qty || 1),
  };
};

export default function CheckoutPaymentPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).customer?.checkoutPayment || {};

  const { removeSelected } = useCartStore();

  const [agree, setAgree] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [tierInfo, setTierInfo] = useState(null);
  const [point, setPoint] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const data =
    state?.checkoutData ||
    JSON.parse(localStorage.getItem("checkoutData") || "{}");

  const {
    customer = {},
    shipping = {},
    items = [],
    franchiseId,
  } = data;

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + Number(item.price || item.priceSnapshot || 0) * Number(item.qty || item.quantity || 1),
      0
    );
  }, [items]);

  const shippingFee = Number(shipping?.fee || shipping?.priceShip || 20000);

  const discount = selectedPromotion
    ? (() => {
        let rawDiscount =
          selectedPromotion.discountType === "PERCENT"
            ? subtotal * (Number(selectedPromotion.discountValue || 0) / 100)
            : Number(selectedPromotion.discountValue || 0);

        if (selectedPromotion.maxDiscountValue != null) {
          rawDiscount = Math.min(
            rawDiscount,
            Number(selectedPromotion.maxDiscountValue)
          );
        }

        return Math.min(rawDiscount, subtotal);
      })()
    : 0;

  const pointDiscount = Number(point || 0) * 1000;
  const maxUsablePoint = Math.floor(Math.max(0, subtotal - discount) / 1000);
  const total = Math.max(0, subtotal - discount - pointDiscount + shippingFee);

  const fullAddress = buildFullAddress(shipping);

  const canCheckout =
    agree &&
    paymentMethod &&
    franchiseId &&
    fullAddress &&
    items.length > 0 &&
    !isCreating;

  useEffect(() => {
    const fetchPromotions = async () => {
      if (!user?.id || !franchiseId || subtotal <= 0) return;

      try {
        setLoadingPromo(true);

        const response = await getAvailablePromotions({
          userId: user.id,
          franchiseId,
          orderValue: subtotal,
        });

        const list = Array.isArray(response)
          ? response
          : response?.data?.data || response?.data || [];

        setPromotions(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Load promotions failed", error);
        setPromotions([]);
      } finally {
        setLoadingPromo(false);
      }
    };

    fetchPromotions();
  }, [user?.id, franchiseId, subtotal]);

  useEffect(() => {
    if (selectedPromotion && subtotal < Number(selectedPromotion.minOrderValue || 0)) {
      setSelectedPromotion(null);
    }
  }, [subtotal, selectedPromotion]);

  useEffect(() => {
    const fetchCustomerTier = async () => {
      const customerId = customer?.customer_id || customer?.customerId || customer?.id;

      if (!customerId || !franchiseId) return;

      try {
        const response = await loyaltyApi.getCustomerTierInfo(
          customerId,
          franchiseId
        );

        const data = response?.data?.data || response?.data || response;
        setTierInfo(data);
      } catch (error) {
        console.error("Load tier information failed", error);
        setTierInfo(null);
      }
    };

    fetchCustomerTier();
  }, [customer?.customer_id, customer?.customerId, customer?.id, franchiseId]);

  useEffect(() => {
    if (selectedPromotion) {
      setPoint(0);
    }
  }, [selectedPromotion]);

  useEffect(() => {
    if (point > 0) {
      setSelectedPromotion(null);
    }
  }, [point]);

  const handleBuy = async () => {
    if (isCreating) return;

    if (!franchiseId) {
      toast.error("Thiếu chi nhánh bán phân bón");
      return;
    }

    if (!paymentMethod) {
      toast.error("Vui lòng chọn phương thức thanh toán");
      return;
    }

    if (!items.length) {
      toast.error("Chưa có sản phẩm phân bón trong đơn hàng");
      return;
    }

    if (!fullAddress) {
      toast.error("Vui lòng nhập địa chỉ nhận hàng");
      return;
    }

    const orderItems = items.map(normalizeCheckoutItem);

    if (orderItems.some((item) => !item.productId || !item.variantId)) {
      toast.error("Sản phẩm trong giỏ hàng thiếu mã sản phẩm hoặc mã biến thể");
      console.error("Invalid checkout items:", items, orderItems);
      return;
    }

    try {
      setIsCreating(true);

      const request = {
        franchiseId,
        paymentMethodId: paymentMethod,
        customerId:
          customer.customer_id ||
          customer.customerId ||
          customer.id ||
          null,
        staffId: null,
        promotionId: selectedPromotion?.id || null,
        point: Number(point || 0),
        address: fullAddress,

        // BE order hiện dùng Long distance, gửi số nguyên để tránh lỗi parse.
        distance: Math.max(0, Math.round(Number(shipping.distance || 1))),

        typeOrder: "ONLINE",
        items: orderItems,
      };

      console.log("Create fertilizer order request:", request);

      localStorage.setItem("checkoutItems", JSON.stringify(items));

      const response = await createOrder(request);
      const result = extractCreateOrderResult(response);

      console.log("Create fertilizer order response:", response);
      console.log("Create fertilizer order result:", result);

      const purchasedKeys = items.map((item) => item.key).filter(Boolean);

      if (purchasedKeys.length > 0) {
        await removeSelected(purchasedKeys);
      }

      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }

      if (result.orderId) {
        toast.success("Đặt đơn phân bón thành công!");
        navigate(`/order-success?orderId=${result.orderId}`);
        return;
      }

      toast.error("Tạo đơn hàng không thành công!");
      console.error("Missing paymentUrl/orderId from create order:", response);
    } catch (error) {
      console.error("Payment error", error);
      toast.error(error.message || "Có lỗi xảy ra khi thanh toán");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf5] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        {/* STEP HEADER */}
        <div className="mb-10 flex items-center">
          <div className="flex flex-1 items-center">
            <div
              className="group flex cursor-pointer items-center gap-3"
              onClick={() => navigate("/checkout-info")}
            >
              <span className="font-semibold text-emerald-600 group-hover:underline whitespace-nowrap">
                {t.steps?.info || "1. THÔNG TIN"}
              </span>
            </div>
            <div className="mx-4 h-[2px] flex-1 rounded-full bg-emerald-500" />
          </div>

          <div className="flex flex-1 items-center justify-end">
            <div className="mx-4 h-[2px] flex-1 rounded-full bg-orange-500" />

            <div className="flex items-center gap-3">
              <span className="font-semibold text-orange-500 whitespace-nowrap">
                {t.steps?.payment || "2. THANH TOÁN"}
              </span>
            </div>
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="font-bold text-slate-800">
              Tóm tắt đơn phân bón
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Kiểm tra sản phẩm, ưu đãi và phí giao hàng trước khi thanh toán.
            </p>
          </div>

          {/* PROMOTION */}
          <div className="flex gap-3">
            <div className="relative w-full">
              <button
                type="button"
                disabled={point > 0}
                onClick={() => {
                  if (point > 0) return;
                  setIsPromoOpen((prev) => !prev);
                }}
                className={`flex w-full items-center justify-between rounded-lg border p-3 transition ${
                  point > 0
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "border-gray-300 hover:border-emerald-500"
                }`}
              >
                <span className="text-sm">
                  {selectedPromotion
                    ? `${selectedPromotion.discountType} - ${
                        selectedPromotion.name || selectedPromotion.code
                      }`
                    : t.coupon?.placeholder || "Chọn mã giảm giá"}
                </span>

                <span
                  className={`text-sm transition-transform duration-200 ${
                    isPromoOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {isPromoOpen && (
                <div className="absolute top-full z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {loadingPromo && (
                    <div className="p-3 text-center text-sm text-gray-500">
                      Đang tải...
                    </div>
                  )}

                  {!loadingPromo && promotions.length === 0 && (
                    <div className="p-3 text-center text-sm text-gray-400">
                      Không có voucher khả dụng
                    </div>
                  )}

                  {!loadingPromo &&
                    promotions.map((promotion) => {
                      const isSelected = selectedPromotion?.id === promotion.id;

                      return (
                        <button
                          type="button"
                          key={promotion.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPromotion(null);
                            } else {
                              setSelectedPromotion(promotion);
                              setPoint(0);
                            }
                            setIsPromoOpen(false);
                          }}
                          className={`w-full border-b p-3 text-left transition last:border-none hover:bg-emerald-50 ${
                            isSelected ? "bg-orange-50" : ""
                          }`}
                        >
                          <div className="text-sm font-semibold text-slate-800">
                            {promotion.code || promotion.name}
                          </div>

                          <div className="text-xs text-gray-500">
                            {promotion.discountType === "PERCENT"
                              ? `Giảm ${promotion.discountValue}%`
                              : `Giảm ${formatCurrency(
                                  promotion.discountValue || 0
                                )}`}
                          </div>

                          <div className="text-[11px] text-gray-400">
                            Đơn tối thiểu:{" "}
                            {formatCurrency(promotion.minOrderValue || 0)} -
                            Tối đa giảm:{" "}
                            {promotion.maxDiscountValue
                              ? formatCurrency(promotion.maxDiscountValue)
                              : "Không giới hạn"}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* POINT INPUT */}
          <div
            className={`flex items-center justify-between rounded-lg border p-3 transition ${
              selectedPromotion
                ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-60"
                : "border-gray-300"
            }`}
          >
            <div>
              <p className="text-sm font-medium text-gray-700">Dùng điểm</p>
              <p className="text-xs text-gray-400">
                Bạn có:{" "}
                {formatCurrency(Number(tierInfo?.currentPoints || 0) * 1000)} (
                {tierInfo?.currentPoints || 0} điểm)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                min={0}
                max={Math.min(tierInfo?.currentPoints || 0, maxUsablePoint)}
                value={point}
                disabled={!!selectedPromotion}
                onChange={(event) => {
                  let value = Number(event.target.value) || 0;

                  const maxPoint = Math.min(
                    tierInfo?.currentPoints || 0,
                    maxUsablePoint
                  );

                  if (value > maxPoint) value = maxPoint;
                  if (value < 0) value = 0;

                  setPoint(value);
                  setSelectedPromotion(null);
                }}
                className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-200"
                placeholder="0"
              />

              <span className="text-sm text-gray-500">điểm</span>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t.summary?.productCount || "Số lượng sản phẩm"}</span>
            <span className="font-medium text-black">
              {items.length.toString().padStart(2, "0")}
            </span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>{t.summary?.subtotal || "Tổng tiền hàng"}</span>
            <span className="font-medium text-black">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>{t.summary?.shipping || "Phí vận chuyển"}</span>
            <span className="font-medium text-black">
              {formatCurrency(shippingFee)}
            </span>
          </div>

          <div className="flex justify-between text-sm text-red-500">
            <span>{t.summary?.discount || "Giảm giá trực tiếp"}</span>
            <span>- {formatCurrency(discount || pointDiscount)}</span>
          </div>

          <hr className="border-gray-200" />

          <div className="flex justify-between text-lg font-semibold">
            <span>{t.summary?.total || "Tổng tiền"}</span>
            <span className="text-orange-500">{formatCurrency(total)}</span>
          </div>

          <p className="text-xs text-gray-400">
            {t.summary?.vat || "Đã gồm VAT và được làm tròn"}
          </p>
        </div>

        {/* PAYMENT METHOD */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 font-semibold text-gray-700">
            {t.paymentInfo?.title || "THÔNG TIN THANH TOÁN"}
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Chọn cách thanh toán phù hợp cho đơn phân bón của bạn.
          </p>

          <PaymentMethod
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
        </div>

        {/* DELIVERY */}
        <div className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-3 items-start gap-4 text-sm">
            <span className="col-span-1 text-gray-500">
              {t.delivery?.customer || "Khách hàng"}
            </span>
            <span className="col-span-2 break-words text-right font-medium text-black">
              {customer?.name || customer?.fullName || user?.fullName || "Khách hàng"}
            </span>
          </div>

          <div className="grid grid-cols-3 items-start gap-4 text-sm">
            <span className="col-span-1 text-gray-500">
              {t.delivery?.phone || "Số điện thoại"}
            </span>
            <span className="col-span-2 text-right font-medium text-black">
              {customer?.phone || user?.phone || "N/A"}
            </span>
          </div>

          <div className="grid grid-cols-3 items-start gap-4 text-sm">
            <span className="col-span-1 text-gray-500">
              {t.delivery?.email || "Email"}
            </span>
            <span className="col-span-2 break-all text-right font-medium text-black">
              {customer?.email || user?.email || "N/A"}
            </span>
          </div>

          <div className="grid grid-cols-3 items-start gap-4 text-sm">
            <span className="col-span-1 text-gray-500">
              {t.delivery?.address || "Nhận hàng tại"}
            </span>
            <span className="col-span-2 break-words text-right font-medium text-black">
              {fullAddress || "Chưa có địa chỉ"}
            </span>
          </div>

          <div className="grid grid-cols-3 items-start gap-4 text-sm">
            <span className="col-span-1 text-gray-500">
              {t.delivery?.receiver || "Người nhận"}
            </span>
            <span className="col-span-2 text-right font-medium text-black">
              {shipping?.name || customer?.name || "Người nhận"} -{" "}
              {shipping?.phone || customer?.phone || "N/A"}
            </span>
          </div>

          <hr className="border-gray-200" />

          <label className="mt-2 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
              className="mt-1 accent-orange-500"
            />

            <span className="text-sm leading-relaxed text-gray-500">
              {t.terms?.agree || "Tôi đồng ý với"}{" "}
              <a href="#" className="font-semibold text-emerald-700 hover:underline">
                {t.terms?.tos || "Điều khoản dịch vụ"}
              </a>{" "}
              {t.terms?.and || "và"}{" "}
              <a href="#" className="font-semibold text-emerald-700 hover:underline">
                {t.terms?.privacy || "Chính sách bảo mật"}
              </a>
            </span>
          </label>
        </div>

        {/* FOOTER */}
        <div className="border-t pt-6">
          <div className="mb-4 flex justify-between font-semibold text-gray-700">
            <span>{t.footer?.total || "Tổng tiền:"}</span>
            <span className="text-xl text-orange-500">
              {formatCurrency(total)}
            </span>
          </div>

          <button
            disabled={!canCheckout}
            onClick={handleBuy}
            className={`w-full rounded-lg py-3 font-semibold text-white shadow-sm transition ${
              canCheckout
                ? "bg-orange-500 hover:bg-orange-600"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            {isCreating ? "Đang tạo đơn..." : "Thanh toán"}
          </button>

          <p className="mt-3 text-center text-sm text-gray-400">
            {t.footer?.checkItems
              ? t.footer.checkItems.replace("{count}", items.length)
              : `Kiểm tra danh sách sản phẩm (${items.length})`}
          </p>
        </div>
      </div>
    </div>
  );
}