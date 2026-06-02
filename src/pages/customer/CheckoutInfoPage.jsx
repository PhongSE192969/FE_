import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import { MapPin, ChevronDown, ArrowLeft, Loader2 } from "lucide-react";

import { useLanguageStore } from "@/stores";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { translations } from "@/locales";

import OrderSummary from "../../components/customer/OrderSummary";
import CustomerInfo from "../../components/customer/CustomerInfo";
import ShippingInfo from "../../components/customer/ShippingInfo";

import { getAllFranchises } from "@/services/franchiseService";
import { getCapableBranches } from "@/services/inventoryService";

const extractData = (response) => {
  return response?.data?.data || response?.data || response || [];
};

const getCustomerIdFromUser = (user) => {
  return (
    user?.customerId ||
    user?.customer_id ||
    user?.customer?.id ||
    user?.customer?.customerId ||
    user?.customerFranchiseId ||
    null
  );
};

const getProductIdFromItem = (item = {}) => {
  return (
    item.productId ||
    item.product_id ||
    item.product?.id ||
    item.id ||
    null
  );
};

const getVariantIdFromItem = (item = {}) => {
  return (
    item.variantId ||
    item.productVariantId ||
    item.product_variant_id ||
    item.selectedVariantId ||
    item.variant?.id ||
    item.options?.variantId ||
    item.options?.productVariantId ||
    null
  );
};

const normalizeCheckoutItem = (item = {}) => {
  const productId = getProductIdFromItem(item);
  const variantId = getVariantIdFromItem(item);
  const quantity = Math.max(1, Number(item.qty || item.quantity || 1));

  return {
    ...item,

    id: productId,
    productId,

    variantId,
    productVariantId: variantId,
    selectedVariantId: variantId,

    qty: quantity,
    quantity,

    price: Number(item.price || item.sellingPrice || item.salePrice || 0),
    sellingPrice: Number(item.sellingPrice || item.price || item.salePrice || 0),

    image: item.image || item.imageUrl || item.productImageUrl || "/logo01.png",
    imageUrl: item.imageUrl || item.image || item.productImageUrl || "/logo01.png",

    options: {
      ...(item.options || {}),
      variantId,
      productVariantId: variantId,
    },
  };
};

const getInitialItems = (stateItems, cartStore) => {
  if (Array.isArray(stateItems) && stateItems.length > 0) {
    return stateItems.map(normalizeCheckoutItem);
  }

  try {
    const localItems = JSON.parse(localStorage.getItem("checkoutItems") || "[]");

    if (Array.isArray(localItems) && localItems.length > 0) {
      return localItems.map(normalizeCheckoutItem);
    }
  } catch {
    // ignore invalid localStorage
  }

  if (typeof cartStore.getCheckoutItems === "function") {
    return cartStore.getCheckoutItems().map(normalizeCheckoutItem);
  }

  return (cartStore.items || []).map(normalizeCheckoutItem);
};

const buildCapableBranchPayload = (items = []) => {
  return items
    .map((item) => ({
      productVariantId: getVariantIdFromItem(item),
      quantity: Number(item.qty || item.quantity || 1),
    }))
    .filter((item) => item.productVariantId && item.quantity > 0);
};

