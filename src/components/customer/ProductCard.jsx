import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Star, ShoppingCart } from "lucide-react";
import { useCartStore } from "../../stores/cartStore";
import { formatCurrency, truncateWords } from "../../utils/helpers";
import toast from "react-hot-toast";
import { useLanguageStore } from "../../stores";
import { translations } from "../../locales";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=400";

const getVariantImage = (variant, product) => {
  return (
    variant?.images?.image01 ||
    variant?.images?.image1 ||
    variant?.imageUrl ||
    product?.thumbnailUrl ||
    product?.imageUrl ||
    FALLBACK_IMAGE
  );
};

const getVariantSellingPrice = (variant) => {
  return Number(variant?.sellingPrice ?? variant?.price ?? 0);
};

const getVariantSalePrice = (variant) => {
  return Number(variant?.salePrice ?? 0);
};

const getVariantDisplayPrice = (variant) => {
  const sellingPrice = getVariantSellingPrice(variant);
  const salePrice = getVariantSalePrice(variant);

  if (salePrice > 0 && salePrice < sellingPrice) {
    return salePrice;
  }

  return sellingPrice;
};

const hasValidSalePrice = (variant) => {
  const sellingPrice = getVariantSellingPrice(variant);
  const salePrice = getVariantSalePrice(variant);

  return salePrice > 0 && salePrice < sellingPrice;
};

const getVariantLabel = (variant) => {
  const variantName = variant?.variantName || "";
  const packageText =
    variant?.packageSize && variant?.packageUnit
      ? `${variant.packageSize} ${variant.packageUnit}`
      : variant?.packageUnit || "";

  return variantName || packageText || variant?.sku || "Default";
};

export default function ProductCard({ product, variantStocks = {} }) {
  const { addItem } = useCartStore();
  const [adding, setAdding] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).customer?.products || {};

  const activeVariants = useMemo(() => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    return variants.filter((variant) => !variant.status || variant.status === "ACTIVE");
  }, [product?.variants]);

  const selectedVariant = useMemo(() => {
    if (activeVariants.length === 0) return null;

    return (
      activeVariants.find((variant) => variant.id === selectedVariantId) ||
      activeVariants[0]
    );
  }, [activeVariants, selectedVariantId]);

  const priceRange = useMemo(() => {
    if (activeVariants.length === 0) {
      return {
        min: 0,
        max: 0,
      };
    }

    const prices = activeVariants
      .map(getVariantDisplayPrice)
      .filter((price) => price >= 0);

    if (prices.length === 0) {
      return {
        min: 0,
        max: 0,
      };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [activeVariants]);

  const displayPrice = selectedVariant
    ? formatCurrency(getVariantDisplayPrice(selectedVariant))
    : priceRange.min === priceRange.max
      ? formatCurrency(priceRange.min)
      : `${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}`;

  const selectedSellingPrice = selectedVariant
    ? getVariantSellingPrice(selectedVariant)
    : 0;

  const selectedHasSale = selectedVariant
    ? hasValidSalePrice(selectedVariant)
    : false;

  const totalStock = activeVariants.reduce((sum, variant) => {
    const stock =
      variantStocks[variant.id] !== undefined
        ? variantStocks[variant.id]
        : variant.quantity ?? 999;

    return sum + Number(stock || 0);
  }, 0);

  const isSoldOut =
    product.status !== "ACTIVE" ||
    activeVariants.length === 0 ||
    totalStock <= 0;

  const handleAdd = async (event) => {
    event.preventDefault();

    if (!selectedVariant || isSoldOut) return;

    try {
      setAdding(true);

      const variantImage = getVariantImage(selectedVariant, product);
      const variantLabel = getVariantLabel(selectedVariant);
      const price = getVariantDisplayPrice(selectedVariant);

      const success = await addItem(
        {
          ...product,
          price,
          imageUrl: variantImage,
          selectedVariantName: variantLabel,
        },
        {
          variantId: selectedVariant.id,
          productVariantId: selectedVariant.id,
          variantName: selectedVariant.variantName,
          packageSize: selectedVariant.packageSize,
          packageUnit: selectedVariant.packageUnit,
          sku: selectedVariant.sku,
          sellingPrice: selectedVariant.sellingPrice,
          salePrice: selectedVariant.salePrice,
        },
        variantStocks[selectedVariant.id] ?? selectedVariant.quantity ?? 999
      );

      if (success) {
        toast.success(
          t.toastAdded
            ? t.toastAdded.replace("{name}", `${product.name} (${variantLabel})`)
            : `${product.name} (${variantLabel}) đã được thêm vào giỏ hàng!`
        );
      }
    } finally {
      setTimeout(() => setAdding(false), 600);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-gray-200/80 transition-all duration-500"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
        <img
          src={getVariantImage(selectedVariant, product)}
          alt={truncateWords(product.name || "Product", 5)}
          onError={(event) => {
            event.target.onerror = null;
            event.target.src = FALLBACK_IMAGE;
          }}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />

        {product.badge && (
          <span className="absolute top-3 left-3 bg-gold text-primary text-xs font-bold px-2.5 py-1 rounded-lg shadow">
            {product.badge}
          </span>
        )}

        {selectedHasSale && (
          <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow">
            SALE
          </span>
        )}

        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="bg-white text-primary font-black text-sm px-5 py-2.5 rounded-2xl shadow-xl uppercase tracking-widest">
              {t.soldOut || "Hết hàng"}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-col gap-2 justify-between items-start mb-1">
          <h4 className="text-sm font-bold text-primary group-hover:text-purple-600 transition-colors leading-tight">
            {truncateWords(product.name || "N/A", 10)}
          </h4>

          <div className="my-2">
            <span className="text-base font-bold text-red-600 shrink-0">
              {displayPrice}
            </span>

            {selectedHasSale && (
              <span className="ml-2 text-xs text-gray-400 line-through font-semibold">
                {formatCurrency(selectedSellingPrice)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 mb-1">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-gray-800">
            {product.rating || 4.8}
          </span>
          <span className="text-xs text-gray-400">
            ({product.reviews || 120})
          </span>
        </div>

        <div className="flex flex-col gap-3 mb-2 mt-2">
          {activeVariants.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-gray-500 mr-1">
                Quy cách:
              </span>

              {activeVariants.map((variant) => {
                const checked = selectedVariant?.id === variant.id;
                const label = getVariantLabel(variant);

                return (
                  <button
                    key={variant.id}
                    onClick={(event) => {
                      event.preventDefault();
                      setSelectedVariantId(variant.id);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      checked
                        ? "bg-gray-950 text-white border-gray-950 shadow-md"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-900"
                    }`}
                    title={label}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
          {product.description || "Sản phẩm chất lượng cao."}
        </p>

        <button
          onClick={handleAdd}
          disabled={isSoldOut || adding || !selectedVariant}
          className={`mt-auto w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300
            ${
              adding
                ? "bg-green-500 text-white scale-95"
                : "bg-gray-950 text-white hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 shadow-md shadow-gray-200/40"
            }
            ${isSoldOut || !selectedVariant ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {adding ? (
            <>
              <ShoppingCart size={16} /> {t.added || "Added!"}
            </>
          ) : (
            <>
              <Plus size={16} /> {t.addToOrder || "Add to Order"}
            </>
          )}
        </button>
      </div>
    </Link>
  );
}