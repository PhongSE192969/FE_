import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Phone,
  CheckCircle,
  UserPlus,
  ShoppingBag,
  Printer,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

import { formatCurrency } from "../../utils/helpers";
import { useAuthStore } from "../../stores/authStore";
import { createOrder, abandonOrder } from "@/services/orderService";
import {
  customerService,
  SaveCustomerFranchise,
} from "@/services/customerService";
import { loyaltyApi } from "@/services/loyaltyApi";
import PaymentMethod from "../../components/customer/PaymentMethod";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const getResponseData = (response) => {
  return response?.data?.data || response?.data || response;
};

const getCustomerId = (customer = {}) => {
  return (
    customer.customerId ||
    customer.customer_id ||
    customer.customerFranchiseId ||
    customer.id ||
    null
  );
};

const getUserId = (customer = {}) => {
  return customer.userId || customer.user_id || customer.identityUserId || null;
};

const getOrderItemProductId = (item = {}) => {
  return item.productId || item.id || item.product?.id || "";
};

const getOrderItemVariantId = (item = {}) => {
  return (
    item.variantId ||
    item.productVariantId ||
    item.selectedVariantId ||
    item.variant?.id ||
    item.options?.variantId ||
    ""
  );
};

const getOrderItemQuantity = (item = {}) => {
  return Number(item.quantity || item.qty || 1);
};

const normalizeCustomerFromSearch = (matched = {}) => {
  const customerId =
    matched.customerId ||
    matched.customer_id ||
    matched.customerFranchiseId ||
    matched.customer_franchise_id ||
    matched.id ||
    null;

  const userId =
    matched.userId ||
    matched.user_id ||
    matched.identityUserId ||
    matched.identity_user_id ||
    matched.user?.id ||
    matched.id ||
    null;

  return {
    ...matched,
    id: customerId,
    customerId,
    userId,
    fullName:
      matched.fullName ||
      matched.full_name ||
      matched.username ||
      matched.name ||
      "Walk-in Customer",
    phone: matched.phone || "",
    email: matched.email || "",
    loyaltyInfo: matched.loyaltyInfo || matched.loyalty_info || null,
  };
};

