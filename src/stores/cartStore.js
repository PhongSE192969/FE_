import { create } from "zustand";
import { useAuthStore } from "./authStore";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
} from "../services/cartService";
import { SearchProductsByIds } from "../services/productService";
import toast from "react-hot-toast";

const MAIN_WAREHOUSE_ID = "00000000-0000-0000-0000-000000000000";

const getActiveCustomerId = (fallbackCustomerId = null) => {
  const user = useAuthStore.getState().user;

  const realCustomerId =
    user?.customerId ||
    user?.customer_id ||
    user?.customer?.id ||
    user?.customer?.customerId ||
    user?.customerFranchiseId ||
    null;

  // Nếu caller truyền nhầm user.id thì không dùng user.id gọi cart-service.
  if (fallbackCustomerId && fallbackCustomerId !== user?.id) {
    return fallbackCustomerId;
  }

  return realCustomerId;
};

const isValidId = (value) => {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    value !== "undefined" &&
    value !== "null"
  );
};

const getVariantImage = (variant, product) => {
  if (variant?.images && typeof variant.images === "object") {
    const keys = Object.keys(variant.images).sort();
    const firstKey = keys[0];

    if (firstKey && variant.images[firstKey]) {
      return variant.images[firstKey];
    }
  }

  return (
    variant?.imageUrl ||
    product?.imageUrl ||
    product?.image ||
    product?.thumbnailUrl ||
    "/logo01.png"
  );
};

const pickSalePriceFirst = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") {
      const numberValue = Number(value);

      if (!Number.isNaN(numberValue) && numberValue >= 0) {
        return numberValue;
      }
    }
  }

  return 0;
};

const getVariantPrice = (variant, product) => {
  return pickSalePriceFirst(
    variant?.salePrice,
    variant?.sellingPrice,
    product?.salePrice,
    product?.sellingPrice,
    variant?.price,
    product?.price
  );
};

const getCartItemPrice = (item = {}) => {
  return pickSalePriceFirst(
    item.salePrice,
    item.sellingPrice,
    item.variant?.salePrice,
    item.variant?.sellingPrice,
    item.options?.salePrice,
    item.options?.sellingPrice,
    item.price,
    item.variant?.price,
    item.options?.price
  );
};

const getProductPrice = (product = {}) => {
  return pickSalePriceFirst(
    product.salePrice,
    product.sellingPrice,
    product.variant?.salePrice,
    product.variant?.sellingPrice,
    product.selectedVariant?.salePrice,
    product.selectedVariant?.sellingPrice,
    product.options?.salePrice,
    product.options?.sellingPrice,
    product.price,
    product.variant?.price,
    product.selectedVariant?.price,
    product.options?.price
  );
};

const getVariantLabel = (variant) => {
  const variantName = variant?.variantName || "";

  const packageText =
    variant?.packageSize && variant?.packageUnit
      ? `${variant.packageSize} ${variant.packageUnit}`
      : variant?.packageUnit || variant?.size || "";

  return variantName || packageText || variant?.sku || "Default";
};

const extractData = (res) => {
  return res?.data?.data || res?.data || res;
};

