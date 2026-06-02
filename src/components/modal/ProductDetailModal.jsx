import React from "react";
import {
  X,
  Package,
  Layers,
  Shield,
  Tag,
  AlignLeft,
  Hash,
  DollarSign,
} from "lucide-react";

const getVariantImages = (variant) => {
  if (!variant) return [];

  if (variant.images && typeof variant.images === "object") {
    return Object.keys(variant.images)
      .sort()
      .map((key) => variant.images[key])
      .filter(Boolean);
  }

  if (Array.isArray(variant.imageUrls)) {
    return variant.imageUrls.filter(Boolean);
  }

  if (variant.imageUrl) {
    try {
      const parsed = JSON.parse(variant.imageUrl);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return [variant.imageUrl];
    }
  }

  return [];
};

const getMainImage = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const activeVariant = variants.find((variant) => variant.status === "ACTIVE");
  const firstVariant = activeVariant || variants[0];

  return getVariantImages(firstVariant)[0] || null;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(price || 0));
};

const getVariantSellingPrice = (variant) => {
  return Number(variant?.sellingPrice ?? variant?.price ?? 0);
};

const getVariantSalePrice = (variant) => {
  return Number(variant?.salePrice ?? 0);
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

  return variantName || packageText || variant?.sku || "Default Variant";
};

const ProductDetailModal = ({ selectedProduct, onClose }) => {
  if (!selectedProduct) return null;

  const mainImage = getMainImage(selectedProduct);
  const variants = Array.isArray(selectedProduct?.variants)
    ? selectedProduct.variants
    : [];

  const renderStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">
            ACTIVE
          </span>
        );
      case "INACTIVE":
      case "SUSPENDED":
        return (
          <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold">
            INACTIVE
          </span>
        );
      case "DELETED":
        return (
          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
            DELETED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
            {status || "UNKNOWN"}
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="relative h-44 bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 size-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>

          <div className="absolute top-8 left-8 flex items-end gap-5">
            <div className="size-28 rounded-3xl bg-white p-1 shadow-xl shrink-0">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt="Product"
                  className="size-full rounded-2xl object-cover bg-gray-100"
                />
              ) : (
                <div className="size-full rounded-2xl bg-[#d9a13b] flex items-center justify-center text-white">
                  <Package size={40} />
                </div>
              )}
            </div>

            <div className="mb-2">
              <div className="flex items-center gap-3">
                <h3
                  className="text-md font-bold text-white leading-tight line-clamp-1 max-w-[350px] md:max-w-[520px]"
                  title={selectedProduct.name}
                >
                  {selectedProduct.name}
                </h3>
                {renderStatusBadge(selectedProduct.status)}
              </div>

              <div className="mt-2 flex items-center gap-3 text-sm text-slate-300 font-semibold">
                <div className="flex items-center gap-1">
                  <Layers size={14} className="text-[#d9a13b]" />
                  {selectedProduct.category?.name || "N/A"}
                </div>

                <div className="flex items-center gap-1">
                  <Shield size={14} className="text-[#d9a13b]" />
                  {selectedProduct.brand || "N/A"}
                </div>
              </div>

              <div className="flex mt-1.5 items-center gap-1 text-xs text-slate-400 font-mono">
                <Hash size={10} /> ID: {selectedProduct.id}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-14 p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-6">
            <div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <AlignLeft size={14} /> Product Description
              </h4>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-slate-600 leading-relaxed font-medium">
                {selectedProduct.description || "No description provided."}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Tag size={14} /> Product Variants ({variants.length || 0})
              </h4>

              <div className="space-y-3">
                {variants.length > 0 ? (
                  variants.map((variant) => {
                    const images = getVariantImages(variant);
                    const variantImage = images[0];
                    const sellingPrice = getVariantSellingPrice(variant);
                    const salePrice = getVariantSalePrice(variant);
                    const isSale = hasValidSalePrice(variant);

                    return (
                      <div
                        key={variant.id}
                        className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="size-14 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0">
                              {variantImage ? (
                                <img
                                  src={variantImage}
                                  alt="variant"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package
                                  size={20}
                                  className="m-auto mt-4 text-gray-300"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black text-slate-800">
                                  {getVariantLabel(variant)}
                                </span>

                                {variant.packageSize && variant.packageUnit && (
                                  <span className="text-xs font-bold text-slate-500 border-l border-gray-300 pl-2">
                                    {variant.packageSize} {variant.packageUnit}
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                SKU:{" "}
                                {variant.sku ||
                                  variant.id?.substring?.(0, 8) ||
                                  "N/A"}
                              </div>

                              <div className="text-[10px] text-gray-400 font-semibold mt-1">
                                Images: {images.length}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-right shrink-0">
                            <div className="min-w-[110px]">
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Import Price
                              </div>
                              <div className="text-xs font-bold text-slate-500">
                                {formatPrice(variant.importPrice)}
                              </div>
                            </div>

                            <div className="min-w-[120px]">
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Selling Price
                              </div>
                              <div className="text-sm font-black text-[#d9a13b]">
                                {formatPrice(sellingPrice)}
                              </div>
                            </div>

                            <div className="min-w-[110px]">
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Sale Price
                              </div>
                              <div
                                className={`text-xs font-black ${
                                  isSale ? "text-red-600" : "text-slate-400"
                                }`}
                              >
                                {isSale ? formatPrice(salePrice) : "-"}
                              </div>
                            </div>

                            <div>{renderStatusBadge(variant.status)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-400 text-center italic font-medium">
                    No variants available for this product.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <DollarSign size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <div className="text-xs font-black text-blue-700 uppercase tracking-widest">
                    Price Rule
                  </div>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Admin detail hiển thị riêng Import Price, Selling Price và
                    Sale Price. Giá bán chính thức là Selling Price. Sale Price
                    chỉ hợp lệ khi nhỏ hơn Selling Price.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;