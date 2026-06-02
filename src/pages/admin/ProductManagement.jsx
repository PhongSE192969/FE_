import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Image as ImageIcon,
  Scale,
  Search as SearchIcon,
  DollarSign,
  Eye,
  Sprout,
  Warehouse,
  BadgeCheck,
} from "lucide-react";

import {
  SearchInput,
  SelectOption,
  Table,
  PaginationControls,
  InputTextField,
} from "@/components/ui";
import {
  AddEditProduct,
  ConfirmModal,
  ProductDetailModal,
} from "@/components/modal";
import { useLanguageStore } from "@/stores";
import { useProductStore } from "@/stores";
import { translations } from "@/locales";
import { getLocalizedField, truncateWords } from "@/utils/helpers";
import { DeleteProduct } from "@/services";
import toast from "react-hot-toast";

const PACKAGE_UNIT_OPTIONS = ["KG", "G", "L", "ML", "BAG"];

const ProductManagement = () => {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).admin?.productManagement || {};

  const {
    products,
    categories,
    isLoading,
    totalPages,
    statsCounts,
    fetchProductsList,
    fetchCategoriesList,
  } = useProductStore();

  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [categoryName, setCategoryName] = useState("All");
  const [status, setStatus] = useState("All");
  const [packageUnit, setPackageUnit] = useState("All");
  const [fromPrice, setFromPrice] = useState("");
  const [toPrice, setToPrice] = useState("");
  const [debouncedFromPrice, setDebouncedFromPrice] = useState("");
  const [debouncedToPrice, setDebouncedToPrice] = useState("");

  const [viewingProduct, setViewingProduct] = useState(null);

  const [page, setPage] = useState(1);
  const sizePage = 10;
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const tableColumns = useMemo(
    () => [
      { id: "info", label: "Product Info", sortable: true, sortKey: "name" },
      { id: "category", label: "Category", sortable: false },
      { id: "brand", label: "Brand", sortable: true, sortKey: "brand" },
      { id: "variants", label: "Package Units", sortable: false },
      { id: "price", label: "Selling Price Range", sortable: false },
      { id: "status", label: "Status", sortable: true, sortKey: "status" },
      { id: "actions", label: "", sortable: false },
    ],
    []
  );

  const [visibleColumns, setVisibleColumns] = useState(
    tableColumns.map((c) => c.id)
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setDebouncedFromPrice(fromPrice);
      setDebouncedToPrice(toPrice);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword, fromPrice, toPrice]);

  useEffect(() => {
    fetchCategoriesList();
  }, [fetchCategoriesList]);

  useEffect(() => {
    fetchProductsList({
      keyword: debouncedKeyword,
      categoryName,
      status,
      packageUnit,
      fromPrice: debouncedFromPrice,
      toPrice: debouncedToPrice,
      page,
      sizePage,
      sortBy,
      sortDir,
    });
  }, [
    debouncedKeyword,
    categoryName,
    status,
    packageUnit,
    debouncedFromPrice,
    debouncedToPrice,
    page,
    sortBy,
    sortDir,
    refreshKey,
    fetchProductsList,
  ]);

  const formatCurrency = (val) => {
    const number = Number(val || 0);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(number);
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

  const getActiveVariants = (variants) => {
    if (!Array.isArray(variants)) return [];
    return variants.filter(
      (variant) => !variant.status || variant.status === "ACTIVE"
    );
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
    const activeVariants = getActiveVariants(variants);
    const saleVariants = activeVariants.filter(hasValidSalePrice);

    if (saleVariants.length === 0) return null;

    return `${saleVariants.length} variant đang sale`;
  };

  const getFirstImage = (variants) => {
    const activeVariants = getActiveVariants(variants);
    const firstVariant = activeVariants[0] || (Array.isArray(variants) ? variants[0] : null);

    return (
      firstVariant?.images?.image01 ||
      firstVariant?.images?.image1 ||
      firstVariant?.imageUrl ||
      null
    );
  };

  const handleSort = (key) => {
    if (!key) return;

    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }

    setPage(1);
  };

  const deleteProduct = async () => {
    if (!deleteConfirmProduct) return;

    try {
      const response = await DeleteProduct(deleteConfirmProduct?.id);

      if (response.statusCode === 200 && response.data) {
        toast.success(response.message || "Product is inactive");
        setDeleteConfirmProduct(null);
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
      setDeleteConfirmProduct(null);
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8f1] p-4 pb-10 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-800 to-lime-700 p-6 shadow-[0_24px_60px_rgba(6,78,59,0.18)]">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-lime-300/20 blur-3xl" />
          <div className="absolute bottom-0 right-32 h-28 w-28 rounded-full bg-yellow-300/20 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-lime-100 backdrop-blur-md">
                <Sprout size={14} />
                Fertilizer Franchise System
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                {t.title || "Product Management"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
                {t.subtitle ||
                  "Quản lý danh mục phân bón, biến thể đóng gói, giá bán và trạng thái sản phẩm cho hệ thống franchise."}
              </p>
            </div>

            <button
              onClick={async () => {
                await fetchCategoriesList();
                setSelectedProduct(null);
                setIsModalOpen(true);
              }}
              className="group flex items-center justify-center gap-2 rounded-2xl bg-lime-300 px-5 py-3 font-black text-emerald-950 shadow-[0_18px_35px_rgba(190,242,100,0.22)] transition-all hover:bg-lime-200 active:scale-95"
            >
              <Plus
                size={18}
                className="transition-transform group-hover:rotate-90"
              />
              <span>{t.addProduct || "Add New Product"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Products
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-950">
                  {statsCounts.totalElements}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Package size={26} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              Tổng số mặt hàng phân bón trong hệ thống
            </div>
          </div>

          <div className="rounded-3xl border border-lime-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Products
                </p>
                <p className="mt-2 text-3xl font-black text-lime-700">
                  {statsCounts.active}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-50 text-lime-700">
                <CheckCircle2 size={26} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-lime-50 px-3 py-2 text-xs font-semibold text-lime-700">
              Sản phẩm đang hoạt động trên trang hiện tại
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Categories
                </p>
                <p className="mt-2 text-3xl font-black text-amber-700">
                  {categories?.length || 0}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Warehouse size={26} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              Nhóm sản phẩm / dòng phân bón đang quản lý
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-emerald-100 bg-gradient-to-r from-white to-emerald-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Filter size={18} />
                </div>
                <div>
                  <h3 className="font-black text-emerald-950">
                    Bộ lọc sản phẩm
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tìm kiếm theo tên, danh mục, đơn vị đóng gói và khoảng giá
                  </p>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <BadgeCheck size={14} />
              Price uses sellingPrice
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <SelectOption
                value={categoryName}
                onChange={(val) => {
                  setCategoryName(val);
                  setPage(1);
                }}
                placeholder="All Categories"
                icon={Layers}
                options={categories.map((c) => ({
                  value: c.name,
                  label: c.name,
                }))}
              />

              <SelectOption
                value={status}
                onChange={(val) => {
                  setStatus(val);
                  setPage(1);
                }}
                placeholder="All Status"
                icon={Filter}
                options={[
                  { value: "ACTIVE", label: "ACTIVE" },
                  { value: "INACTIVE", label: "INACTIVE" },
                ]}
              />

              <SelectOption
                value={packageUnit}
                onChange={(val) => {
                  setPackageUnit(val);
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SearchInput
                value={keyword}
                onChange={setKeyword}
                placeholder="Search by product name..."
                className="w-full"
                icon={SearchIcon}
              />

              <InputTextField
                type="number"
                placeholder="Min Price (VND)"
                value={fromPrice}
                onChange={setFromPrice}
                icon={DollarSign}
              />

              <InputTextField
                type="number"
                placeholder="Max Price (VND)"
                value={toPrice}
                onChange={setToPrice}
                icon={DollarSign}
              />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[28px] bg-white/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-6 py-5 shadow-xl">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
                <p className="text-sm font-bold text-emerald-800">
                  Đang tải danh mục phân bón...
                </p>
              </div>
            </div>
          )}

          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-950 to-emerald-800 px-5 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-black text-white">Product Catalog</h3>
                <p className="text-xs text-emerald-100/80">
                  Danh sách sản phẩm, biến thể đóng gói và trạng thái kinh doanh
                </p>
              </div>

              <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-lime-100 ring-1 ring-white/15">
                Page {page} / {totalPages || 1}
              </div>
            </div>
          </div>

          <Table
            columns={tableColumns}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            isEmpty={!isLoading && products.length === 0}
            emptyMessage="No products found matching your search."
          >
            {products.map((prod) => {
              const variants = Array.isArray(prod?.variants)
                ? prod.variants
                : [];
              const activeVariants = getActiveVariants(variants);
              const localizedName = getLocalizedField(prod, "name", language);
              const localizedBrand = getLocalizedField(prod, "brand", language);
              const firstImage = getFirstImage(variants);
              const saleSummary = getSaleSummary(variants);

              const uniquePackageUnits = [
                ...new Set(
                  activeVariants.map((v) => v.packageUnit).filter(Boolean)
                ),
              ];

              const uniquePackageNames = [
                ...new Set(
                  activeVariants.map((v) => v.variantName).filter(Boolean)
                ),
              ];

              return (
                <tr
                  key={prod.id}
                  className="group border-b border-emerald-50 transition-colors hover:bg-emerald-50/45"
                >
                  {visibleColumns.includes("info") && (
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 shadow-sm">
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={prod.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon
                              size={18}
                              className="text-emerald-400"
                            />
                          )}
                        </div>

                        <div>
                          <div className="font-black text-slate-900">
                            {truncateWords(
                              localizedName || prod.name || "N/A",
                              5
                            )}
                          </div>
                          <div className="mt-1 text-xs font-medium text-slate-400">
                            Fertilizer product
                          </div>
                        </div>
                      </div>
                    </td>
                  )}

                  {visibleColumns.includes("category") && (
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {prod.category?.name || "N/A"}
                      </span>
                    </td>
                  )}

                  {visibleColumns.includes("brand") && (
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-slate-700">
                        {localizedBrand || prod.brand || "N/A"}
                      </span>
                    </td>
                  )}

                  {visibleColumns.includes("variants") && (
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {uniquePackageUnits.length > 0 ? (
                            uniquePackageUnits.map((unit) => (
                              <span
                                key={unit}
                                className="rounded-lg bg-lime-50 px-2 py-1 text-[10px] font-black text-lime-700 ring-1 ring-lime-100"
                              >
                                {unit}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {uniquePackageNames.length > 0 ? (
                            uniquePackageNames.slice(0, 3).map((name) => (
                              <span
                                key={name}
                                className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500"
                              >
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </div>
                    </td>
                  )}

                  {visibleColumns.includes("price") && (
                    <td className="px-6 py-5">
                      <div className="text-sm font-black text-amber-600">
                        {getPriceRange(variants)}
                      </div>

                      {saleSummary && (
                        <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-rose-500">
                          {saleSummary}
                        </div>
                      )}

                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {activeVariants.length || 0} active variants
                      </div>
                    </td>
                  )}

                  {visibleColumns.includes("status") && (
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                          prod.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                            : "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                        }`}
                      >
                        {prod.status}
                      </span>
                    </td>
                  )}

                  {visibleColumns.includes("actions") && (
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => setViewingProduct(prod)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={async () => {
                            await fetchCategoriesList();
                            setSelectedProduct(prod);
                            setIsModalOpen(true);
                          }}
                          className="rounded-xl border border-transparent p-2 text-slate-400 transition-all hover:border-amber-100 hover:bg-amber-50 hover:text-amber-600"
                          title="Edit Product"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() => {
                            setDeleteConfirmProduct(prod);
                          }}
                          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </Table>

          <div className="border-t border-emerald-100 bg-white px-4 py-3">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              setPage={setPage}
            />
          </div>
        </div>

        <ConfirmModal
          isOpen={!!deleteConfirmProduct}
          onClose={() => setDeleteConfirmProduct(null)}
          onConfirm={deleteProduct}
          title={t.modals?.delete?.title || "Confirm Deletion"}
          message={
            t.modals?.delete?.message
              ? t.modals.delete.message.replace(
                  "{name}",
                  deleteConfirmProduct?.name
                )
              : `Are you sure you want to delete product ${deleteConfirmProduct?.name}? This action cannot be undone.`
          }
          confirmText={t.modals?.delete?.confirm || "Yes, Delete"}
          cancelText={t.modals?.delete?.cancel || "Cancel"}
          type="danger"
        />

        {isModalOpen && (
          <AddEditProduct
            selectedProduct={selectedProduct}
            categories={categories}
            setIsModalOpen={setIsModalOpen}
          />
        )}

        <ProductDetailModal
          selectedProduct={viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      </div>
    </div>
  );
};

export default ProductManagement;