const extractCartItems = (cart) => {
  const data = extractData(cart);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.cartItems)) return data.cartItems;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const extractProductList = (res) => {
  const data = extractData(res);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const extractStockContent = (res) => {
  const data = extractData(res);

  return Array.isArray(data?.content)
    ? data.content
    : Array.isArray(res?.data?.data?.content)
      ? res.data.data.content
      : Array.isArray(res?.data?.content)
        ? res.data.content
        : Array.isArray(res?.content)
          ? res.content
          : Array.isArray(data)
            ? data
            : [];
};

const calculateAvailableStock = (stocks) => {
  return stocks.reduce((sum, stock) => {
    return (
      sum + Number(stock.quantity || 0) - Number(stock.reservedQuantity || 0)
    );
  }, 0);
};

const buildVariantStockMap = (allStocks = []) => {
  const grouped = {};

  allStocks.forEach((stock) => {
    if (!stock.productVariantId) return;

    if (!grouped[stock.productVariantId]) {
      grouped[stock.productVariantId] = {
        franchiseStocks: [],
        warehouseStocks: [],
      };
    }

    const isWarehouse =
      stock.locationId === MAIN_WAREHOUSE_ID ||
      stock.locationType === "WAREHOUSE";

    if (isWarehouse) {
      grouped[stock.productVariantId].warehouseStocks.push(stock);
    } else {
      grouped[stock.productVariantId].franchiseStocks.push(stock);
    }
  });

  const stockMap = {};

  Object.entries(grouped).forEach(([variantId, group]) => {
    const franchiseQty = calculateAvailableStock(group.franchiseStocks);
    const warehouseQty = calculateAvailableStock(group.warehouseStocks);

    stockMap[variantId] = Math.max(
      0,
      franchiseQty > 0 ? franchiseQty : warehouseQty
    );
  });

  return stockMap;
};

const getProductIdFromCartItem = (item = {}) => {
  return (
    item.productId ||
    item.product_id ||
    item.product?.id ||
    item.id ||
    ""
  );
};

const getVariantIdFromCartItem = (item = {}) => {
  return (
    item.variantId ||
    item.productVariantId ||
    item.product_variant_id ||
    item.selectedVariantId ||
    item.variant?.id ||
    item.options?.variantId ||
    item.options?.productVariantId ||
    ""
  );
};

const getCartItemQuantity = (item = {}) => {
  const quantity = Number(item.qty || item.quantity || 1);
  return quantity > 0 ? quantity : 1;
};

const normalizeCheckoutItem = (item = {}) => {
  const productId = getProductIdFromCartItem(item);
  const variantId = getVariantIdFromCartItem(item);
  const quantity = getCartItemQuantity(item);
  const price = getCartItemPrice(item);

  return {
    ...item,

    id: productId,
    productId,

    variantId,
    productVariantId: variantId,
    selectedVariantId: variantId,

    qty: quantity,
    quantity,

    price,
    sellingPrice: price,
    salePrice: price,

    image: item.image || item.imageUrl || item.productImageUrl || "/logo01.png",
    imageUrl: item.imageUrl || item.image || item.productImageUrl || "/logo01.png",

    options: {
      ...(item.options || {}),
      variantId,
      productVariantId: variantId,
    },
  };
};

export const useCartStore = create((set, get) => ({
  items: [],
  loading: false,

  addItem: async (product, options = {}, maxStock = 999) => {
    const items = get().items;

    const variantId =
      options.variantId ||
      options.productVariantId ||
      product.variantId ||
      product.productVariantId ||
      product.selectedVariantId ||
      product.variant?.id ||
      product.selectedVariant?.id;

    const productId = product.id || product.productId;

    if (!isValidId(productId)) {
      toast.error("Sản phẩm thiếu mã productId.");
      return false;
    }

    if (!isValidId(variantId)) {
      toast.error("Sản phẩm thiếu mã variantId.");
      return false;
    }

    const key = `${productId}-${variantId}`;
    const existing = items.find((item) => item.key === key);
    const customerId = getActiveCustomerId();

    if (existing) {
      const newQty = Number(existing.qty || existing.quantity || 1) + 1;

      if (newQty > maxStock) {
        toast.error(`Số lượng được giới hạn tối đa ${maxStock} cái.`);
        return false;
      }

      set({
        items: items.map((item) =>
          item.key === key
            ? {
                ...item,
                qty: newQty,
                quantity: newQty,
                maxStock,
              }
            : item
        ),
      });

      if (isValidId(customerId) && isValidId(variantId)) {
        try {
          await updateCartItem(customerId, variantId, newQty);
        } catch (error) {
          console.error("Failed to sync quantity to server", error);
        }
      }
    } else {
      if (maxStock <= 0) {
        toast.error("Sản phẩm này hiện đang hết hàng.");
        return false;
      }

      const normalizedOptions = {
        ...options,
        variantId,
        productVariantId: variantId,
      };

      const price = getProductPrice({
        ...product,
        options,
      });

      const image =
        product.imageUrl ||
        product.image ||
        product.productImageUrl ||
        product.variant?.imageUrl ||
        product.selectedVariant?.imageUrl ||
        "/logo01.png";

      set({
        items: [
          ...items,
          {
            ...product,

            id: productId,
            productId,

            variantId,
            productVariantId: variantId,
            selectedVariantId: variantId,

            qty: 1,
            quantity: 1,

            options: normalizedOptions,
            key,

            price,
            sellingPrice: price,
            salePrice: price,

            image,
            imageUrl: image,

            maxStock,
          },
        ],
      });

      if (isValidId(customerId) && isValidId(variantId)) {
        try {
          await addToCart(customerId, productId, variantId, 1);
        } catch (error) {
          console.error("Failed to add item to server", error);
        }
      }
    }

    return true;
  },

  removeItem: async (key) => {
    const items = get().items;
    const itemToRemove = items.find((item) => item.key === key);
    const customerId = getActiveCustomerId();

    set({
      items: items.filter((item) => item.key !== key),
    });

    const variantId = getVariantIdFromCartItem(itemToRemove);

    if (isValidId(customerId) && isValidId(variantId)) {
      try {
        await removeFromCart(customerId, variantId);
      } catch (error) {
        console.error("Failed to remove item from server", error);
      }
    }
  },

  updateQty: async (key, qty) => {
    const items = get().items;
    const item = items.find((cartItem) => cartItem.key === key);

    if (!item) return;

    const customerId = getActiveCustomerId();
    const max = Number(item.maxStock || 999);
    const finalQty = Math.max(1, Math.min(Number(qty || 1), max));

    set({
      items: items.map((cartItem) =>
        cartItem.key === key
          ? {
              ...cartItem,
              qty: finalQty,
              quantity: finalQty,
            }
          : cartItem
      ),
    });

    const variantId = getVariantIdFromCartItem(item);

    if (isValidId(customerId) && isValidId(variantId)) {
      try {
        await updateCartItem(customerId, variantId, finalQty);
      } catch (error) {
        console.error("Failed to update quantity on server", error);
      }
    }
  },

  increaseQty: (key) => {
    const item = get().items.find((cartItem) => cartItem.key === key);

    if (item) {
      get().updateQty(key, getCartItemQuantity(item) + 1);
    }
  },

  decreaseQty: (key) => {
    const item = get().items.find((cartItem) => cartItem.key === key);

    if (item) {
      const currentQty = getCartItemQuantity(item);

      if (currentQty > 1) {
        get().updateQty(key, currentQty - 1);
      } else {
        get().removeItem(key);
      }
    }
  },

  clearCart: async () => {
    set({
      items: [],
    });
  },

  fetchCart: async (inputCustomerId) => {
    const customerId = getActiveCustomerId(inputCustomerId);

    if (!isValidId(customerId)) {
      console.warn("Skip fetchCart: missing real customerId");
      set({
        loading: false,
      });
      return;
    }

    set({
      loading: true,
    });

    try {
      const backendCart = await getCart(customerId);
      const cartItemsList = extractCartItems(backendCart);

      if (!Array.isArray(cartItemsList) || cartItemsList.length === 0) {
        set({
          items: [],
        });
        return;
      }

      const productIds = [
        ...new Set(
          cartItemsList
            .map((item) => getProductIdFromCartItem(item))
            .filter(Boolean)
        ),
      ];

      if (productIds.length === 0) {
        set({
          items: [],
        });
        return;
      }

      const productsData = await SearchProductsByIds(productIds);
      const products = extractProductList(productsData);

      let stockMap = {};

      try {
        const { getStocks } = await import("../services/inventoryService");
        const stockRes = await getStocks(null, false, 0, 500);
        const allStocks = extractStockContent(stockRes);

        stockMap = buildVariantStockMap(allStocks);
      } catch (error) {
        console.error("Failed to load initial stocks for cart sync", error);
      }

      const enrichedItems = cartItemsList
        .map((cartItem) => {
          const productId = getProductIdFromCartItem(cartItem);
          const variantId = getVariantIdFromCartItem(cartItem);

          const product = products.find((item) => item.id === productId);

          if (!product || !variantId) {
            const quantity = getCartItemQuantity(cartItem);
            const price = getCartItemPrice(cartItem);
            const image = cartItem.image || cartItem.imageUrl || "/logo01.png";

            return {
              productId,
              id: productId,

              variantId,
              productVariantId: variantId,
              selectedVariantId: variantId,

              qty: quantity,
              quantity,

              options: {
                variantId,
                productVariantId: variantId,
              },

              key: `${productId || "product"}-${variantId || "variant"}`,

              price,
              sellingPrice: price,
              salePrice: price,

              name: cartItem.name || cartItem.productName || "Sản phẩm phân bón",
              image,
              imageUrl: image,

              maxStock: 999,
            };
          }

          const variant = product.variants?.find((item) => item.id === variantId);

          const variantLabel = variant
            ? getVariantLabel(variant)
            : cartItem.variantName || "Default";

          const variantImage = variant
            ? getVariantImage(variant, product)
            : cartItem.image ||
              cartItem.imageUrl ||
              product.imageUrl ||
              "/logo01.png";

          const price = variant
            ? getVariantPrice(variant, product)
            : pickSalePriceFirst(
                cartItem.salePrice,
                cartItem.sellingPrice,
                cartItem.price,
                product.salePrice,
                product.sellingPrice,
                product.price
              );

          const options = {
            variantId,
            productVariantId: variantId,
            variantName: variant?.variantName || cartItem.variantName,
            packageSize: variant?.packageSize || cartItem.packageSize,
            packageUnit:
              variant?.packageUnit ||
              cartItem.packageUnit ||
              variant?.size ||
              cartItem.size,
            sku: variant?.sku || cartItem.sku,
          };

          const key = `${product.id}-${variantId}`;

          const maxStock =
            stockMap[variantId] !== undefined
              ? stockMap[variantId]
              : variant?.quantity ?? cartItem.maxStock ?? 999;

          const quantity = getCartItemQuantity(cartItem);

          return {
            ...product,

            productId: product.id,
            id: product.id,

            variantId,
            productVariantId: variantId,
            selectedVariantId: variantId,

            qty: quantity,
            quantity,

            options,
            key,

            price,
            sellingPrice: price,
            salePrice: price,

            selectedVariantName: variantLabel,

            image: variantImage,
            imageUrl: variantImage,

            maxStock,
          };
        })
        .filter((item) => item && item.productId && item.variantId);

      set({
        items: enrichedItems,
      });
    } catch (error) {
      console.error("Fetch cart failed:", error);
      set({
        items: [],
      });
    } finally {
      set({
        loading: false,
      });
    }
  },

  syncStock: (stockMap) => {
    const items = get().items;

    set({
      items: items.map((item) => {
        const variantId = getVariantIdFromCartItem(item);

        if (variantId && stockMap[variantId] !== undefined) {
          return {
            ...item,
            maxStock: stockMap[variantId],
          };
        }

        return item;
      }),
    });
  },

  getSelectedItems: () => {
    // Hiện cart chưa có selectedKeys riêng, nên checkout toàn bộ items.
    return get().items;
  },

  getCheckoutItems: () => {
    return get().items.map(normalizeCheckoutItem).filter((item) => {
      return item.productId && item.variantId && item.quantity > 0;
    });
  },

  getTotalQuantity: () => {
    return get().items.reduce((sum, item) => {
      return sum + getCartItemQuantity(item);
    }, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      return sum + getCartItemPrice(item) * getCartItemQuantity(item);
    }, 0);
  },

  removeSelected: async (keys = []) => {
    if (!Array.isArray(keys) || keys.length === 0) return;

    for (const key of keys) {
      await get().removeItem(key);
    }
  },
}));

export default useCartStore;