import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  X,
  Trash2,
  CreditCard,
  Search,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { formatCurrency } from "../../utils/helpers";
import { getCategories } from "@/services/categoryService";
import { useLanguageStore, useAuthStore } from "@/stores";
import { translations } from "@/locales";
import { getProductsByFranchise } from "@/services/productService";
import { getStocks } from "@/services/inventoryService";
import toast from "react-hot-toast";


export default function CreateOrder() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const tStaff = (translations[language] || translations.vi).staff || {};
  const t = tStaff.createOrder || {};
  const tOptions = tStaff.options || {};

  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [selectedProductForOptions, setSelectedProductForOptions] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Quản lý tabs (orders)
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("pos_orders");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Parse pos_orders error", e);
      }
    }
    return [{ id: 1, name: "Đơn #1", items: [], total: 0 }];
  });

  const [activeOrderId, setActiveOrderId] = useState(() => {
    const savedOrders = localStorage.getItem("pos_orders");
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        return parsed.length > 0 ? parsed[0].id : 1;
      } catch (e) {
        return 1;
      }
    }
    return 1;
  });

  const [nextOrderId, setNextOrderId] = useState(() => {
    const savedOrders = localStorage.getItem("pos_orders");
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        const maxId = parsed.reduce((max, order) => Math.max(max, order.id), 0);
        return maxId + 1;
      } catch (e) {
        return 2;
      }
    }
    return 2;
  });


  useEffect(() => {
    localStorage.setItem("pos_orders", JSON.stringify(orders));
  }, [orders]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState({}); // { variantId: availableQuantity }

  const activeOrder = orders.find((order) => order.id === activeOrderId) ||
    orders[0] || { name: "", items: [] };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const franchiseId = user?.franchise?.id;
        if (!franchiseId) return;
        const [formattedProducts, formattedCategories, stocksData] = await Promise.all([
          getProductsByFranchise(franchiseId),
          getCategories(),
          getStocks(franchiseId, false, 0, 1000)
        ]);
        const list = Array.isArray(formattedProducts)
          ? formattedProducts
          : formattedProducts?.content || formattedProducts?.data?.content || [];

        // Lọc bỏ sản phẩm nếu TẤT CẢ các phân loại (variants) đều INACTIVE
        const filteredList = list.filter(p =>
          p.variants && p.variants.some(v => v.status === "ACTIVE")
        );

        setProducts(filteredList.map(p => {
          const variantPrices = p.variants?.filter(v => v.status === "ACTIVE").map(v => v.price).filter(Boolean) || [];
          const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
          return {
            ...p,
            price: Number(p.price || minPrice),
            image: p.imageUrl && p.imageUrl.startsWith("http")
              ? p.imageUrl
              : p.variants?.[0]?.images && Object.values(p.variants[0].images).length > 0
                ? Object.values(p.variants[0].images)[0]
                : "https://images.unsplash.com/photo-1567401373963-9f4b300f2029?w=500&q=80",
            category: p.category?.id || p.categoryId,
            categoryName: p.category?.name || p.categoryName,
            available: p.status === "ACTIVE" || p.status === "AVAILABLE",
            badge: p.productType === "Combo" ? "Combo" : null,
          };
        }));

        const catList = Array.isArray(formattedCategories)
          ? formattedCategories
          : formattedCategories?.data || formattedCategories?.content || [];

        const normalizedCats = catList.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, "-"),
          status: c.status === "ACTIVE" ? "Active" : "Inactive",
        }));

        setCategories(normalizedCats);

        // Map stocks
        const stockMap = {};
        const stocksList = Array.isArray(stocksData) ? stocksData : stocksData?.data?.content || stocksData?.content || [];
        stocksList.forEach(s => {
          if (s.productVariantId) {
            stockMap[s.productVariantId] = s.quantity - (s.reservedQuantity || 0);
          }
        });
        setStocks(stockMap);

      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error(t.alerts?.loadFailed || "Failed to load data");
      }
    };

    fetchData();
  }, [user?.franchise?.id]);

  useEffect(() => {
    if (location.state?.orderCompleted) {
      const completedId = location.state.completedOrderId;
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.filter(
          (order) => order.id !== completedId
        );

        if (
          completedId === activeOrderId ||
          !updatedOrders.find((o) => o.id === activeOrderId)
        ) {
          const nextActiveId =
            updatedOrders.length > 0 ? updatedOrders[0].id : 1;
          setActiveOrderId(nextActiveId);
        }

        if (updatedOrders.length === 0) {
          return [{ id: 1, name: "Order #1", items: [], total: 0 }];
        }
        return updatedOrders;
      });
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.restoredOrder || location.state?.restoredOrderId) {
      const restored = location.state.restoredOrder;
      const restoredId = location.state.restoredOrderId || restored?.id;
      
      if (restored) {
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.id === restored.id ? restored : order))
        );
      }
      
      if (restoredId) {
        setActiveOrderId(restoredId);
      }
      
      navigate(location.pathname, { replace: true, state: {} });
    }
    return () => { };
  }, [location.state, location.pathname, navigate, activeOrderId]);

  const addNewOrder = () => {
    const newOrder = {
      id: nextOrderId,
      name: `Đơn #${nextOrderId}`,
      items: [],
      total: 0,
    };
    setOrders([...orders, newOrder]);
    setActiveOrderId(nextOrderId);
    setNextOrderId(nextOrderId + 1);
    toast.success(t.alerts?.orderCreated || "New order created");
  };

  const closeOrder = (orderId, e) => {
    e.stopPropagation();
    if (orders.length === 1) {
      toast.error(t.alerts?.closeLast || "Cannot close the last order");
      return;
    }

    const orderToClose = orders.find((o) => o.id === orderId);
    if (orderToClose.items.length > 0) {
      toast(
        (toastCtrl) => (
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-gray-800">
              {t.alerts?.closeConfirm || "This order has items. Are you sure you want to close it?"}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => toast.dismiss(toastCtrl.id)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t.alerts?.closeCancel || "Cancel"}
              </button>
              <button
                onClick={() => {
                  toast.dismiss(toastCtrl.id);
                  const newOrders = orders.filter(
                    (order) => order.id !== orderId
                  );
                  setOrders(newOrders);

                  if (activeOrderId === orderId) {
                    setActiveOrderId(newOrders[0].id);
                  }
                  toast.success(t.alerts?.orderClosed || "Order closed");
                }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                {t.alerts?.closeConfirmBtn || "Close Order"}
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
      return;
    }

    const newOrders = orders.filter((order) => order.id !== orderId);
    setOrders(newOrders);

    if (activeOrderId === orderId) {
      setActiveOrderId(newOrders[0].id);
    }
    toast.success(t.alerts?.orderClosed || "Order closed");
  };

  const handleProductClick = (product) => {
    const activeVariants = product.variants?.filter(v => v.status === "ACTIVE") || [];
    if (activeVariants.length > 0) {
      setSelectedProductForOptions(product);
      setSelectedSize("");
      setSelectedColor("");
    } else {
      // For products without variants, check if variant exists or fallback to product stock logic
      const defaultVariantId = product.variants?.[0]?.id;
      addProductToOrder(product, "M", "Mặc định", defaultVariantId);
    }
  };

  // Thêm sản phẩm vào order hiện tại
  const addProductToOrder = async (product, size = "M", color = "Mặc định", variantId = null) => {
    // Stock validation
    if (variantId && stocks[variantId] !== undefined) {
      const available = stocks[variantId];
      const existingInCart = activeOrder.items.find(item => item.variantId === variantId)?.quantity || 0;
      
      if (existingInCart + 1 > available) {
        toast.error(`Sản phẩm này chỉ còn ${available} sản phẩm trong kho`);
        return;
      }
    }

    setOrders((prevOrders) => {
      return prevOrders.map((order) => {
        if (order.id === activeOrderId) {
          const existingItemIndex = order.items.findIndex(
            (item) =>
              item.variantId === variantId || 
              (item.productId === product.id && item.size === size && item.color === color)
          );

          let updatedItems;
          if (existingItemIndex !== -1) {
            updatedItems = order.items.map((item, index) => {
              if (index === existingItemIndex) {
                return { ...item, quantity: item.quantity + 1 };
              }
              return item;
            });
          } else {
            // Lấy giá của variant nếu có
            let itemPrice = product.price;
            if (variantId && product.variants) {
              const variant = product.variants.find(v => v.id === variantId);
              if (variant) itemPrice = variant.price;
            }

            const itemId = `item-${activeOrderId}-${Date.now()}-${product.id}-${variantId || 'default'}`;
            const newItem = {
              id: itemId,
              productId: product.id,
              variantId: variantId,
              name: product.name,
              price: itemPrice,
              quantity: 1,
              size: size,
              color: color,
              image: product.image,
            };
            updatedItems = [...order.items, newItem];
          }

          return {
            ...order,
            items: updatedItems,
            total: calculateTotal(updatedItems),
          };
        }
        return order;
      });
    });

    toast.success(t.alerts?.added ? t.alerts.added.replace('{name}', `${product.name} (${color}/${size})`) : `${product.name} added to order`);
  };

  // Cập nhật số lượng item
  const updateQuantity = (itemId, change) => {
    const item = activeOrder.items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + change);
    
    // Stock check for increment
    if (change > 0 && item.variantId && stocks[item.variantId] !== undefined) {
      if (newQuantity > stocks[item.variantId]) {
        toast.error(`Chỉ còn ${stocks[item.variantId]} sản phẩm trong kho`);
        return;
      }
    }

    setOrders(
      orders.map((order) => {
        if (order.id === activeOrderId) {
          const updatedItems = order.items.map((it) => {
            if (it.id === itemId) {
              return { ...it, quantity: newQuantity };
            }
            return it;
          });
          return {
            ...order,
            items: updatedItems,
            total: calculateTotal(updatedItems),
          };
        }
        return order;
      })
    );
  };

  const handleManualQuantityChange = (itemId, value) => {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 1) return;

    const item = activeOrder.items.find(i => i.id === itemId);
    if (!item) return;

    // Stock check
    if (item.variantId && stocks[item.variantId] !== undefined) {
      if (numericValue > stocks[item.variantId]) {
        toast.error(`Chỉ còn ${stocks[item.variantId]} sản phẩm trong kho`);
        
        // Revert to max stock if typed higher
        setOrders(orders.map(o => o.id === activeOrderId ? {
          ...o,
          items: o.items.map(it => it.id === itemId ? { ...it, quantity: stocks[item.variantId] } : it),
          total: calculateTotal(o.items)
        } : o));
        return;
      }
    }

    setOrders(
      orders.map((order) => {
        if (order.id === activeOrderId) {
          const updatedItems = order.items.map((it) => {
            if (it.id === itemId) {
              return { ...it, quantity: numericValue };
            }
            return it;
          });
          return {
            ...order,
            items: updatedItems,
            total: calculateTotal(updatedItems),
          };
        }
        return order;
      })
    );
  };

  // Xóa item khỏi order
  const removeItem = async (itemId) => {
    setOrders(
      orders.map((order) => {
        if (order.id === activeOrderId) {
          const updatedItems = order.items.filter(
            (item) => item.id !== itemId
          );

          return {
            ...order,
            items: updatedItems,
            total: calculateTotal(updatedItems),
          };
        }
        return order;
      })
    );

    toast.success(t.alerts?.removed || "Item removed");
  };

  // Tính tổng tiền
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Mở modal checkout
  const handleNext = () => {
    if (activeOrder.items.length === 0) {
      toast.error(t.alerts?.addFirst || "Add items to order first");
      return;
    }

    const idx = orders.findIndex(o => o.id === activeOrderId);
    const dynamicName = `${t.tabs?.orderPrefix || "Đơn #"}${idx !== -1 ? idx + 1 : 1}`;

    navigate("/staff/checkout", {
      state: {
        order: { ...activeOrder, name: dynamicName },
        orderId: activeOrderId,
      },
    });
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      product.category === selectedCategory ||
      product.categoryName === selectedCategory;
    return matchesSearch && matchesCategory && product.available;
  });

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header với tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-1.5 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          {orders.map((order, index) => (
            <button
              key={order.id}
              onClick={() => setActiveOrderId(order.id)}
              className={`group flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeOrderId === order.id
                ? "bg-primary text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <span className="font-bold text-sm whitespace-nowrap">
                {`${t.tabs?.orderPrefix || "Đơn #"}${index + 1}`}
              </span>
              {order.items.length > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${activeOrderId === order.id ? "bg-white/20" : "bg-gray-300"
                    }`}
                >
                  {order.items.length}
                </span>
              )}
              {orders.length > 1 && (
                <X
                  size={16}
                  onClick={(e) => closeOrder(order.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                />
              )}
            </button>
          ))}

          <button
            onClick={addNewOrder}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gold hover:bg-gold/90 text-primary transition-colors shadow-sm"
            title="New Order"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Products (2/3) */}
        <div className="w-2/3 flex flex-col border-r border-gray-200 bg-white">
          {/* Search & Filter */}
          <div className="p-3 border-b border-gray-200 space-y-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder={t.search || "Search products..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === "all"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {t.categories?.all || "All"}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-gray-200/80 hover:-translate-y-1 transition-all duration-300 group items-start text-left w-full border border-gray-100/50 cursor-pointer"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-50">
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=400";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-gold text-primary text-xs font-bold px-2.5 py-1 rounded-lg shadow">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  <div className="p-2 flex flex-col flex-1 w-full">
                    <h3 className="font-bold text-sm text-primary mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-sm font-black text-primary">
                      {(() => {
                        const prices = product.variants?.filter(v => v.status === "ACTIVE").map(v => v.price) || [];
                        if (prices.length === 0) return formatCurrency(product.price);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return min === max ? formatCurrency(min) : `${formatCurrency(min)} - ${formatCurrency(max)}`;
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Search size={48} className="mb-2" />
                <p>{t.empty?.noProducts || "No products found"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Cart (1/3) */}
        <div className="w-1/3 flex flex-col bg-gray-50">
          {/* Cart Header */}
          <div className="bg-white p-4 border-b border-gray-200">

            <p className="text-sm text-gray-500">
              {t.cart?.itemsCount ? t.cart.itemsCount.replace('{count}', activeOrder.items.length) : `${activeOrder.items.length} items`}
            </p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeOrder.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <CreditCard size={32} />
                </div>
                <p className="font-medium">{t.empty?.noItems || "No items in order"}</p>
                <p className="text-sm">{t.empty?.addItem || "Select products to add"}</p>
              </div>
            ) : (
              activeOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=400";
                      }}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-primary line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="text-xs text-gray-500 mb-2">
                        {tOptions.size?.[item.size] || item.size} • {item.color}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleManualQuantityChange(item.id, e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value === "" || parseInt(e.target.value) < 1) {
                                handleManualQuantityChange(item.id, "1");
                              }
                            }}
                            className="font-bold text-sm min-w-[40px] w-12 text-center bg-transparent border-none focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <span className="font-bold text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer - Total & Actions */}
          <div className="bg-white border-t border-gray-200 p-4 space-y-3">
            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.cart?.summary?.subtotal || "Subtotal"}</span>
                <span className="font-semibold">
                  {formatCurrency(activeOrder.total)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold text-lg text-primary">{t.cart?.summary?.total || "Total"}</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(activeOrder.total)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full">
              <button
                onClick={handleNext}
                disabled={activeOrder.items.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {t.cart?.actions?.next || "Next"}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Modal Chọn Phân Loại Sản Phẩm */}
      {selectedProductForOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-lg text-primary">Chọn phân loại sản phẩm</h3>
              <button
                onClick={() => setSelectedProductForOptions(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Header Info */}
              {(() => {
                const currentVariant = selectedProductForOptions.variants?.find(
                  v => v.size === selectedSize && v.color === selectedColor && v.status === "ACTIVE"
                );
                return (
                  <div className="flex gap-4">
                    <img
                      src={currentVariant?.images && Object.values(currentVariant.images).length > 0
                        ? Object.values(currentVariant.images)[0]
                        : selectedProductForOptions.image}
                      alt={selectedProductForOptions.name}
                      className="w-20 h-20 object-cover rounded-xl border border-gray-100"
                    />
                    <div>
                      <h4 className="font-bold text-base text-primary mr-5">{selectedProductForOptions.name}</h4>
                      <p className="text-lg font-black text-primary mt-1">
                        {formatCurrency(currentVariant ? currentVariant.price : selectedProductForOptions.price)}
                      </p>
                      {currentVariant && stocks[currentVariant.id] !== undefined && (
                        <p className={`text-xs font-bold mt-1 ${stocks[currentVariant.id] > 0 ? "text-green-600" : "text-red-500"}`}>
                          Còn lại: {stocks[currentVariant.id]} sản phẩm
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Sizes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Kích thước (Size)</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(selectedProductForOptions.variants?.map(v => v.size))).map(size => {
                    const available = selectedProductForOptions.variants?.some(
                      v => v.size === size && v.status === "ACTIVE" && (!selectedColor || v.color === selectedColor)
                    );
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        disabled={!available}
                        onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isSelected
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/10"
                          : available
                            ? "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                            : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                          }`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Màu sắc</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(selectedProductForOptions.variants?.map(v => v.color))).map(color => {
                    const available = selectedProductForOptions.variants?.some(
                      v => v.color === color && v.status === "ACTIVE" && (!selectedSize || v.size === selectedSize)
                    );
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        disabled={!available}
                        onClick={() => setSelectedColor(selectedColor === color ? "" : color)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isSelected
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/10"
                          : available
                            ? "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                            : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                          }`}
                      >
                        {color}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-5 py-4 border-t border-gray-100">
              <button
                disabled={!selectedSize || !selectedColor}
                onClick={() => {
                  const variant = selectedProductForOptions.variants?.find(
                    v => v.size === selectedSize && v.color === selectedColor && v.status === "ACTIVE"
                  );
                  addProductToOrder(selectedProductForOptions, selectedSize, selectedColor, variant?.id);
                  setSelectedProductForOptions(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Thêm vào hàng chờ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