export default function CheckoutInfoPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const dropdownRef = useRef(null);

  const cartStore = useCartStore();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const t =
    (translations[language] || translations.vi).customer?.checkoutInfo || {};

  const [items] = useState(() => getInitialItems(state?.items, cartStore));

  const [franchises, setFranchises] = useState([]);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [capableBranchIds, setCapableBranchIds] = useState([]);

  const [customer, setCustomer] = useState(() => ({
    name: user?.fullName || user?.username || "",
    phone: user?.phone || "",
    email: user?.email || "",
    customer_id: getCustomerIdFromUser(user),
    customerId: getCustomerIdFromUser(user),
  }));

  const [shipping, setShipping] = useState(() => ({
    name: user?.fullName || user?.username || "",
    phone: user?.phone || "",
    province: "",
    district: "",
    ward: "",
    address: "",
    lat: null,
    lng: null,
    distance: 0,
    fee: 0,
    isFromMap: false,
  }));

  const validItems = useMemo(() => {
    return items.filter((item) => {
      return getProductIdFromItem(item) && getVariantIdFromItem(item);
    });
  }, [items]);

  const invalidItems = useMemo(() => {
    return items.filter((item) => {
      return !getProductIdFromItem(item) || !getVariantIdFromItem(item);
    });
  }, [items]);

  useEffect(() => {
    if (items.length === 0) {
      toast.error("Giỏ hàng phân bón đang trống");
      navigate("/checkout");
      return;
    }

    if (invalidItems.length > 0) {
      console.error("Invalid checkout items:", invalidItems);
      toast.error("Có sản phẩm thiếu mã biến thể. Vui lòng chọn lại sản phẩm.");
    }
  }, [items.length, invalidItems, navigate]);

  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        setLoading(true);

        const response = await getAllFranchises();
        const data = extractData(response);

        setFranchises(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Load franchise failed", error);
        setFranchises([]);
        toast.error("Không tải được danh sách chi nhánh");
      } finally {
        setLoading(false);
      }
    };

    fetchFranchises();
  }, []);

  useEffect(() => {
    const fetchCapableBranches = async () => {
      if (validItems.length === 0) return;

      try {
        setStockLoading(true);

        const payload = buildCapableBranchPayload(validItems);

        if (payload.length === 0) {
          setCapableBranchIds([]);
          return;
        }

        const response = await getCapableBranches(payload);
        const data = extractData(response);

        setCapableBranchIds(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Fetch capable branches failed", error);
        setCapableBranchIds([]);
      } finally {
        setStockLoading(false);
      }
    };

    fetchCapableBranches();
  }, [validItems]);

  const filteredFranchises = useMemo(() => {
    if (!Array.isArray(franchises) || franchises.length === 0) return [];

    if (!capableBranchIds || capableBranchIds.length === 0) return [];

    return franchises.filter((franchise) =>
      capableBranchIds.includes(franchise.id)
    );
  }, [franchises, capableBranchIds]);

  useEffect(() => {
    if (filteredFranchises.length > 0 && !selectedFranchise) {
      setSelectedFranchise(filteredFranchises[0]);
    }

    if (
      selectedFranchise &&
      filteredFranchises.length > 0 &&
      !filteredFranchises.some((item) => item.id === selectedFranchise.id)
    ) {
      setSelectedFranchise(filteredFranchises[0]);
    }
  }, [filteredFranchises, selectedFranchise]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleContinue = () => {
    if (items.length === 0) {
      toast.error("Giỏ hàng phân bón đang trống");
      return;
    }

    if (invalidItems.length > 0) {
      toast.error("Có sản phẩm thiếu mã sản phẩm hoặc mã biến thể");
      return;
    }

    if (!selectedFranchise) {
      toast.error("Vui lòng chọn chi nhánh còn đủ hàng");
      return;
    }

    if (!customer.name || !customer.phone) {
      toast.error(t.toasts?.fillAll || "Vui lòng nhập đầy đủ thông tin khách hàng");
      return;
    }

    if (!customer.phone.match(/^[0-9]{9,11}$/)) {
      toast.error(t.toasts?.invalidPhone || "Số điện thoại khách hàng không hợp lệ");
      return;
    }

    if (!shipping.name || !shipping.phone) {
      toast.error(t.toasts?.shippingInfo || "Vui lòng nhập thông tin người nhận");
      return;
    }

    if (!shipping.phone.match(/^[0-9]{9,11}$/)) {
      toast.error("Số điện thoại người nhận không hợp lệ");
      return;
    }

    if (!shipping.province || !shipping.district || !shipping.ward) {
      toast.error(t.toasts?.addressSelect || "Vui lòng chọn đầy đủ tỉnh, quận, phường");
      return;
    }

    if (!shipping.address) {
      toast.error(t.toasts?.addressDetail || "Vui lòng nhập địa chỉ cụ thể");
      return;
    }

    const normalizedItems = validItems.map(normalizeCheckoutItem);

    const checkoutData = {
      customer: {
        ...customer,
        customer_id: customer.customer_id || customer.customerId || getCustomerIdFromUser(user),
        customerId: customer.customerId || customer.customer_id || getCustomerIdFromUser(user),
      },
      shipping: {
        ...shipping,
        distance: Math.max(0, Math.round(Number(shipping.distance || 0))),
        fee: Number(shipping.fee || shipping.priceShip || 20000),
      },
      items: normalizedItems,
      franchiseId: selectedFranchise.id,
      franchiseName: selectedFranchise.name,
    };

    localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    localStorage.setItem("checkoutItems", JSON.stringify(normalizedItems));

    navigate("/checkout-payment", {
      state: {
        checkoutData,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f7faf5] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate("/checkout")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          {t.actions?.backToCart || "Quay lại giỏ hàng"}
        </button>

        {/* STEP HEADER */}
        <div className="mb-10 flex items-center">
          <div className="flex flex-1 items-center">
            <div className="mr-4 h-[2px] flex-1 rounded-full bg-orange-500" />

            <div className="rounded-md bg-orange-50 px-2 py-1 font-semibold text-orange-500 shadow-sm whitespace-nowrap">
              {t.steps?.info || "1. THÔNG TIN"}
            </div>

            <div className="ml-4 h-[2px] flex-1 rounded-full bg-orange-500" />
          </div>

          <div className="flex flex-1 items-center justify-end">
            <div className="mr-4 h-[2px] flex-1 rounded-full bg-gray-300" />

            <div className="font-semibold text-gray-500 whitespace-nowrap">
              {t.steps?.payment || "2. THANH TOÁN"}
            </div>

            <div className="ml-4 h-[2px] flex-1 rounded-full bg-gray-300" />
          </div>
        </div>

        <OrderSummary items={validItems} />

        <CustomerInfo customer={customer} setCustomer={setCustomer} />

        {/* CHỌN FRANCHISE */}
        <div className="relative mb-6" ref={dropdownRef}>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Chọn chi nhánh phân bón còn đủ hàng
          </label>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={loading || stockLoading || filteredFranchises.length === 0}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-orange-400 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              {loading || stockLoading ? (
                <Loader2 size={16} className="animate-spin text-orange-500" />
              ) : (
                <MapPin size={16} className="text-orange-500" />
              )}

              <span className="text-left text-sm font-semibold text-slate-800">
                {loading
                  ? "Đang tải chi nhánh..."
                  : stockLoading
                    ? "Đang kiểm tra tồn kho..."
                    : selectedFranchise?.name || "Chọn chi nhánh"}
              </span>
            </div>

            <ChevronDown
              size={16}
              className={`transition ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {filteredFranchises.length > 0 ? (
                filteredFranchises.map((franchise) => (
                  <button
                    type="button"
                    key={franchise.id}
                    onClick={() => {
                      setSelectedFranchise(franchise);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition hover:bg-emerald-50 ${
                      selectedFranchise?.id === franchise.id
                        ? "bg-orange-50 font-bold text-orange-700"
                        : "text-slate-700"
                    }`}
                  >
                    <div className="font-semibold">
                      {franchise.name}
                    </div>

                    {franchise.address && (
                      <div className="mt-0.5 text-xs text-gray-400">
                        {franchise.address}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-400">
                  Không có chi nhánh phù hợp
                </div>
              )}
            </div>
          )}

          {!stockLoading && capableBranchIds.length === 0 && validItems.length > 0 && (
            <div className="mt-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              ⚠️ Không có chi nhánh nào đáp ứng đủ tất cả mặt hàng phân bón trong giỏ.
              Vui lòng giảm số lượng hoặc chọn sản phẩm khác.
            </div>
          )}
        </div>

        <ShippingInfo
          shipping={{
            ...shipping,
            franchiseId: selectedFranchise?.id,
          }}
          setShipping={setShipping}
        />

        <button
          type="button"
          disabled={
            !customer.name ||
            !customer.phone ||
            !selectedFranchise ||
            stockLoading ||
            invalidItems.length > 0
          }
          onClick={handleContinue}
          className={`w-full rounded-lg py-3 font-semibold text-white transition ${
            !customer.name ||
            !customer.phone ||
            !selectedFranchise ||
            stockLoading ||
            invalidItems.length > 0
              ? "cursor-not-allowed bg-gray-400"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {stockLoading ? "Đang kiểm tra tồn kho..." : t.actions?.continue || "Tiếp tục"}
        </button>
      </div>
    </div>
  );
}