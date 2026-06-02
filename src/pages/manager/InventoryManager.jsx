import React, { useState, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  History,
  MapPin,
  LayoutDashboard,
  Shirt,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import {
  getStocks,
  getTransactions,
  extractData,
  extractPageMeta,
} from "@/services/inventoryService";
import { getAllFranchises } from "@/services/franchiseService";
import PaginationControls from "@/components/ui/PaginationControls";

const MAIN_WAREHOUSE_ID = "00000000-0000-0000-0000-000000000000";

const LoadingSpinner = ({ t }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="size-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full shadow-lg shadow-blue-600/10"
    />
    <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">
      {t.alerts?.loading || "Loading data..."}
    </p>
  </div>
);

const buildStockName = (stock, fallback = "Sản phẩm") => {
  const baseName =
    stock.productName ||
    `${fallback} ${String(stock.productVariantId || "")
      .substring(0, 6)
      .toUpperCase()}`;

  const variantParts = [
    stock.variantName,
    stock.packageSize && stock.packageUnit
      ? `${stock.packageSize} ${stock.packageUnit}`
      : null,
    stock.size && stock.size !== "N/A" ? stock.size : null,
    stock.color && stock.color !== "N/A" ? stock.color : null,
  ].filter(Boolean);

  return variantParts.length > 0
    ? `${baseName} - ${variantParts.join(" - ")}`
    : baseName;
};

const InventoryOverview = ({
  t,
  stocks = [],
  franchises = [],
  locationFilter,
  setLocationFilter,
  showLowStockOnly,
  setShowLowStockOnly,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [locationFilter, searchTerm, showLowStockOnly]);

  const filteredStocks = stocks.filter((stock) => {
    const available = Number(stock.actual || 0) - Number(stock.reserved || 0);

    const matchesLocation =
      locationFilter === "ALL" || String(stock.locationId) === locationFilter;

    const keyword = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !keyword ||
      (stock.productName || "").toLowerCase().includes(keyword) ||
      (stock.sku || "").toLowerCase().includes(keyword) ||
      String(stock.productVariantId || "").toLowerCase().includes(keyword);

    const matchesLowStock = !showLowStockOnly || available <= stock.minStock;

    return matchesLocation && matchesSearch && matchesLowStock;
  });

  const totalPages = Math.max(1, Math.ceil(filteredStocks.length / 10));

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder={t.overview?.searchPlaceholder || "Tìm sản phẩm..."}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${
              showLowStockOnly
                ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle size={14} />
            {showLowStockOnly ? "Đang lọc sắp hết hàng" : "Lọc sắp hết hàng"}
          </button>

          <select
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-gray-600 focus:outline-none min-w-[200px]"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="ALL">Tất cả địa điểm</option>
            <option value={MAIN_WAREHOUSE_ID}>Kho tổng</option>
            {franchises.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                  Địa điểm
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">
                  Tồn kho
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">
                  Đã giữ
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">
                  Có thể bán/xuất
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">
                  Trạng thái
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filteredStocks
                .slice((currentPage - 1) * 10, currentPage * 10)
                .map((stock) => {
                  const actual = Number(stock.actual || 0);
                  const reserved = Number(stock.reserved || 0);
                  const available = actual - reserved;

                  // Quan trọng: trạng thái dựa trên số có thể bán/xuất
                  const isLow = available <= stock.minStock;

                  return (
                    <tr
                      key={stock.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-gray-50 flex items-center justify-center text-blue-500 border border-gray-100 group-hover:text-blue-600 transition-colors">
                            <Shirt size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {stock.productName}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono tracking-tight uppercase">
                              SKU: {stock.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase">
                          <MapPin size={12} className="text-slate-300" />
                          {stock.locationType === "WAREHOUSE"
                            ? "Kho tổng"
                            : franchises.find(
                                (f) =>
                                  String(f.id) === String(stock.locationId)
                              )?.name || "Chi nhánh"}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center font-black text-slate-900">
                        {actual}
                      </td>

                      <td className="px-6 py-5 text-center font-bold text-gray-400 italic">
                        {reserved}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <span
                          className={`text-sm font-black ${
                            isLow ? "text-red-500" : "text-blue-600"
                          }`}
                        >
                          {available}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                            isLow
                              ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                              : "bg-green-50 text-green-600 border-green-100"
                          }`}
                        >
                          {isLow ? "Sắp hết hàng" : "An toàn"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

              {filteredStocks.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-10 text-gray-400 font-bold text-sm"
                  >
                    Không có dữ liệu tồn kho
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        setPage={setCurrentPage}
      />
    </div>
  );
};

const TransactionLog = ({ t, language, franchises = [] }) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async () => {
    setIsLoading(true);

    try {
      const fromISO = fromDate ? `${fromDate}T00:00:00Z` : null;
      const toISO = toDate ? `${toDate}T23:59:59Z` : null;

      const res = await getTransactions(null, fromISO, toISO, currentPage, 10);
      const page = extractPageMeta(res);

      setTransactions(page.content);
      setTotalPages(page.totalPages || 1);
    } catch (error) {
      console.error("Fetch transactions error:", error);
      setTransactions([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, [fromDate, toDate, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-3 text-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-50 border text-slate-500 shadow-sm">
            <Calendar size={20} />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 leading-tight">
              Nhật ký giao dịch kho
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
              Lọc theo khoảng ngày
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center w-full md:max-w-xl">
          <div className="relative flex-1 w-full">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                if (toDate && e.target.value > toDate) {
                  setToDate(e.target.value);
                }
              }}
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-slate-700"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black pointer-events-none bg-white px-1.5 py-0.5 rounded border shadow-sm">
              Từ ngày
            </div>
          </div>

          <span className="text-gray-300 font-black hidden sm:block">→</span>

          <div className="relative flex-1 w-full">
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-slate-700"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black pointer-events-none bg-white px-1.5 py-0.5 rounded border shadow-sm">
              Đến ngày
            </div>
          </div>
        </div>

        {(fromDate || toDate) && (
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="p-2.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition-all border flex items-center justify-center shadow-sm"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative min-h-[400px]">
        {isLoading ? (
          <LoadingSpinner t={t} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Địa điểm
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-center">
                    Thay đổi
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-center">
                    Trước / Sau
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-right">
                    Loại giao dịch
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase">
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleString(
                            language === "vi" ? "vi-VN" : "en-US"
                          )
                        : "N/A"}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 uppercase">
                        <MapPin size={12} className="text-slate-300" />
                        {tx.locationId === MAIN_WAREHOUSE_ID || !tx.locationId
                          ? "Kho tổng"
                          : franchises.find(
                              (f) => String(f.id) === String(tx.locationId)
                            )?.name || "Chi nhánh"}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 text-sm">
                        {tx.productName || "N/A"}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                        {tx.size && `Quy cách: ${tx.size}`}{" "}
                        {tx.color &&
                          tx.color !== "N/A" &&
                          `| Màu: ${tx.color}`}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-black px-2 py-1 rounded-lg text-xs ${
                          (tx.changeQuantity || 0) > 0
                            ? "text-green-600 bg-green-50"
                            : "text-red-600 bg-red-50"
                        }`}
                      >
                        {(tx.changeQuantity || 0) > 0 ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowDownLeft size={14} />
                        )}
                        {tx.changeQuantity}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs font-bold text-gray-400">
                          {tx.beforeQuantity ?? 0}
                        </span>
                        <span className="text-slate-300">→</span>
                        <span className="text-xs font-black text-slate-900">
                          {tx.afterQuantity ?? 0}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right font-mono text-gray-400 text-xs uppercase">
                      {tx.type}
                    </td>
                  </tr>
                ))}

                {transactions.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-10 text-gray-400 font-bold text-sm"
                    >
                      Không có giao dịch kho
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        setPage={setCurrentPage}
      />
    </div>
  );
};

const InventoryManager = () => {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).admin?.inventoryManagement || {};

  const [activeTab, setActiveTab] = useState("overview");
  const [stocks, setStocks] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const fetchStocks = async (locationId = null) => {
    setIsLoading(true);

    try {
      const res = await getStocks(locationId, false, 1, 100);
      const page = extractPageMeta(res);

      const mapped = page.content.map((stock) => ({
        id:
          stock.id ||
          `${stock.productVariantId}-${stock.locationId || "system"}`,
        productVariantId: stock.productVariantId,
        productName: buildStockName(
          stock,
          t.requests?.productDefault || "Sản phẩm"
        ),
        locationId: stock.locationId,
        locationType: stock.locationType,
        actual: Number(stock.quantity || 0),
        reserved: Number(stock.reservedQuantity || 0),
        minStock: Number(stock.minStock || 10),
        sku:
          stock.sku ||
          `SKU-${String(stock.productVariantId || "")
            .substring(0, 6)
            .toUpperCase()}`,
      }));

      setStocks(mapped);
    } catch (error) {
      console.error("Fetch stocks error:", error);
      setStocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFranchises = async () => {
    try {
      const res = await getAllFranchises();
      const data = extractData(res);
      const list = Array.isArray(data) ? data : [];

      setFranchises(list);
    } catch (error) {
      console.error("Fetch franchises error:", error);
      setFranchises([]);
    }
  };

  React.useEffect(() => {
    fetchFranchises();
  }, []);

  React.useEffect(() => {
    const fetchLocationId = locationFilter === "ALL" ? null : locationFilter;
    fetchStocks(fetchLocationId);
  }, [locationFilter]);

  const lowStockCount = useMemo(
    () =>
      stocks.filter((stock) => {
        const available =
          Number(stock.actual || 0) - Number(stock.reserved || 0);
        return available <= stock.minStock;
      }).length,
    [stocks]
  );

  const tabs = [
    {
      id: "overview",
      label: "Tổng quan tồn kho",
      icon: LayoutDashboard,
    },
    {
      id: "tx",
      label: "Nhật ký giao dịch",
      icon: History,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Quản lý kho</h2>
          <p className="text-gray-500 text-sm">
            Theo dõi tồn kho, hàng đã giữ và số lượng còn có thể bán hoặc xuất
          </p>
        </div>
      </div>

      {lowStockCount > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-gradient-to-r from-red-50 via-rose-50/30 to-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 animate-bounce">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-black text-red-900 text-sm">
                  Cảnh báo sắp hết hàng
                </h4>
                <p className="text-red-700/70 text-[11px] font-bold">
                  Có {lowStockCount} mặt hàng có số lượng có thể bán/xuất thấp
                  hơn mức tối thiểu.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab("overview");
                setShowLowStockOnly(true);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase"
            >
              Xem ngay
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          {isLoading && <LoadingSpinner t={t} />}

          {!isLoading && activeTab === "overview" && (
            <InventoryOverview
              t={t}
              stocks={stocks}
              franchises={franchises}
              locationFilter={locationFilter}
              setLocationFilter={setLocationFilter}
              showLowStockOnly={showLowStockOnly}
              setShowLowStockOnly={setShowLowStockOnly}
            />
          )}

          {activeTab === "tx" && (
            <TransactionLog
              t={t}
              language={language}
              franchises={franchises}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InventoryManager;