import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Image as ImageIcon,
  Eye,
  Scale,
} from "lucide-react";

import {
  StatCard,
  SearchInput,
  Table,
  PaginationControls,
  SelectOption,
} from "@/components/ui";

import { ProductDetailModal } from "@/components/modal";
import { useProductStore } from "@/stores";

const PACKAGE_UNIT_OPTIONS = ["KG", "G", "L", "ML", "BAG"];

const ProductManager = () => {
  const {
    products,
    isLoading,
    totalPages,
    statsCounts,
    fetchProductsList,
    categories,
    fetchCategoriesList,
  } = useProductStore();

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  const [categoryName, setCategoryName] = useState("All");
  const [status, setStatus] = useState("All");
  const [packageUnit, setPackageUnit] = useState("All");
  const [fromPrice, setFromPrice] = useState("");
  const [toPrice, setToPrice] = useState("");

  const [page, setPage] = useState(1);
  const [viewingProduct, setViewingProduct] = useState(null);

  useEffect(() => {
    fetchCategoriesList();
  }, [fetchCategoriesList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    fetchProductsList({
      keyword: debouncedKeyword,
      categoryName,
      status,
      packageUnit,
      fromPrice,
      toPrice,
      page,
      sizePage: 10,
      sortBy: "createdAt",
      sortDir: "desc",
    });
  }, [
    debouncedKeyword,
    page,
    categoryName,
    status,
    packageUnit,
    fromPrice,
    toPrice,
    fetchProductsList,
  ]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(value || 0));
  };

  const getActiveVariants = (variants) => {
    if (!Array.isArray(variants)) return [];

    return variants.filter(
      (variant) => !variant.status || variant.status === "ACTIVE"
    );
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

  const getPriceRange = (variants) => {
    const activeVariants = getActiveVariants(variants);

    if (activeVariants.length === 0) return "N/A";

    const prices = activeVariants
      .map(getVariantSellingPrice)
      .filter((price) => !Number.isNaN(price) && price >= 0);

    if (prices.length === 0) return "N/A";

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return min === max
      ? formatCurrency(min)
      : `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  const getSaleSummary = (variants) => {
    const saleCount = getActiveVariants(variants).filter(hasValidSalePrice).length;
    return saleCount > 0 ? `${saleCount} sale` : null;
  };

  const getStock = (variants) => {
    return getActiveVariants(variants).reduce((sum, variant) => {
      return sum + Number(variant.quantity || 0);
    }, 0);
  };

  const getImage = (variant) => {
    if (!variant) return null;

    if (variant.images?.image01) return variant.images.image01;
    if (variant.images?.image1) return variant.images.image1;

    if (variant.imageUrl) {
      try {
        const parsed = JSON.parse(variant.imageUrl);
        return parsed?.[0] || null;
      } catch {
        return variant.imageUrl;
      }
    }

    return null;
  };

  const stats = useMemo(
    () => ({
      total: statsCounts.totalElements,
      active: statsCounts.active,
      outOfStock: products.filter((product) => getStock(product.variants) === 0)
        .length,
      lowStock: products.filter((product) => {
        const stock = getStock(product.variants);
        return stock > 0 && stock < 15;
      }).length,
    }),
    [products, statsCounts]
  );

  const columns = [
    { id: "info", label: "Product Info" },
    { id: "category", label: "Category" },
    { id: "package", label: "Package" },
    { id: "price", label: "Selling Price Range" },
    { id: "stock", label: "Stock" },
    { id: "status", label: "Status" },
    { id: "actions", label: "" },
  ];

  return (
    <div className="space-y-6 pb-10 p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div>
        <h2 className="text-2xl font-black text-slate-900">
          Product Management
        </h2>
        <p className="text-gray-500 text-sm mt-1">View & search products</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <StatCard
          icon={Package}
          label="Total"
          value={stats.total}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active"
          value={stats.active}
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={stats.lowStock}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <StatCard
          icon={TrendingUp}
          label="Out of Stock"
          value={stats.outOfStock}
          color="text-red-600"
          bg="bg-red-50"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <SelectOption
            value={categoryName}
            onChange={(value) => {
              setCategoryName(value);
              setPage(1);
            }}
            placeholder="All Categories"
            options={categories.map((category) => ({
              value: category.name,
              label: category.name,
            }))}
          />

          <SelectOption
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            placeholder="All Status"
            options={[
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "INACTIVE", label: "INACTIVE" },
            ]}
          />

          <SelectOption
            value={packageUnit}
            onChange={(value) => {
              setPackageUnit(value);
              setPage(1);
            }}
            placeholder="All Package Units"
            icon={Scale}
            options={PACKAGE_UNIT_OPTIONS.map((unit) => ({
              value: unit,
              label: unit,
            }))}
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <SearchInput
            value={keyword}
            onChange={setKeyword}
            placeholder="Search product..."
          />

          <input
            type="number"
            placeholder="Min price"
            value={fromPrice}
            onChange={(event) => setFromPrice(event.target.value)}
            className="px-4 py-2 bg-gray-50 border rounded-xl text-sm w-40"
          />

          <input
            type="number"
            placeholder="Max price"
            value={toPrice}
            onChange={(event) => setToPrice(event.target.value)}
            className="px-4 py-2 bg-gray-50 border rounded-xl text-sm w-40"
          />
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="w-8 h-8 border-4 border-[#d9a13b] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <Table columns={columns} visibleColumns={columns.map((column) => column.id)}>
          {products.map((product) => {
            const variants = Array.isArray(product?.variants)
              ? product.variants
              : [];
            const activeVariants = getActiveVariants(variants);
            const stock = getStock(variants);
            const firstImage = getImage(activeVariants[0] || variants[0]);
            const saleSummary = getSaleSummary(variants);

            const packageUnits = [
              ...new Set(activeVariants.map((variant) => variant.packageUnit).filter(Boolean)),
            ];

            return (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-5">
                  <div className="flex gap-3">
                    <div className="size-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          className="w-full h-full object-cover"
                          alt={product.name}
                        />
                      ) : (
                        <ImageIcon size={16} />
                      )}
                    </div>

                    <div>
                      <div className="font-bold">{product.name}</div>
                      <div className="text-xs text-gray-400">
                        {product.brand || "N/A"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5">{product.category?.name || "N/A"}</td>

                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1.5">
                    {packageUnits.length > 0 ? (
                      packageUnits.map((unit) => (
                        <span
                          key={unit}
                          className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600"
                        >
                          {unit}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-5 font-black text-[#d9a13b]">
                  <div>{getPriceRange(variants)}</div>
                  {saleSummary && (
                    <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-rose-500">
                      {saleSummary}
                    </div>
                  )}
                </td>

                <td className="px-6 py-5">
                  <span className={stock < 15 ? "text-red-500 font-bold" : ""}>
                    {stock}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      product.status === "ACTIVE"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>

                <td className="px-6 py-5 text-right">
                  <button
                    onClick={() => setViewingProduct(product)}
                    className="p-2 text-gray-400 hover:text-black"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </Table>

        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      </div>

      <ProductDetailModal
        selectedProduct={viewingProduct}
        onClose={() => setViewingProduct(null)}
      />
    </div>
  );
};

export default ProductManager;