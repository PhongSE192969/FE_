import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { useCartStore } from "../../stores/cartStore";
import { formatCurrency } from "../../utils/helpers";
import toast from "react-hot-toast";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { getProductDetail } from "@/services/productService";
import { getStocks } from "@/services/inventoryService";

const MAIN_WAREHOUSE_ID = "00000000-0000-0000-0000-000000000000";

const getVariantImage = (variant, product) => {
  if (variant?.images && typeof variant.images === "object") {
    const keys = Object.keys(variant.images).sort();
    const firstKey = keys[0];

    if (firstKey && variant.images[firstKey]) {
      return variant.images[firstKey];
    }
  }

  if (variant?.imageUrl) {
    try {
      const parsed = JSON.parse(variant.imageUrl);
      if (Array.isArray(parsed) && parsed[0]) return parsed[0];
    } catch {
      return variant.imageUrl;
    }
  }

  return (
    product?.imageUrl ||
    product?.thumbnailUrl ||
    product?.image ||
    "/logo01.png"
  );
};

const getVariantSellingPrice = (variant, product) => {
  return Number(variant?.sellingPrice ?? variant?.price ?? product?.price ?? 0);
};

const getVariantSalePrice = (variant) => {
  return Number(variant?.salePrice ?? 0);
};

const hasValidSalePrice = (variant, product) => {
  const sellingPrice = getVariantSellingPrice(variant, product);
  const salePrice = getVariantSalePrice(variant);

  return salePrice > 0 && salePrice < sellingPrice;
};

const getVariantDisplayPrice = (variant, product) => {
  const sellingPrice = getVariantSellingPrice(variant, product);
  const salePrice = getVariantSalePrice(variant);

  if (salePrice > 0 && salePrice < sellingPrice) {
    return salePrice;
  }

  return sellingPrice;
};

const getVariantLabel = (variant) => {
  const variantName = variant?.variantName || "";

  const packageText =
    variant?.packageSize && variant?.packageUnit
      ? `${variant.packageSize} ${variant.packageUnit}`
      : variant?.packageUnit || "";

  return variantName || packageText || variant?.sku || "Default";
};

