import { useCartStore } from "../../stores/cartStore";
import { formatCurrency } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import {
  Trash2,
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { getStocks } from "@/services/inventoryService";
import { useAuthStore } from "../../stores/authStore";
import { loyaltyApi } from "@/services/loyaltyApi";

export default function CheckoutPage() {
  const {
    items,
    loading,
    increaseQty,
    decreaseQty,
    removeItem,
    updateQty,
    removeSelected,
    clearCart,
    syncStock,
  } = useCartStore();

  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).customer?.checkout || {};
  const commonT = (translations[language] || translations.vi).customer || {};
  const { user } = useAuthStore();
  const [selected, setSelected] = useState(items.map((i) => i.key));

  useEffect(() => {
    if (user && user.id) {
      const checkAndCreateWallet = async () => {
        try {
          // Gọi API tạo ví. Nếu chưa có nó sẽ tạo (201).
          // Nếu có rồi BE sẽ quăng lỗi 400 (LOYALTY_WALLET_ALREADY_EXISTS)
          await loyaltyApi.createWallet(user.id);
          console.log("Customer wallet initialized automatically!");
        } catch (error) {
          console.log(
            "Wallet check status:",
            error?.response?.data?.message || "Already exists",
          );
        }
      };
      checkAndCreateWallet();
    }
  }, [user]);
  // ==========================================

  useEffect(() => {
    setSelected((prev) =>
      prev.filter((key) => items.some((i) => i.key === key)),
    );
  }, [items]);

  useEffect(() => {
    const fetchLatestStock = async () => {
      try {
        const stockRes = await getStocks(null, false, 0, 500);
        const allStocks = stockRes?.data?.content || stockRes?.content || [];
        const MAIN_WAREHOUSE_ID = "00000000-0000-0000-0000-000000000000";

        const stockMap = {};
        allStocks.forEach((s) => {
          if (
            s.locationId !== MAIN_WAREHOUSE_ID &&
            s.locationType !== "WAREHOUSE"
          ) {
            const qty = s.quantity - (s.reservedQuantity || 0);
            stockMap[s.productVariantId] = Math.max(
              stockMap[s.productVariantId] || 0,
              qty,
            );
          }
        });
        syncStock(stockMap);
      } catch (error) {
        console.error("Cart stock sync failed:", error);
      }
    };
    fetchLatestStock();
  }, []);

  const toggleItem = (key) => {
    if (selected.includes(key)) {
      setSelected(selected.filter((id) => id !== key));
    } else {
      setSelected((prev) => [...prev, key]);
    }
  };

  const selectAll = () => {
    if (selected.length === items.length) {
      setSelected([]);
    } else {
      setSelected(items.map((i) => i.key));
    }
  };

  const subtotal = items
    .filter((i) => selected.includes(i.key))
    .reduce((sum, item) => sum + item.price * item.qty, 0);

  const total = subtotal;

  const handlePlaceOrder = () => {
    const selectedItems = items.filter((i) => selected.includes(i.key));

    if (selectedItems.length === 0) {
      toast.error(
        t.toasts?.selectItems || "Vui lòng chọn sản phẩm để thanh toán",
      );
      return;
    }

    localStorage.setItem("checkoutItems", JSON.stringify(selectedItems));
    navigate("/checkout-info");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 pt-24 pb-16">
        <div className="size-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black text-gray-900 mb-2">
          {t.loading || "Đang tải giỏ hàng..."}
        </h2>
        <p className="text-gray-500 font-medium">
          {t.loadingSub || "Vui lòng chờ trong giây lát"}
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 pt-24 pb-16">
        <div className="p-5 rounded-full bg-gray-50 text-gray-300 mb-6">
          <ShoppingBag size={64} strokeWidth={1} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          {commonT.cart?.empty?.title || "Giỏ hàng của bạn đang trống"}
        </h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          {commonT.cart?.empty?.subtitle ||
            "Hãy tiếp tục mua sắm để lấp đầy giỏ nhé!"}
        </p>
        <button
          onClick={() => navigate("/products")}
          className="bg-gray-950 hover:bg-purple-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-purple-500/5 active:scale-95 flex items-center gap-2"
        >
          <ArrowLeft size={18} />{" "}
          {commonT.cart?.empty?.browse || "Tiếp tục mua sắm"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/60 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/products")}
            className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:shadow-md transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-950">
              {t.title || "Giỏ hàng của bạn"}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {items.length} món trong giỏ · {selected.length} được chọn
            </p>
          </div>
        </div>

        {/* Items Container */}
        <div className="space-y-4 mb-10">
          <div className="flex items-center justify-between px-2 pb-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selected.length === items.length && items.length > 0}
                  onChange={selectAll}
                  className="peer sr-only"
                />
                <div className="size-5 rounded-md border-2 border-gray-200 peer-checked:border-purple-600 peer-checked:bg-purple-600 transition-all group-hover:border-purple-300"></div>
                <svg
                  className="absolute size-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                {t.actions?.selectAll || "Chọn tất cả"}
              </span>
            </label>

            {selected.length > 0 && (
              <button
                onClick={() => removeSelected(selected)}
                className="text-xs font-bold text-red-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} />{" "}
                {t.actions?.deleteSelected || "Xóa đã chọn"}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.key}
                className="group flex gap-4 bg-white rounded-3xl p-4 border border-gray-100 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300"
              >
                {/* Checkbox */}
                <div className="flex items-center">
                  <label className="relative flex items-center justify-center cursor-pointer group/check">
                    <input
                      type="checkbox"
                      checked={selected.includes(item.key)}
                      onChange={() => toggleItem(item.key)}
                      className="peer sr-only"
                    />
                    <div className="size-5 rounded-md border-2 border-gray-200 peer-checked:border-purple-600 peer-checked:bg-purple-600 transition-all group-hover/check:border-purple-300"></div>
                    <svg
                      className="absolute size-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </label>
                </div>

                {/* Image */}
                <div className="relative size-20 sm:size-24 shrink-0 rounded-2xl overflow-hidden border border-gray-50 bg-gray-50">
                  <img
                    src={
                      item.image ||
                      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=200"
                    }
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-base text-gray-900 leading-tight truncate">
                        {item.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 font-black uppercase tracking-wider text-[10px]">
                        {item.options?.color && (
                          <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500">
                            {item.options.color}
                          </span>
                        )}
                        {item.options?.size && (
                          <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500">
                            Size {item.options.size}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.key)}
                      className="text-gray-300 hover:text-red-500 p-1.5 rounded-xl hover:bg-red-50 transition-all shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div className="flex flex-col gap-2">
                      {item.maxStock !== undefined && item.maxStock < 20 && (
                        <div className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 uppercase tracking-tighter w-fit">
                          Chỉ còn {item.maxStock} sản phẩm
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit">
                        <button
                          onClick={() => decreaseQty(item.key)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center hover:border-purple-200 hover:text-purple-600 transition-all shadow-sm active:scale-90"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                              const max = item.maxStock || 999;
                              if (val > max) {
                                toast.error(
                                  `Rất tiếc, bạn chỉ có thể chọn tối đa ${max} sản phẩm (theo tồn kho chi nhánh).`,
                                );
                                updateQty(item.key, max);
                              } else {
                                updateQty(item.key, val);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            if (
                              e.target.value === "" ||
                              parseInt(e.target.value) <= 0
                            ) {
                              removeItem(item.key);
                            }
                          }}
                          className="w-8 text-center bg-transparent text-sm font-black text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => increaseQty(item.key)}
                          disabled={item.qty >= (item.maxStock || 999)}
                          className={`w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center transition-all shadow-sm active:scale-90 ${item.qty >= (item.maxStock || 999) ? "opacity-30 cursor-not-allowed" : "hover:border-purple-200 hover:text-purple-600"}`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-gray-400 line-through">
                        {formatCurrency(item.price)}
                      </div>
                      <div className="font-black text-lg text-gray-950">
                        {formatCurrency(item.price * item.qty)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gray-950 rounded-3xl p-6 shadow-2xl shadow-purple-500/20 text-white overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 size-32 bg-purple-600/20 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 size-32 bg-blue-500/10 blur-3xl -ml-16 -mb-16 rounded-full pointer-events-none"></div>

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full sm:w-auto">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                {t.summary?.total || "Tổng cộng"}
              </p>
              <h3 className="text-3xl font-black text-white">
                {formatCurrency(total)}
              </h3>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full sm:w-auto h-14 px-10 bg-white hover:bg-purple-50 text-gray-950 font-black rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl text-base group"
            >
              {t.actions?.checkout || "Thanh toán ngay"}
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
