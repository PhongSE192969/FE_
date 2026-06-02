import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  XCircle,
  Package,
  ClipboardList,
  Minus,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Filter,
} from "lucide-react";
import { GetAllCategories, SearchProducts } from "@/services/productService";

const extractData = (res) => {
  return res?.data?.data || res?.data || res;
};

const getVariantImage = (variant) => {
  return (
    variant?.images?.image01 ||
    variant?.images?.image1 ||
    variant?.imageUrl ||
    null
  );
};

const buildVariantDisplayName = (product, variant) => {
  const productName = product?.name || "Product";
  const variantName = variant?.variantName || "";

  const packageText =
    variant?.packageSize && variant?.packageUnit
      ? `${variant.packageSize} ${variant.packageUnit}`
      : variant?.packageUnit || "";

  const suffix = variantName || packageText || variant?.sku || "";

  return suffix ? `${productName} - ${suffix}` : productName;
};

const normalizeInitialItems = (initialItems = []) => {
  if (!Array.isArray(initialItems)) return [];

  return initialItems
    .filter((item) => item?.productVariantId)
    .map((item) => ({
      productVariantId: item.productVariantId,
      name: item.name || item.productVariantName || item.productName || "Product",
      quantity: Number(item.quantity || 1) > 0 ? Number(item.quantity || 1) : 1,
    }));
};

