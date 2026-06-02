import { create } from "zustand";
import { persist } from "zustand/middleware";

const normalizeStatus = (status) => {
  if (!status) return "PENDING_PAYMENT";

  const value = String(status).toUpperCase();

  const legacyMap = {
    PENDING: "PENDING_PAYMENT",
    CREATED: "PENDING_PAYMENT",
    CONFIRMED: "WAITING_FOR_CONFIRMATION",
    DELIVERING: "SHIPPING",
    DONE: "COMPLETED",
    FAILED_ORDER: "FAILED",
    FAILED_PAYMENT: "FAILED",
  };

  return legacyMap[value] || value;
};

const normalizeTypeOrder = (typeOrder) => {
  if (!typeOrder) return "POS";

  const value = String(typeOrder).toUpperCase();

  if (value === "ONLINE") return "ONLINE";
  if (value === "POS") return "POS";

  return value;
};

const getOrderTotal = (items = []) => {
  return items.reduce((sum, item) => {
    const price = Number(item.price || item.sellingPrice || item.priceSnapshot || 0);
    const quantity = Number(item.quantity || item.qty || 1);

    return sum + price * quantity;
  }, 0);
};

const normalizeOrderItem = (item = {}) => {
  return {
    productId: item.productId || item.id || null,
    variantId:
      item.variantId ||
      item.productVariantId ||
      item.selectedVariantId ||
      item.variant?.id ||
      null,
    name:
      item.name ||
      item.productName ||
      item.productNameSnapshot ||
      "Sản phẩm phân bón",
    quantity: Number(item.quantity || item.qty || 1),
    price: Number(item.price || item.sellingPrice || item.priceSnapshot || 0),
    unit: item.unit || item.size || "",
    image: item.image || item.imageUrl || item.productImageUrl || "/logo01.png",
  };
};

const createDisplayItems = (items = []) => {
  return items.map((item) => {
    const normalized = normalizeOrderItem(item);
    const unitText = normalized.unit ? ` - ${normalized.unit}` : "";

    return `${normalized.name}${unitText} x${normalized.quantity}`;
  });
};

