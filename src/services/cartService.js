import { axiosClient } from "@/config/axiosClient";
import { ENDPOINTS } from "@/config/api";

const extractData = (response) => {
  return response?.data?.data || response?.data || response;
};

const buildEmptyCart = (customerId) => {
  return {
    id: null,
    customerId: customerId || null,
    items: [],
    totalItems: 0,
    totalAmount: 0,
  };
};

const normalizeCartItem = (item = {}) => {
  const productId =
    item.productId ||
    item.product_id ||
    item.product?.id ||
    item.id ||
    null;

  const variantId =
    item.variantId ||
    item.productVariantId ||
    item.product_variant_id ||
    item.selectedVariantId ||
    item.variant?.id ||
    null;

  const quantity = Number(item.quantity || item.qty || 1);

  const price = Number(
    item.price ||
      item.sellingPrice ||
      item.salePrice ||
      item.priceSnapshot ||
      0
  );

  return {
    ...item,
    productId,
    variantId,
    productVariantId: variantId,
    quantity,
    qty: quantity,
    price,
    sellingPrice: price,
    name:
      item.name ||
      item.productName ||
      item.productNameSnapshot ||
      item.product?.name ||
      "Sản phẩm",
    image:
      item.image ||
      item.imageUrl ||
      item.productImageUrl ||
      item.product?.imageUrl ||
      "/logo01.png",
    key: item.key || `${productId || "product"}-${variantId || "variant"}`,
  };
};

const normalizeCart = (rawCart, customerId) => {
  const data = extractData(rawCart);

  if (!data) {
    return buildEmptyCart(customerId);
  }

  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.cartItems)
        ? data.cartItems
        : Array.isArray(data.content)
          ? data.content
          : [];

  const items = rawItems.map(normalizeCartItem);

  const totalAmount = items.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);

  const totalItems = items.reduce((sum, item) => {
    return sum + Number(item.quantity || 1);
  }, 0);

  return {
    ...data,
    customerId: data.customerId || customerId || null,
    items,
    cartItems: items,
    totalItems: data.totalItems ?? totalItems,
    totalAmount: data.totalAmount ?? data.total ?? totalAmount,
  };
};

const isInvalidCustomerId = (customerId) => {
  return (
    !customerId ||
    customerId === "undefined" ||
    customerId === "null" ||
    String(customerId).trim() === ""
  );
};

export const getCart = async (customerId) => {
  if (isInvalidCustomerId(customerId)) {
    console.warn("Skip getCart: missing customerId");
    return buildEmptyCart(customerId);
  }

  try {
    const response = await axiosClient.get(
      ENDPOINTS.PROTECTED.CART.get(customerId)
    );

    return normalizeCart(response, customerId);
  } catch (error) {
    console.error("Fetch cart failed:", error);

    // Không cho cart làm chết checkout/product page.
    // Nếu BE cart lỗi 500 hoặc cart chưa tạo, FE vẫn dùng giỏ rỗng/local state.
    return buildEmptyCart(customerId);
  }
};

export const addToCart = async (customerId, productId, variantId, quantity) => {
  if (isInvalidCustomerId(customerId)) {
    throw new Error("Missing customerId when adding item to cart");
  }

  if (!productId || !variantId) {
    throw new Error("Missing productId or variantId when adding item to cart");
  }

  const payload = {
    customerId,
    productId,
    variantId,
    quantity: Number(quantity || 1),
  };

  const response = await axiosClient.post(
    ENDPOINTS.PROTECTED.CART.add,
    payload
  );

  return extractData(response);
};

export const updateCartItem = async (customerId, variantId, quantity) => {
  if (isInvalidCustomerId(customerId)) {
    throw new Error("Missing customerId when updating cart item");
  }

  if (!variantId) {
    throw new Error("Missing variantId when updating cart item");
  }

  const response = await axiosClient.put(
    `${ENDPOINTS.PROTECTED.CART.update(
      customerId,
      variantId
    )}?quantity=${Number(quantity || 1)}`
  );

  return extractData(response);
};

export const removeFromCart = async (customerId, variantId) => {
  if (isInvalidCustomerId(customerId)) {
    throw new Error("Missing customerId when removing cart item");
  }

  if (!variantId) {
    throw new Error("Missing variantId when removing cart item");
  }

  const response = await axiosClient.delete(
    ENDPOINTS.PROTECTED.CART.remove(customerId, variantId)
  );

  return extractData(response);
};

export const clearCartOnline = async (customerId) => {
  if (isInvalidCustomerId(customerId)) {
    console.warn("Skip clearCartOnline: missing customerId");
    return buildEmptyCart(customerId);
  }

  try {
    // axiosClient đã có baseURL "/api", nên KHÔNG thêm "/api" ở đây.
    const response = await axiosClient.delete(
      `/carts/online/${customerId}/clear`
    );

    return extractData(response);
  } catch (error) {
    console.error("Clear online cart failed:", error);

    // Không chặn flow order success nếu clear cart lỗi.
    return buildEmptyCart(customerId);
  }
};

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCartOnline,
};