const extractData = (res) => {
  return res?.data?.data || res?.data || res;
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
      sum +
      Number(stock.quantity || 0) -
      Number(stock.reservedQuantity || 0)
    );
  }, 0);
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).customer?.productDetail || {};

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [variantStocks, setVariantStocks] = useState({});

  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [liked, setLiked] = useState(false);

  const similarScrollRef = useRef(null);

  const scrollSimilarProducts = (direction) => {
    if (!similarScrollRef.current) return;

    similarScrollRef.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);

      try {
        const res = await getProductDetail(id);
        const data = res?.data?.data || res?.data || res;

        if (!data) {
          setProduct(null);
          return;
        }

        const variantsList = Array.isArray(data.variants) ? data.variants : [];

        const activeVariants = variantsList.filter(
          (variant) => !variant.status || variant.status === "ACTIVE"
        );

        const firstActiveVariant = activeVariants[0] || variantsList[0] || null;

        setProduct({
          ...data,
          categoryName:
            data.category?.name || data.categoryName || "Chưa phân loại",
          details: data.description || "Không có mô tả cho sản phẩm này.",
          rating: 5.0,
          reviews: 128,
          badge: data.productType === "Combo" ? "Combo" : null,
        });

        setSelectedVariantId(firstActiveVariant?.id || "");
        setQty(1);

        try {
          const stockRes = await getStocks(null, false, 0, 500);
          const allStocks = extractStockContent(stockRes);

          const stockMap = {};

          variantsList.forEach((variant) => {
            const stocksByVariant = allStocks.filter(
              (stock) => stock.productVariantId === variant.id
            );

            const franchiseStocks = stocksByVariant.filter(
              (stock) =>
                stock.locationId !== MAIN_WAREHOUSE_ID &&
                stock.locationType !== "WAREHOUSE"
            );

            const warehouseStocks = stocksByVariant.filter(
              (stock) =>
                stock.locationId === MAIN_WAREHOUSE_ID ||
                stock.locationType === "WAREHOUSE"
            );

            const totalFranchiseStock =
              calculateAvailableStock(franchiseStocks);
            const totalWarehouseStock =
              calculateAvailableStock(warehouseStocks);

            stockMap[variant.id] = Math.max(
              0,
              totalFranchiseStock > 0 ? totalFranchiseStock : totalWarehouseStock
            );
          });

          setVariantStocks(stockMap);
        } catch (stockErr) {
          console.error("Failed to fetch detailed stocks:", stockErr);

          const fallbackStockMap = {};

          variantsList.forEach((variant) => {
            fallbackStockMap[variant.id] = variant.quantity ?? 999;
          });

          setVariantStocks(fallbackStockMap);
        }

        setRelated([]);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id]);

  const variants = useMemo(() => {
    return Array.isArray(product?.variants) ? product.variants : [];
  }, [product]);

  const activeVariants = useMemo(() => {
    return variants.filter(
      (variant) => !variant.status || variant.status === "ACTIVE"
    );
  }, [variants]);

  const currentVariant = useMemo(() => {
    if (activeVariants.length === 0) return null;

    return (
      activeVariants.find((variant) => variant.id === selectedVariantId) ||
      activeVariants[0]
    );
  }, [activeVariants, selectedVariantId]);

  const maxAvailable = useMemo(() => {
    if (!currentVariant?.id) return 0;

    return variantStocks[currentVariant.id] ?? currentVariant.quantity ?? 999;
  }, [currentVariant, variantStocks]);

  const unitPrice = useMemo(() => {
    return getVariantDisplayPrice(currentVariant, product);
  }, [currentVariant, product]);

  const sellingPrice = useMemo(() => {
    return getVariantSellingPrice(currentVariant, product);
  }, [currentVariant, product]);

  const isSalePrice = useMemo(() => {
    return hasValidSalePrice(currentVariant, product);
  }, [currentVariant, product]);

  const totalPrice = unitPrice * qty;

  const displayImage = useMemo(() => {
    return getVariantImage(currentVariant, product);
  }, [currentVariant, product]);

  const isOutOfStock =
    !currentVariant ||
    product?.status !== "ACTIVE" ||
    currentVariant?.status !== "ACTIVE" ||
    maxAvailable <= 0;

  useEffect(() => {
    if (maxAvailable > 0 && qty > maxAvailable) {
      setQty(maxAvailable);
    }
  }, [maxAvailable, qty]);

  const handleAddToCart = async () => {
    if (isOutOfStock || !currentVariant) return;

    const variantLabel = getVariantLabel(currentVariant);

    let success = true;

    for (let i = 0; i < qty; i++) {
      const added = await addItem(
        {
          ...product,
          price: unitPrice,
          imageUrl: displayImage,
          image: displayImage,
          selectedVariantName: variantLabel,
        },
        {
          variantId: currentVariant.id,
          productVariantId: currentVariant.id,
          variantName: currentVariant.variantName,
          packageSize: currentVariant.packageSize,
          packageUnit: currentVariant.packageUnit,
          sku: currentVariant.sku,
          sellingPrice: currentVariant.sellingPrice,
          salePrice: currentVariant.salePrice,
        },
        maxAvailable
      );

      if (!added) {
        success = false;
        break;
      }
    }

    if (success) {
      toast.success(
        t.addedToCart
          ? t.addedToCart
              .replace("{qty}", qty)
              .replace("{name}", `${product.name} (${variantLabel})`)
          : `Đã thêm ${qty}x ${product.name} (${variantLabel}) vào giỏ hàng!`,
        { icon: "🛍️" }
      );
    }
  };

  const handleIncrease = () => {
    if (qty < maxAvailable) {
      setQty((prev) => prev + 1);
    } else {
      toast.error(`Sản phẩm này chỉ còn ${maxAvailable} cái.`);
    }
  };

  const handleDecrease = () => {
    setQty((prev) => Math.max(1, prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary font-bold">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-primary">
            {t.notFound || "Product not found"}
          </h2>

          <Link
            to="/products"
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl"
          >
            <ArrowLeft size={16} /> {t.backToMenu || "Back"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <div className="bg-white border-b border-gray-100 px-4 lg:px-20 py-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} /> {t.backToMenu || "Back to Menu"}
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-20 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-lg">
                <img
                  src={displayImage}
                  alt={product.name}
                  onError={(event) => {
                    event.target.onerror = null;
                    event.target.src = "/logo01.png";
                  }}
                  className="w-full h-full object-cover transition-all duration-500"
                />
              </div>

              {product.badge && (
                <span className="absolute top-4 left-4 bg-gold text-primary font-bold text-sm px-3 py-1.5 rounded-xl shadow">
                  {product.badge}
                </span>
              )}

              {isSalePrice && (
                <span className="absolute top-4 left-4 translate-y-11 bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow">
                  SALE
                </span>
              )}

              <button
                onClick={() => setLiked(!liked)}
                className={`absolute top-4 right-4 size-10 rounded-full bg-white shadow-md flex items-center justify-center transition-all ${
                  liked ? "text-red-500" : "text-gray-300"
                }`}
              >
                <Heart size={18} className={liked ? "fill-red-500" : ""} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <span className="text-gold font-bold text-xs uppercase tracking-widest">
                  {product.categoryName}
                </span>

                <h1 className="text-4xl font-black text-primary mt-2 leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-gold">
                    <Star size={14} className="fill-gold" />
                    <span className="font-bold text-sm text-primary">
                      {product.rating}
                    </span>
                  </div>

                  <span className="text-gray-400 text-sm">
                    ({product.reviews} reviews)
                  </span>
                </div>

                <p className="text-gray-500 mt-4 leading-relaxed">
                  {product.details}
                </p>
              </div>

              <div className="space-y-5">
                {activeVariants.length > 0 && (
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-wider text-gray-400 mb-3">
                      Quy cách
                    </h3>

                    <div className="flex gap-2 flex-wrap">
                      {activeVariants.map((variant) => {
                        const isSelected = currentVariant?.id === variant.id;
                        const label = getVariantLabel(variant);

                        return (
                          <button
                            key={variant.id}
                            onClick={() => {
                              setSelectedVariantId(variant.id);
                              setQty(1);
                            }}
                            className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${
                              isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-gray-100 hover:border-primary"
                            }`}
                            title={label}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-primary">
                      {formatCurrency(totalPrice)}
                    </div>

                    {isSalePrice && (
                      <div className="mt-1 text-sm font-bold text-gray-400">
                        Giá gốc:{" "}
                        <span className="line-through">
                          {formatCurrency(sellingPrice * qty)}
                        </span>
                      </div>
                    )}
                  </div>

                  {maxAvailable > 0 && (
                    <div className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                      Còn {maxAvailable} sản phẩm
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={handleDecrease}
                      className="size-10 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="font-black text-lg w-6 text-center">
                      {qty}
                    </span>

                    <button
                      onClick={handleIncrease}
                      disabled={qty >= maxAvailable}
                      className={`size-10 rounded-lg bg-white shadow-sm flex items-center justify-center transition-colors ${
                        qty >= maxAvailable
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 h-12 font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                      isOutOfStock
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gold text-primary hover:bg-yellow-400 shadow-lg shadow-gold/20"
                    }`}
                  >
                    <ShoppingBag size={18} />
                    {isOutOfStock ? "Hết hàng" : t.addToCart || "Thêm vào giỏ"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-black text-primary mb-6">
                Sản phẩm tương tự
              </h2>

              <div className="relative group">
                <button
                  onClick={() => scrollSimilarProducts("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all -left-5 opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={() => scrollSimilarProducts("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all -right-5 opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={20} />
                </button>

                <div
                  ref={similarScrollRef}
                  className="flex gap-6 overflow-x-auto scroll-smooth snap-x pb-6 no-scrollbar"
                >
                  {related.map((relatedProduct) => {
                    const firstVariant = Array.isArray(relatedProduct.variants)
                      ? relatedProduct.variants[0]
                      : null;

                    const rPrice = getVariantDisplayPrice(
                      firstVariant,
                      relatedProduct
                    );
                    const rImg = getVariantImage(firstVariant, relatedProduct);

                    return (
                      <Link
                        key={relatedProduct.id}
                        to={`/products/${relatedProduct.id}`}
                        className="min-w-[250px] snap-start bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
                      >
                        <div className="aspect-[4/5] bg-gray-50">
                          <img
                            src={rImg}
                            className="w-full h-full object-cover"
                            alt={relatedProduct.name}
                            onError={(event) => {
                              event.target.onerror = null;
                              event.target.src = "/logo01.png";
                            }}
                          />
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-primary line-clamp-1">
                            {relatedProduct.name}
                          </h3>
                          <div className="text-gold font-black mt-1">
                            {formatCurrency(rPrice)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeVariants.length === 0 && (
            <div className="mt-10 flex items-center gap-3 text-gray-400 bg-white border border-dashed border-gray-200 rounded-2xl p-6">
              <Package size={20} />
              <span className="font-semibold">
                Sản phẩm này chưa có quy cách đang hoạt động.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}