export const useOrderStore = create(
  persist(
    (set, get) => ({
      // Local/mock order queue cho FE.
      // Data này chỉ dùng tạm cho UI nếu chưa lấy từ BE.
      orders: [
        {
          id: "#1001",
          customer: "Nguyễn Văn Minh",
          customerName: "Nguyễn Văn Minh",
          items: ["NPK Đầu Trâu 16-16-13+TE - 25 KG x1"],
          itemDetails: [
            {
              productId: null,
              variantId: null,
              name: "NPK Đầu Trâu 16-16-13+TE",
              quantity: 1,
              price: 450000,
              unit: "25 KG",
            },
          ],
          status: "WAITING_FOR_CONFIRMATION",
          orderStatus: "WAITING_FOR_CONFIRMATION",
          typeOrder: "ONLINE",
          time: "10:30 AM",
          total: 450000,
          totalDue: 450000,
          createdAt: new Date().toISOString(),
        },
        {
          id: "#1002",
          customer: "Trần Quốc Bảo",
          customerName: "Trần Quốc Bảo",
          items: ["Phân Kali Clorua KCl - 50 KG x1"],
          itemDetails: [
            {
              productId: null,
              variantId: null,
              name: "Phân Kali Clorua KCl",
              quantity: 1,
              price: 780000,
              unit: "50 KG",
            },
          ],
          status: "PAYMENT_PENDING",
          orderStatus: "PAYMENT_PENDING",
          typeOrder: "ONLINE",
          time: "10:35 AM",
          total: 780000,
          totalDue: 780000,
          createdAt: new Date().toISOString(),
        },
        {
          id: "#1003",
          customer: "Lê Thị Hương",
          customerName: "Lê Thị Hương",
          items: ["Phân DAP 18-46-0 - 50 KG x1"],
          itemDetails: [
            {
              productId: null,
              variantId: null,
              name: "Phân DAP 18-46-0",
              quantity: 1,
              price: 950000,
              unit: "50 KG",
            },
          ],
          status: "PREPARING",
          orderStatus: "PREPARING",
          typeOrder: "ONLINE",
          time: "10:40 AM",
          total: 950000,
          totalDue: 950000,
          createdAt: new Date().toISOString(),
        },
        {
          id: "#1004",
          customer: "Phạm Văn Long",
          customerName: "Phạm Văn Long",
          items: ["Urea Phú Mỹ - 50 KG x2"],
          itemDetails: [
            {
              productId: null,
              variantId: null,
              name: "Urea Phú Mỹ",
              quantity: 2,
              price: 620000,
              unit: "50 KG",
            },
          ],
          status: "SHIPPING",
          orderStatus: "SHIPPING",
          typeOrder: "ONLINE",
          time: "10:45 AM",
          total: 1240000,
          totalDue: 1240000,
          createdAt: new Date().toISOString(),
        },
        {
          id: "#1005",
          customer: "Walk-in Customer",
          customerName: "Walk-in Customer",
          items: ["Phân hữu cơ vi sinh Sông Gianh - 25 KG x1"],
          itemDetails: [
            {
              productId: null,
              variantId: null,
              name: "Phân hữu cơ vi sinh Sông Gianh",
              quantity: 1,
              price: 180000,
              unit: "25 KG",
            },
          ],
          status: "COMPLETED",
          orderStatus: "COMPLETED",
          typeOrder: "POS",
          time: "10:50 AM",
          total: 180000,
          totalDue: 180000,
          staffName: "Nhân viên bán hàng",
          createdAt: new Date().toISOString(),
        },
      ],

      nextOrderNumber: 1006,

      addOrder: (orderData = {}) => {
        const orderNumber = `#${get().nextOrderNumber}`;
        const itemDetails = Array.isArray(orderData.items)
          ? orderData.items.map(normalizeOrderItem)
          : [];

        const total =
          Number(orderData.total || orderData.totalDue || 0) ||
          getOrderTotal(itemDetails);

        const status = normalizeStatus(
          orderData.status || orderData.orderStatus || "COMPLETED"
        );

        const typeOrder = normalizeTypeOrder(orderData.typeOrder || "POS");

        const newOrder = {
          id: orderData.id || orderNumber,

          customer:
            orderData.customer ||
            orderData.customerName ||
            orderData.fullName ||
            "Walk-in Customer",

          customerName:
            orderData.customerName ||
            orderData.customer ||
            orderData.fullName ||
            "Walk-in Customer",

          customerId: orderData.customerId || null,
          staffId: orderData.staffId || null,
          staffName: orderData.staffName || null,
          franchiseId: orderData.franchiseId || null,

          items: createDisplayItems(itemDetails),
          itemDetails,

          status,
          orderStatus: status,
          typeOrder,

          time: orderData.time || "Just now",
          total,
          totalDue: total,

          address: orderData.address || null,
          paymentMethodId: orderData.paymentMethodId || null,
          paymentTransactionId: orderData.paymentTransactionId || null,

          createdAt: orderData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          orders: [newOrder, ...state.orders],
          nextOrderNumber: state.nextOrderNumber + 1,
        }));

        return newOrder.id;
      },

      updateOrderStatus: (orderId, newStatus) => {
        const status = normalizeStatus(newStatus);

        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status,
                  orderStatus: status,
                  updatedAt: new Date().toISOString(),
                }
              : order
          ),
        }));
      },

      removeOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== orderId),
        }));
      },

      getOrdersByStatus: (status) => {
        const normalizedStatus = normalizeStatus(status);

        return get().orders.filter(
          (order) =>
            normalizeStatus(order.orderStatus || order.status) === normalizedStatus
        );
      },

      getOrdersByType: (typeOrder) => {
        const normalizedType = normalizeTypeOrder(typeOrder);

        return get().orders.filter(
          (order) => normalizeTypeOrder(order.typeOrder) === normalizedType
        );
      },

      getOrderById: (orderId) => {
        return get().orders.find((order) => order.id === orderId) || null;
      },

      clearOrders: () => {
        set({
          orders: [],
          nextOrderNumber: 1001,
        });
      },
    }),
    {
      name: "fertilizer-order-storage",
      partializer: (state) => ({
        orders: state.orders,
        nextOrderNumber: state.nextOrderNumber,
      }),
    }
  )
);