export default function CheckOut() {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).staff?.checkout || {};

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const orderData = location.state?.order;
  const orderId = location.state?.orderId;

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const [checkingCustomer, setCheckingCustomer] = useState(false);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isPointsChecked, setIsPointsChecked] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentMethodInfo, setPaymentMethodInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  useEffect(() => {
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      toast.error("No items in order. Redirecting...");
      navigate("/staff/new-order");
    }
  }, [orderData, navigate]);

  useEffect(() => {
    if (location.state?.newCustomer && location.state?.phone) {
      const normalized = normalizeCustomerFromSearch(location.state.newCustomer);

      setCustomerPhone(location.state.phone);
      setCustomerInfo(normalized);

      toast.success(`Customer ${normalized.fullName} loaded!`, {
        icon: "✅",
      });
    }
  }, [location.state]);

  useEffect(() => {
    if (!customerPhone || customerPhone.length < 10) {
      setCustomerInfo(null);
      setLoyaltyInfo(null);
      return;
    }

    setCheckingCustomer(true);

    const timer = setTimeout(async () => {
      try {
        const results = await customerService.searchUsers(customerPhone);

        const matched = (results || []).find((item) => {
          return (
            item.phone === customerPhone ||
            item.phone?.includes(customerPhone)
          );
        });

        if (!matched) {
          setCustomerInfo(null);
          setLoyaltyInfo(null);
          return;
        }

        const transformedCustomer = normalizeCustomerFromSearch(matched);

        setCustomerInfo(transformedCustomer);

        let loyalty = transformedCustomer.loyaltyInfo;

        if (!loyalty && transformedCustomer.userId) {
          try {
            const loyaltyRes = await loyaltyApi.getCustomerTierInfo(
              transformedCustomer.userId,
              user?.franchise?.id
            );

            loyalty = loyaltyRes?.data?.data || loyaltyRes?.data || loyaltyRes;
          } catch (err) {
            console.error("Manual loyalty fetch failed:", err);
          }
        }

        setLoyaltyInfo(
          loyalty || {
            loyaltyTier: "BRONZE",
            currentPoint: 0,
            currentPoints: 0,
          }
        );

        toast.success(`Found customer: ${transformedCustomer.fullName}`, {
          icon: "✅",
        });
      } catch (error) {
        console.error("Customer lookup failed:", error);
        setCustomerInfo(null);
        setLoyaltyInfo(null);
      } finally {
        setCheckingCustomer(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [customerPhone, user?.franchise?.id]);

  const handleCreateCustomer = () => {
    navigate("/staff/create-customer", {
      state: {
        phone: customerPhone,
        returnTo: "/staff/checkout",
        order: orderData,
        orderId,
      },
    });
  };

  const subtotal = Number(orderData?.total || 0);
  const availablePoints =
    loyaltyInfo?.currentPoint ||
    loyaltyInfo?.currentPoints ||
    loyaltyInfo?.points ||
    0;

  const maxUsablePoints = Math.max(0, Math.floor(subtotal / 1000));
  const safePointsToUse = Math.min(
    Number(pointsToUse || 0),
    Number(availablePoints || 0),
    Number(maxUsablePoints || 0)
  );

  const loyaltyDiscount = isPointsChecked ? safePointsToUse * 1000 : 0;
  const finalTotal = Math.max(0, subtotal - loyaltyDiscount);

  const validateBeforeCharge = () => {
    if (!paymentMethod) {
      toast.error("Vui lòng chọn phương thức thanh toán!");
      return false;
    }

    if (!user?.franchise?.id) {
      toast.error("Không tìm thấy chi nhánh của nhân viên.");
      return false;
    }

    if (!orderData?.items || orderData.items.length === 0) {
      toast.error("Không có sản phẩm trong đơn hàng.");
      return false;
    }

    const invalidItem = orderData.items.find((item) => {
      return (
        !getOrderItemProductId(item) ||
        !getOrderItemVariantId(item) ||
        getOrderItemQuantity(item) <= 0
      );
    });

    if (invalidItem) {
      console.error("Invalid POS order item:", invalidItem);
      toast.error("Có sản phẩm thiếu productId hoặc variantId.");
      return false;
    }

    return true;
  };

  const saveCustomerAfterSuccess = async () => {
    if (!customerInfo || !user?.franchise?.id) return;

    try {
      await SaveCustomerFranchise({
        franchiseId: user.franchise.id,
        customerId: getCustomerId(customerInfo),
        userId: getUserId(customerInfo),
      });
    } catch (error) {
      console.warn("Save customer franchise failed:", error);
    }
  };

  const ensureLoyaltyWallet = async () => {
    const targetUserId = getUserId(customerInfo);

    if (!targetUserId) return;

    if (loyaltyInfo?.loyaltyTier) return;

    try {
      console.log("Đang tạo ví Loyalty cho User ID:", targetUserId);
      await loyaltyApi.createWallet(targetUserId);
      console.log("Tạo ví điểm thành công!");
    } catch (walletError) {
      console.warn("Lỗi khi tạo ví hoặc ví đã tồn tại:", walletError);
    }
  };

  const handleSuccessWithoutRedirect = async (paymentData) => {
    const successOrderId = paymentData?.orderId;

    await saveCustomerAfterSuccess();
    await ensureLoyaltyWallet();

    const successData = {
      id: successOrderId,
      total: finalTotal,
      paymentMethod:
        paymentMethodInfo?.methodName ||
        paymentMethodInfo?.name ||
        paymentData?.method ||
        "POS",
      customerName: customerInfo?.fullName || "Guest",
      items: orderData?.items || [],
    };

    setCompletedOrder(successData);
    setShowSuccessModal(true);

    toast.success("Order completed successfully!", { icon: "🎉" });

    navigate(`/staff/order-success?orderId=${successOrderId}`, {
      replace: true,
      state: {
        orderId: successOrderId,
        order: successData,
        paymentMethod: paymentMethodInfo,
      },
    });
  };

  const handleCharge = async () => {
    if (!validateBeforeCharge()) return;

    setLoading(true);

    try {
      const createOrderRequest = {
        paymentMethodId: paymentMethod,
        franchiseId: user?.franchise?.id,
        customerId: getCustomerId(customerInfo),
        staffId: user?.id || null,
        promotionId: null,
        point: isPointsChecked ? safePointsToUse : 0,
        address: null,
        distance: 0,
        typeOrder: "POS",
        items: orderData.items.map((item) => ({
          productId: getOrderItemProductId(item),
          variantId: getOrderItemVariantId(item),
          quantity: getOrderItemQuantity(item),
        })),
      };

      console.log("CREATE POS ORDER PAYLOAD:", createOrderRequest);

      if (pendingOrderId) {
        try {
          await abandonOrder(pendingOrderId);
        } catch (error) {
          console.warn("Abandon pending order failed:", error);
        }
      }

      const response = await createOrder(createOrderRequest);
      const paymentData = getResponseData(response);

      console.log("CREATE POS ORDER RESPONSE:", paymentData);

      const successOrderId = paymentData?.orderId;
      const paymentUrl = paymentData?.paymentUrl;
      const qrCodeUrl = paymentData?.qrCodeUrl;

      if (!successOrderId) {
        toast.error("Tạo đơn hàng thất bại: không nhận được mã đơn hàng.");
        return;
      }

      setPendingOrderId(successOrderId);
      localStorage.setItem("pos_current_paying_tab", orderId || "");

      if (paymentUrl) {
        toast.success("Order created! Redirecting to payment...");
        window.location.assign(paymentUrl);
        return;
      }

      if (qrCodeUrl) {
        toast.success("Order created! Opening QR payment...");
        window.location.assign(qrCodeUrl);
        return;
      }

      await handleSuccessWithoutRedirect(paymentData);
    } catch (error) {
      console.error("Payment error", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to initiate payment."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/staff/new-order", {
      state: {
        restoreOrder: orderData,
        orderId,
      },
    });
  };

  const handlePrintReceipt = () => {
    if (!completedOrder) return;

    const receiptWindow = window.open("", "_blank");

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt #${completedOrder.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .muted { color: #6b7280; font-size: 13px; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; }
            .total { font-size: 20px; font-weight: 800; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: left; }
            th:last-child, td:last-child { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Receipt</h1>
          <div class="muted">Order #${completedOrder.id}</div>
          <div class="muted">Customer: ${completedOrder.customerName}</div>
          <div class="muted">Payment: ${completedOrder.paymentMethod}</div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(completedOrder.items || [])
                .map((item) => {
                  const name = item.name || item.productName || "Product";
                  const quantity = getOrderItemQuantity(item);
                  const price = Number(item.price || item.sellingPrice || 0);
                  return `
                    <tr>
                      <td>${name}</td>
                      <td>${quantity}</td>
                      <td>${formatCurrency(price * quantity)}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>

          <div class="row total">
            <span>Total</span>
            <span>${formatCurrency(completedOrder.total)}</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
  };

  const currentCustomerName = customerInfo?.fullName || "Guest Customer";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          {t.back || "Back to Order"}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* CUSTOMER */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Phone size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {t.customer?.title || "Customer Information"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t.customer?.subtitle ||
                      "Search customer by phone number or continue as guest."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder={
                    t.customer?.phonePlaceholder || "Enter customer phone..."
                  }
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50"
                />

                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  className="px-5 py-3 rounded-2xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition"
                >
                  <UserPlus size={18} />
                  {t.customer?.create || "New Customer"}
                </button>
              </div>

              {checkingCustomer && (
                <p className="text-sm text-gray-400 mt-3">
                  {t.customer?.checking || "Checking customer..."}
                </p>
              )}

              {customerInfo && (
                <div className="mt-5 rounded-2xl bg-green-50 border border-green-100 p-4 flex items-start gap-3">
                  <CheckCircle size={22} className="text-green-600 mt-0.5" />
                  <div>
                    <p className="font-black text-green-800">
                      {customerInfo.fullName}
                    </p>
                    <p className="text-sm text-green-700">
                      {customerInfo.phone || "No phone"} ·{" "}
                      {customerInfo.email || "No email"}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Loyalty: {loyaltyInfo?.loyaltyTier || "BRONZE"} ·{" "}
                      {availablePoints || 0} pts
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PAYMENT */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                  <CreditCard size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {t.payment?.title || "Payment Method"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t.payment?.subtitle ||
                      "Choose cash at counter or online payment."}
                  </p>
                </div>
              </div>

              <PaymentMethod
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                setPaymentMethodInfo={setPaymentMethodInfo}
              />
            </div>

            {/* LOYALTY */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {t.loyalty?.title || "Use Loyalty Points"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {availablePoints || 0} points available
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPointsChecked}
                    onChange={(event) =>
                      setIsPointsChecked(event.target.checked)
                    }
                    disabled={!customerInfo}
                    className="accent-orange-500"
                  />
                  <span className="text-sm font-bold text-gray-600">
                    {t.loyalty?.use || "Use points"}
                  </span>
                </label>
              </div>

              {isPointsChecked && (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Points to use
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={Math.min(availablePoints || 0, maxUsablePoints)}
                      value={pointsToUse}
                      onChange={(event) => {
                        let value = Number(event.target.value || 0);
                        const max = Math.min(
                          availablePoints || 0,
                          maxUsablePoints
                        );

                        if (value < 0) value = 0;
                        if (value > max) value = max;

                        setPointsToUse(value);
                      }}
                      className="mt-2 w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Max usable:{" "}
                      {Math.min(availablePoints || 0, maxUsablePoints)} points
                    </p>
                  </div>

                  <div className="rounded-2xl bg-orange-50 border border-orange-100 px-5 py-3 text-right">
                    <p className="text-xs text-orange-500 font-bold">
                      Discount
                    </p>
                    <p className="text-lg font-black text-orange-600">
                      -{formatCurrency(loyaltyDiscount)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SUMMARY */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="size-11 rounded-2xl bg-gray-950 text-white flex items-center justify-center">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">
                      {t.summary?.title || "Order Summary"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {orderData?.items?.length || 0} items
                    </p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {(orderData?.items || []).map((item, index) => {
                    const quantity = getOrderItemQuantity(item);
                    const price = Number(item.price || item.sellingPrice || 0);

                    return (
                      <div
                        key={`${getOrderItemVariantId(item)}-${index}`}
                        className="flex items-start gap-3"
                      >
                        <img
                          src={item.image || item.imageUrl || "/logo01.png"}
                          alt={item.name || "Product"}
                          className="size-14 rounded-xl object-cover border border-gray-100 bg-gray-50"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = "/logo01.png";
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 line-clamp-2">
                            {item.name || item.productName || "Product"}
                          </p>
                          <p className="text-xs text-gray-400">
                            x{quantity}
                          </p>
                        </div>

                        <p className="text-sm font-black text-gray-900">
                          {formatCurrency(price * quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {t.summary?.subtotal || "Subtotal"}
                  </span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {t.summary?.loyalty || "Loyalty Discount"}
                  </span>
                  <span className="font-bold text-green-600">
                    -{formatCurrency(loyaltyDiscount)}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-gray-700 font-black">
                    {t.summary?.total || "Total"}
                  </span>
                  <span className="text-2xl font-black text-orange-600">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>

                <button
                  onClick={handleCharge}
                  disabled={loading}
                  className="w-full h-14 bg-gray-950 hover:bg-orange-600 text-white font-black rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="size-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      {t.payment?.processing || "Processing..."}
                    </>
                  ) : (
                    <>
                      <CreditCard size={22} />
                      {t.payment?.complete || "Place Order"} •{" "}
                      {formatCurrency(finalTotal)}
                    </>
                  )}
                </button>

                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full py-3.5 bg-white hover:bg-gray-100 text-gray-700 font-bold border border-gray-200 rounded-2xl transition-all disabled:opacity-50 hover:shadow-sm"
                >
                  {t.cancel || "Cancel and Go Back"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-center flex flex-col items-center">
            <div className="w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600" />

            <div className="p-8 md:p-12 flex flex-col items-center w-full">
              <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-20" />
                <CheckCircle size={56} className="text-green-500" />
              </div>

              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                Order Successful!
              </h2>

              <p className="text-gray-500 font-medium mb-8">
                The transaction has been completed and archived.
              </p>

              <div className="w-full bg-slate-50 rounded-3xl p-6 mb-8 border border-gray-100 text-left space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-semibold uppercase tracking-wider">
                    Order ID
                  </span>
                  <span className="font-bold text-gray-900">
                    #{completedOrder?.id?.substring(0, 8)?.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-semibold uppercase tracking-wider">
                    Amount Paid
                  </span>
                  <span className="font-black text-primary text-xl">
                    {formatCurrency(completedOrder?.total || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-semibold uppercase tracking-wider">
                    Method
                  </span>
                  <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-700">
                    {completedOrder?.paymentMethod || "POS"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={handlePrintReceipt}
                  className="py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Print
                </button>

                <button
                  onClick={() => navigate("/staff/new-order")}
                  className="py-3 bg-gray-950 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  New Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}