const ProductCatalogModal = ({
  isOpen,
  onClose,
  title,
  submitText,
  onSubmit,
  t,
  currentStocks = [],
  showLocationPicker = false,
  locations = [],
  initialItems = [],
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [searchProductTerm, setSearchProductTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [paginatedProducts, setPaginatedProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  /**
   * FIX QUAN TRỌNG:
   * Không để initialItems trong dependency.
   * Nếu để [isOpen, initialItems], parent render tạo array mới sẽ gây setItems liên tục.
   */
  useEffect(() => {
    if (isOpen) {
      setItems(normalizeInitialItems(initialItems));
      return;
    }

    setItems([]);
    setIsSubmitting(false);
    setIsSuccess(false);
    setNotes("");
    setSelectedLocationId("");
    setSearchProductTerm("");
    setDebouncedSearchTerm("");
    setSelectedCategoryName("");
    setCurrentPage(1);
    setPaginatedProducts([]);
    setTotalPages(1);
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchProductTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchProductTerm]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      try {
        const res = await GetAllCategories();
        const data = extractData(res);

        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Fetch categories error:", error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchProducts = async () => {
      setIsLoadingProducts(true);

      try {
        const payload = {
          page: currentPage - 1,
          sizePage: 9,
          keyword: debouncedSearchTerm?.trim() || undefined,
          categoryName: selectedCategoryName || undefined,
          status: "ACTIVE",
          sortBy: "name",
          sortDir: "asc",
        };

        const res = await SearchProducts(payload);
        const dataPage = extractData(res);

        const products = Array.isArray(dataPage?.content)
          ? dataPage.content
          : Array.isArray(dataPage?.items)
          ? dataPage.items
          : Array.isArray(dataPage)
          ? dataPage
          : [];

        const extractedVariants = [];

        products.forEach((product) => {
          const variants = Array.isArray(product?.variants)
            ? product.variants
            : [];

          variants.forEach((variant) => {
            if (variant.status === "ACTIVE") {
              extractedVariants.push({
                productVariantId: variant.id,
                productVariantName: buildVariantDisplayName(product, variant),
                sku: variant.sku || "",
                imageUrl: getVariantImage(variant),
                packageSize: variant.packageSize,
                packageUnit: variant.packageUnit,
                sellingPrice: variant.sellingPrice,
                salePrice: variant.salePrice,
                productName: product.name,
                variantName: variant.variantName,
              });
            }
          });
        });

        setPaginatedProducts(extractedVariants);
        setTotalPages(dataPage?.totalPages || 1);
      } catch (error) {
        console.error("Fetch products error:", error);
        setPaginatedProducts([]);
        setTotalPages(1);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [isOpen, currentPage, debouncedSearchTerm, selectedCategoryName]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCategoryName]);

  const handleAddItem = (variant) => {
    if (items.some((i) => i.productVariantId === variant.productVariantId)) {
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productVariantId: variant.productVariantId,
        name: variant.productVariantName,
        quantity: 10,
      },
    ]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.productVariantId !== id));
  };

  const handleUpdateQuantity = (id, qty) => {
    const nextQty = Number(qty);

    if (Number.isNaN(nextQty) || nextQty < 1) return;

    setItems((prev) =>
      prev.map((i) =>
        i.productVariantId === id ? { ...i, quantity: nextQty } : i
      )
    );
  };

  const handleConfirm = async (e) => {
    e.preventDefault();

    if (items.length === 0) return;

    if (showLocationPicker && !selectedLocationId) {
      alert(t?.selectBranchAlert || "Please select a receiving branch!");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({ items, notes, locationId: selectedLocationId });

      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setItems([]);
        setNotes("");
        setSelectedLocationId("");
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (error) {
      setIsSubmitting(false);
      const msg = error.response?.data?.message || error.message;
      alert((t?.errorOccurred || "An error occurred: ") + msg);
    }
  };

  const generatePagination = () => {
    const pages = [];
    const safeTotalPages = Math.max(1, totalPages || 1);

    for (let i = 1; i <= safeTotalPages; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-slate-100 flex flex-col w-[98vw] max-w-[1400px] h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center bg-white p-10"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="w-28 h-28 rounded-full bg-green-500 flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/20"
            >
              <CheckCircle size={56} strokeWidth={2.5} />
            </motion.div>

            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {t?.successTitle || "Operation Successful!"}
            </h3>

            <p className="text-sm text-slate-400 mt-2 font-medium">
              {t?.successDesc || "System is synchronizing data automatically..."}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="px-10 pt-5 pb-3 flex justify-between items-center bg-slate-100 z-10 border-b border-slate-200/60">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {title}
                </h3>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-800 hover:bg-slate-200 p-2.5 rounded-full transition-colors"
              >
                <XCircle size={24} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden border-t border-slate-200/50">
              <div className="w-8/12 flex flex-col bg-slate-100 bg-opacity-80">
                <div className="px-10 py-4 bg-slate-100 bg-opacity-90 z-10 sticky top-0 flex gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder={t?.searchPlaceholder || "Search products..."}
                      className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200/60 shadow-sm rounded-2xl text-[15px] font-medium focus:ring-2 focus:ring-slate-200 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                      value={searchProductTerm}
                      onChange={(e) => setSearchProductTerm(e.target.value)}
                    />
                  </div>

                  <div className="relative w-64">
                    <Filter
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <select
                      className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200/60 shadow-sm rounded-2xl text-[15px] font-bold text-slate-700 focus:ring-2 focus:ring-slate-200 outline-none transition-all appearance-none cursor-pointer"
                      value={selectedCategoryName}
                      onChange={(e) => setSelectedCategoryName(e.target.value)}
                    >
                      <option value="">
                        {t?.allCategories || "All Categories"}
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-10 pb-10 flex flex-col">
                  {isLoadingProducts ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                      {t?.loading || "Loading..."}
                    </div>
                  ) : (
                    <>
                      {paginatedProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                          <Package
                            size={56}
                            className="mb-4 text-slate-200 stroke-1"
                          />
                          <p className="text-slate-500 font-medium">
                            {t?.noProducts || "No products found on this page"}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-6 flex-1 content-start">
                          {paginatedProducts.map((p) => {
                            const isInCart = items.some(
                              (i) => i.productVariantId === p.productVariantId
                            );

                            const stockItem = currentStocks.find(
                              (s) => s.productVariantId === p.productVariantId
                            );

                            const currentQty = stockItem
                              ? stockItem.quantity || stockItem.actual || 0
                              : 0;

                            const minStock = stockItem ? stockItem.minStock : 10;

                            const isLowStock =
                              currentStocks.length > 0 &&
                              currentQty <= minStock;

                            return (
                              <button
                                key={p.productVariantId}
                                onClick={() => handleAddItem(p)}
                                disabled={isInCart}
                                className={`flex flex-col text-left bg-white border border-slate-200/60 rounded-[1.5rem] p-5 relative transition-all duration-300 ${
                                  isInCart
                                    ? "opacity-50 border-blue-500 shadow-sm"
                                    : "hover:border-blue-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1"
                                }`}
                              >
                                {isLowStock && (
                                  <div className="absolute top-4 right-4 z-10">
                                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                                      {t?.needImport || "Need Import"}
                                    </span>
                                  </div>
                                )}

                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-5 overflow-hidden border border-slate-100">
                                  {p.imageUrl ? (
                                    <img
                                      src={p.imageUrl}
                                      alt=""
                                      className="size-full object-cover"
                                    />
                                  ) : (
                                    <Package
                                      size={28}
                                      className="text-slate-400"
                                    />
                                  )}
                                </div>

                                <h4 className="font-bold text-[15px] text-slate-800 leading-snug mb-2">
                                  {p.productVariantName}
                                </h4>

                                <p className="text-[11px] text-slate-400 font-semibold">
                                  SKU: {p.sku || "N/A"}
                                </p>

                                <p className="text-[11px] text-slate-400 font-semibold">
                                  {p.packageSize || "-"} {p.packageUnit || ""}
                                </p>

                                {isInCart && (
                                  <span className="absolute bottom-4 right-4 bg-blue-100 text-blue-800 text-[11px] font-black px-2.5 py-1 rounded-full">
                                    {t?.selected || "Selected"}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1.5 mt-10 pt-6">
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                          </button>

                          {generatePagination().map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 flex items-center justify-center rounded-full text-[15px] font-bold transition-all ${
                                currentPage === page
                                  ? "bg-slate-900 text-white"
                                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              }`}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          >
                            <ChevronRight size={20} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="w-4/12 flex flex-col bg-slate-200/80 border-l border-slate-300/40 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.02)] z-20">
                <div className="p-8 pb-5 bg-transparent z-10 flex-none space-y-4">
                  <h4 className="flex items-center justify-between font-bold text-slate-800 text-lg">
                    <span>
                      {showLocationPicker
                        ? t?.exportList || "Export List"
                        : t?.importList || "Import List"}
                    </span>
                    <span className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm">
                      {(t?.itemsCount || "{count} items").replace(
                        "{count}",
                        items.length
                      )}
                    </span>
                  </h4>

                  {showLocationPicker && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                        {t?.receivingBranch || "Receiving Branch"}
                      </label>
                      <select
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all cursor-pointer"
                      >
                        <option value="">
                          {t?.selectBranch || "-- Select receiving branch --"}
                        </option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <textarea
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[1rem] text-[14px] focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-slate-700 placeholder:text-slate-400 resize-none shadow-sm"
                    rows="2"
                    placeholder={t?.notesPlaceholder || "Enter notes..."}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-3">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                      <ClipboardList
                        size={28}
                        className="mb-4 text-slate-300 stroke-1"
                      />
                      <p className="text-slate-500 font-medium">
                        {t?.emptyList || "List is empty"}
                      </p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.productVariantId}
                        className="bg-white rounded-[1.25rem] p-4 shadow-sm border border-slate-200/60 transition-all flex justify-between items-center gap-3"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <h5 className="font-bold text-[14px] text-slate-800 leading-snug">
                            {item.name}
                          </h5>
                        </div>

                        <div className="flex items-center gap-1.5 flex-none">
                          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200/60">
                            <button
                              type="button"
                              className="w-7 h-7 flex items-center justify-center bg-white text-slate-500 rounded-md hover:text-slate-900 border border-slate-200/50"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.productVariantId,
                                  item.quantity - 1
                                )
                              }
                            >
                              <Minus size={14} strokeWidth={2.5} />
                            </button>

                            <input
                              type="number"
                              className="w-10 h-7 text-center text-[14px] font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(
                                  item.productVariantId,
                                  parseInt(e.target.value, 10) || 1
                                )
                              }
                            />

                            <button
                              type="button"
                              className="w-7 h-7 flex items-center justify-center bg-white text-slate-500 rounded-md hover:text-slate-900 border border-slate-200/50"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.productVariantId,
                                  item.quantity + 1
                                )
                              }
                            >
                              <Plus size={14} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="text-red-500 hover:text-red-600 bg-red-50 p-2 rounded-xl hover:bg-red-100 transition-colors"
                            onClick={() =>
                              handleRemoveItem(item.productVariantId)
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-8 pt-4 bg-transparent flex gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 transition-colors text-[15px]"
                  >
                    {t?.cancel || "Cancel"}
                  </button>

                  <button
                    type="button"
                    disabled={items.length === 0 || isSubmitting}
                    onClick={handleConfirm}
                    className="flex-1 py-4 rounded-2xl font-bold bg-slate-900 hover:bg-blue-600 text-white transition-all text-[15px] flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {submitText}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ProductCatalogModal;