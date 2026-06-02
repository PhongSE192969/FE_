import React, { useState, useMemo, useEffect } from "react";
import {
  Tag,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Layers,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react";

import { getAllCategories, deleteCategory } from "@/services/categoryService";

import {
  PaginationControls,
  SearchInput,
  SelectOption,
  StatCard,
  Table,
} from "@/components/ui";
import { CategoryAddUpdateModal } from "@/components/modal";

import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { getLocalizedField } from "@/utils/helpers";
import toast from "react-hot-toast";

const normalizeCategory = (c) => ({
  ...c,
  slug: c?.slug || c?.name?.toLowerCase().replace(/\s+/g, "-") || "",
  description: c?.description || "",
  productCount: c?.productCount ?? 0,
  status: c?.status || "INACTIVE",
  lastUpdated: c?.lastUpdated || c?.updatedAt || c?.createdAt || null,
  products: Array.isArray(c?.products) ? c.products : [],
});

const CategoryManagement = () => {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).admin?.categoryManagement || {};

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [page, setPage] = useState(1);
  const sizePage = 10;
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [sortDir, setSortDir] = useState("desc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const tableColumns = useMemo(
    () => [
      {
        id: "info",
        label: t.table?.name || "Category Info",
        sortable: true,
        sortKey: "name",
      },
      {
        id: "slug",
        label: t.table?.slug || "Slug",
        sortable: true,
        sortKey: "slug",
      },
      {
        id: "products",
        label: t.table?.products || "Products",
        sortable: true,
        sortKey: "productCount",
      },
      {
        id: "updated",
        label: t.table?.updated || "Last Updated",
        sortable: true,
        sortKey: "lastUpdated",
      },
      {
        id: "status",
        label: t.table?.status || "Status",
        sortable: true,
        sortKey: "status",
      },
      { id: "actions", label: "", sortable: false },
    ],
    [t]
  );

  const [visibleColumns, setVisibleColumns] = useState(
    tableColumns.map((c) => c.id)
  );

  const fetchCategories = async () => {
    setIsLoading(true);

    try {
      const data = await getAllCategories();
      const normalized = Array.isArray(data) ? data.map(normalizeCategory) : [];

      setCategories(normalized);
    } catch (error) {
      console.error("Fetch categories error:", error);
      toast.error(error?.message || "Cannot load categories");

      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id) => {
    if (!id) return;

    if (!confirm(t.confirmDelete || "Delete this category?")) return;

    try {
      await deleteCategory(id);

      setCategories((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "INACTIVE",
                lastUpdated: new Date().toISOString(),
              }
            : c
        )
      );

      toast.success("Category deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.message || "Delete failed");
    }
  };

  const handleViewProducts = (category) => {
    setProducts(Array.isArray(category?.products) ? category.products : []);
    setIsProductModalOpen(true);
    setOpenMenuId(null);
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

  const stats = useMemo(
    () => ({
      total: categories.length,
      active: categories.filter((c) => c.status === "ACTIVE").length,
      inactive: categories.filter((c) => c.status !== "ACTIVE").length,
      totalProducts: categories.reduce(
        (acc, c) => acc + (c.productCount || 0),
        0
      ),
    }),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();

    const result = categories.filter((c) => {
      const matchesSearch =
        !keyword ||
        c.name?.toLowerCase().includes(keyword) ||
        c.slug?.toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "All" || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "lastUpdated") {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [categories, searchTerm, statusFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / sizePage));

  const paginatedCategories = filteredCategories.slice(
    (page - 1) * sizePage,
    page * sizePage
  );

  return (
    <div className="space-y-6 pb-10 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {openMenuId && (
        <div
          className="fixed inset-0 z-[40]"
          onClick={() => setOpenMenuId(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {t.title || "Category Management"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {t.subtitle || "Organize products into logical groups for the menu"}
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCategory(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#d9a13b] hover:bg-[#c48f32] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-yellow-900/10 active:scale-95"
        >
          <Plus size={18} />
          {t.newCategory || "New Category"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={Layers}
          label={t.stats?.total || "Total Categories"}
          value={stats.total}
          subtext={t.stats?.departments || "System departments"}
          color="text-blue-600"
          bg="bg-blue-50"
        />

        <StatCard
          icon={CheckCircle2}
          label={t.stats?.active || "Active"}
          value={stats.active}
          subtext={t.stats?.onMenu || "Currently on menu"}
          color="text-green-600"
          bg="bg-green-50"
        />

        <StatCard
          icon={Coffee}
          label={t.stats?.liveProducts || "Live Products"}
          value={stats.totalProducts}
          subtext={t.stats?.totalAcross || "Total across categories"}
          color="text-purple-600"
          bg="bg-purple-50"
        />

        <StatCard
          icon={AlertCircle}
          label={t.stats?.inactive || "Inactive"}
          value={stats.inactive}
          subtext={t.stats?.hidden || "Hidden from customers"}
          color="text-orange-600"
          bg="bg-orange-50"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setPage(1);
              }}
              placeholder={t.searchPlaceholder || "Search categories..."}
            />
          </div>

          <div className="w-full lg:w-64">
            <SelectOption
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              placeholder={t.allStatus || "All Status"}
              icon={Activity}
              options={[
                { value: "ACTIVE", label: t.activeStatus || "Active" },
                { value: "INACTIVE", label: t.inactiveStatus || "Inactive" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="w-8 h-8 border-4 border-[#d9a13b] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <Table
          columns={tableColumns}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          isEmpty={!isLoading && paginatedCategories.length === 0}
          emptyMessage={t.table?.noData || "No categories found"}
        >
          {paginatedCategories.map((cat) => (
            <tr
              key={cat.id}
              className="group hover:bg-gray-50/80 transition-colors"
            >
              {visibleColumns.includes("info") && (
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center border border-gray-200 group-hover:bg-[#d9a13b]/10 group-hover:border-[#d9a13b]/30 group-hover:text-[#d9a13b] transition-colors">
                      <Tag size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        {cat.name}
                      </div>
                      <div
                        className="text-[11px] text-gray-500 mt-0.5 max-w-[200px] truncate"
                        title={cat.description}
                      >
                        {cat.description || "No description"}
                      </div>
                    </div>
                  </div>
                </td>
              )}

              {visibleColumns.includes("slug") && (
                <td className="px-6 py-5 text-xs font-mono text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded-md">
                    /{cat.slug}
                  </span>
                </td>
              )}

              {visibleColumns.includes("products") && (
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-700">
                      {cat.productCount}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">
                      items
                    </span>
                  </div>
                </td>
              )}

              {visibleColumns.includes("updated") && (
                <td className="px-6 py-5 text-xs font-medium text-gray-500">
                  {cat.lastUpdated
                    ? new Date(cat.lastUpdated).toLocaleDateString("vi-VN")
                    : "-"}
                </td>
              )}

              {visibleColumns.includes("status") && (
                <td className="px-6 py-5">
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      cat.status === "ACTIVE"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {cat.status}
                  </span>
                </td>
              )}

              {visibleColumns.includes("actions") && (
                <td className="px-6 py-5 text-right relative">
                  <div
                    className={`flex items-center justify-end gap-1 transition-opacity ${
                      openMenuId === cat.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-[#d9a13b] hover:bg-white rounded-lg border border-transparent shadow-none hover:shadow-sm transition-all"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-transparent transition-all"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === cat.id ? null : cat.id)
                      }
                      className="p-2 text-gray-400 hover:text-slate-600 relative rounded-lg border border-transparent hover:bg-white hover:shadow-sm transition-all"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuId === cat.id && (
                      <div className="absolute right-10 top-10 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-[50] flex flex-col text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => handleViewProducts(cat)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-slate-700 font-bold transition-colors"
                        >
                          {t.table?.viewProducts || "View Products List"}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </Table>

        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      </div>

      {isModalOpen && (
        <CategoryAddUpdateModal
          selectedCategory={selectedCategory}
          setIsModalOpen={setIsModalOpen}
          refreshCategories={fetchCategories}
        />
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              {t.modals?.productsTitle || "Products in Category"}
            </h2>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar -mx-2 px-2">
              {products.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                  <Coffee className="mx-auto text-gray-300 mb-3" size={32} />
                  <p className="text-gray-500 font-semibold text-sm">
                    {t.modals?.noProducts ||
                      "No products mapped to this category yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-100">
                          <Coffee size={14} className="text-gray-400" />
                        </div>
                        <span className="font-bold text-sm text-slate-800">
                          {getLocalizedField(p, "name", language) || p.name}
                        </span>
                      </div>
                      <span className="font-black text-sm text-[#d9a13b]">
                        {p.price
                          ? p.price.toLocaleString("vi-VN") + " đ"
                          : "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsProductModalOpen(false)}
              className="mt-6 w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
            >
              {t.modals?.close || "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;