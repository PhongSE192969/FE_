import React, { useState, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  History,
  MapPin,
  Shirt,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Plus,
  Clock,
  Calendar,
  X,
  LayoutGrid,
  Inbox,
  ArrowLeftRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Client } from "@stomp/stompjs";

import { useLanguageStore, useAuthStore } from "@/stores";
import { translations } from "@/locales";
import ENV from "@/config/env";
import ProductCatalogModal from "@/components/modal/ProductCatalogModal";
import PaginationControls from "@/components/ui/PaginationControls";

import {
  addInitialStock,
  getStocks,
  getTransactions,
  getTransfers,
  createTransfer,
  getStockRequests,
  approveStockRequest,
  rejectStockRequest,
  shipStockRequest,
  shipStockTransfer,
  receiveStockTransfer,
  rejectTransfer,
  extractData,
  extractPageMeta,
} from "@/services/inventoryService";

import { getAllFranchises } from "@/services/franchiseService";

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

const buildStockName = (stock, fallback = "Product") => {
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
    const actual = Number(stock.actual || 0);
    const reserved = Number(stock.reserved || 0);
    const available = actual - reserved;

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
            placeholder="Tìm sản phẩm..."
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

const RequestManagement = ({
  t,
  language,
  requests = [],
  franchises = [],
  onApprove,
  onReject,
  onShip,
}) => {
  const hasInsufficientStock = (req) => {
    return req.items?.some(
      (item) =>
        item.currentQuantity !== undefined &&
        Number(item.currentQuantity) < Number(item.quantity)
    );
  };

  const getLocName = (id) => {
    if (id === MAIN_WAREHOUSE_ID || !id) {
      return "Kho tổng";
    }

    const f = franchises.find((item) => String(item.id) === String(id));

    return f
      ? f.name
      : `${t.overview?.branchDefault || "Chi nhánh"} ${String(
          id || ""
        ).substring(0, 8)}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <h3 className="font-black text-slate-900 uppercase tracking-tighter">
          Danh sách yêu cầu nhập hàng
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase w-32">
                Mã yêu cầu
              </th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase w-44">
                Đơn vị yêu cầu
              </th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                Chi tiết
              </th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase w-40">
                Ghi chú
              </th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-right">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {requests.map((req) => {
              const isPending = req.status === "PENDING";

              return (
                <tr
                  key={req.id}
                  className={`transition-all border-b border-gray-50/50 ${
                    isPending
                      ? "bg-amber-50/20 border-l-4 border-l-amber-500 hover:bg-amber-50/40"
                      : "hover:bg-gray-50/50"
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className="font-mono font-bold text-slate-900">
                      {req.requestCode}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 uppercase flex items-center gap-1">
                      <Clock size={10} />
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleString(
                            language === "vi" ? "vi-VN" : "en-US"
                          )
                        : "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-5 font-bold text-slate-700">
                    {getLocName(req.franchiseId)}
                  </td>

                  <td className="px-6 py-5">
                    {req.items?.map((item, index) => {
                      const itemName =
                        item.productName ||
                        item.productVariantName ||
                        "Sản phẩm";

                      const variantText = [item.color, item.size]
                        .filter((value) => value && value !== "N/A")
                        .join(" - ");

                      return (
                        <div
                          key={`${item.productVariantId}-${index}`}
                          className="text-xs font-bold text-gray-500 flex items-center flex-wrap gap-1"
                        >
                          <span>
                            {itemName}
                            {variantText ? ` - ${variantText}` : ""}
                          </span>
                          x{" "}
                          <span className="text-slate-900">
                            {item.quantity}
                          </span>

                          {req.status === "APPROVED" &&
                            item.currentQuantity !== undefined && (
                              <span
                                className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  item.currentQuantity < item.quantity
                                    ? "bg-red-50 text-red-500 border border-red-100"
                                    : "bg-gray-50 text-gray-500"
                                }`}
                              >
                                Tồn kho nguồn: {item.currentQuantity}
                              </span>
                            )}
                        </div>
                      );
                    })}
                  </td>

                  <td className="px-6 py-5 text-sm text-gray-600">
                    {req.notes || "-"}
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {isPending ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onApprove?.(req)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-sm active:scale-95"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => onReject?.(req)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-lg transition-all active:scale-95"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {req.status === "APPROVED" && (
                            <div className="flex gap-1.5">
                              {!req.sourceLocationId ||
                              req.sourceLocationId === MAIN_WAREHOUSE_ID ? (
                                <>
                                  <button
                                    onClick={() => onShip?.(req)}
                                    disabled={hasInsufficientStock(req)}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all shadow-sm active:scale-95 ${
                                      hasInsufficientStock(req)
                                        ? "bg-amber-50 text-amber-600 cursor-not-allowed border border-amber-200 font-bold"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                    title={
                                      hasInsufficientStock(req)
                                        ? "Không đủ hàng tồn kho nguồn"
                                        : ""
                                    }
                                  >
                                    Xuất hàng
                                  </button>
                                  <button
                                    onClick={() => onReject?.(req)}
                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-lg transition-all active:scale-95"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 italic">
                                  Chờ chi nhánh nguồn xử lý
                                </span>
                              )}
                            </div>
                          )}

                          {req.status !== "APPROVED" && (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase inline-flex items-center gap-1.5 ${
                                req.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                                  : req.status === "SHIPPED"
                                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                                  : req.status === "RECEIVED"
                                  ? "bg-green-50 text-green-600 border border-green-100"
                                  : req.status === "REJECTED"
                                  ? "bg-red-50 text-red-600 border border-red-100"
                                  : "bg-gray-50 text-gray-500"
                              }`}
                            >
                              {isPending && (
                                <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                              )}
                              {req.status}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {requests.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-10 text-gray-400 font-bold text-sm"
                >
                  Không có yêu cầu nhập hàng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TransferManagement = ({
  t,
  language,
  transfers = [],
  currentPage = 1,
  totalPages = 1,
  setPage,
  franchises = [],
  onShip,
  onReject,
  onReceive,
}) => {
  const getLocName = (id) => {
    if (id === MAIN_WAREHOUSE_ID || !id) {
      return "Kho tổng";
    }

    const f = franchises.find((item) => String(item.id) === String(id));

    return f ? f.name : "Chi nhánh";
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                  Mã điều chuyển
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                  Tuyến điều chuyển
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-center">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-right">
                  Chi tiết
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {transfers.map((trn) => (
                <tr
                  key={trn.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="font-mono font-bold text-slate-900">
                      {trn.transferCode}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 uppercase flex items-center gap-1">
                      <Clock size={10} />
                      {trn.createdAt
                        ? new Date(trn.createdAt).toLocaleString(
                            language === "vi" ? "vi-VN" : "en-US"
                          )
                        : "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-slate-800">
                        {getLocName(trn.fromLocationId)}
                      </span>
                      <ArrowRight size={14} className="text-gray-300" />
                      <span className="font-bold text-slate-800">
                        {getLocName(trn.toLocationId)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                        trn.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                          : trn.status === "IN_TRANSIT"
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : trn.status === "COMPLETED"
                          ? "bg-green-50 text-green-600 border border-green-100"
                          : trn.status === "CANCELLED"
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {trn.status}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex gap-1.5 justify-end items-center">
                      {trn.status === "PENDING" &&
                        trn.fromLocationId === MAIN_WAREHOUSE_ID && (
                          <>
                            <button
                              onClick={() => onShip?.(trn)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-lg shadow-sm transition-all active:scale-95"
                            >
                              Xuất hàng
                            </button>
                            <button
                              onClick={() => onReject?.(trn)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-lg transition-all"
                            >
                              Từ chối
                            </button>
                          </>
                        )}

                      {trn.status === "IN_TRANSIT" &&
                        trn.toLocationId === MAIN_WAREHOUSE_ID && (
                          <button
                            onClick={() => onReceive?.(trn.id)}
                            className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase rounded-lg shadow-sm"
                          >
                            Nhận hàng
                          </button>
                        )}

                      <div className="text-xs font-bold text-gray-400">
                        {trn.items?.length || 0} mặt hàng
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {transfers.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-10 text-gray-400 font-bold text-sm"
                  >
                    Không có lệnh điều chuyển
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
        setPage={setPage}
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
          <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 text-slate-500 shadow-sm">
            <Calendar size={20} />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 leading-tight">
              Nhật ký giao dịch kho
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Lọc theo khoảng ngày
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center w-full md:max-w-xl">
          <div className="relative flex-1 w-full">
            <input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);

                if (toDate && event.target.value > toDate) {
                  setToDate(event.target.value);
                }
              }}
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer hover:bg-white"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-gray-400 pointer-events-none bg-white px-1.5 py-0.5 rounded-md border shadow-sm">
              Từ ngày
            </div>
          </div>

          <span className="text-gray-300 font-black hidden sm:block">→</span>

          <div className="relative flex-1 w-full">
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer hover:bg-white"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-gray-400 pointer-events-none bg-white px-1.5 py-0.5 rounded-md border shadow-sm">
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
            className="p-2.5 h-[42px] aspect-square rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-100 flex items-center justify-center shadow-sm"
            title="Xóa bộ lọc"
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
                    <td className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
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
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
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

const InventoryManagement = () => {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();

  const fullT = translations[language] || translations.vi;
  const t = fullT.admin?.inventoryManagement || {};
  const catalogModalT = fullT.admin?.catalogModal || {};

  const [activeTab, setActiveTab] = useState("overview");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [stocks, setStocks] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [requests, setRequests] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  const [locationFilter, setLocationFilter] = useState("ALL");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [transfersCurrentPage, setTransfersCurrentPage] = useState(1);
  const [transfersTotalPages, setTransfersTotalPages] = useState(1);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const locationFilterRef = React.useRef(locationFilter);

  React.useEffect(() => {
    locationFilterRef.current = locationFilter;
  }, [locationFilter]);

  const fetchRequests = async (silent = false) => {
    if (!silent) setIsLoadingRequests(true);

    try {
      const res = await getStockRequests();
      const data = extractData(res);
      const list = Array.isArray(data) ? data : [];

      setRequests(list);
    } catch (error) {
      console.error("Fetch requests error:", error);
      setRequests([]);
    } finally {
      if (!silent) setIsLoadingRequests(false);
    }
  };

  const fetchTransfers = async (silent = false) => {
    if (!silent) setIsLoadingTransfers(true);

    try {
      const res = await getTransfers(transfersCurrentPage, 10);
      const page = extractPageMeta(res);

      setTransfers(page.content);
      setTransfersTotalPages(page.totalPages || 1);
    } catch (error) {
      console.error("Fetch transfers error:", error);
      setTransfers([]);
      setTransfersTotalPages(1);
    } finally {
      if (!silent) setIsLoadingTransfers(false);
    }
  };

  const fetchStocks = async (locationId = null, silent = false) => {
    if (!silent) setIsLoading(true);

    try {
      const res = await getStocks(locationId, false, 1, 100);
      const page = extractPageMeta(res);

      const mapped = page.content.map((stock) => ({
        id:
          stock.id ||
          `${stock.productVariantId}-${stock.locationId || "system"}`,
        productVariantId: stock.productVariantId,
        productName: buildStockName(stock, "Sản phẩm"),
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
      if (!silent) setIsLoading(false);
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
    fetchRequests();
  }, []);

  React.useEffect(() => {
    if (activeTab === "overview") {
      const fetchLocationId = locationFilter === "ALL" ? null : locationFilter;
      fetchStocks(fetchLocationId);
    }
  }, [locationFilter, activeTab]);

  React.useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === "transfers") {
      fetchTransfers();
    }
  }, [activeTab, transfersCurrentPage]);

  React.useEffect(() => {
    const stompClient = new Client({
      brokerURL: `${ENV.BASE_URL.replace(
        /^http/,
        "ws"
      )}/api/inventory/ws-inventory`,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log("STOMP_DEBUG (Admin):", str);
      },
    });

    stompClient.onStompError = (frame) => {
      console.error("STOMP Error (Admin):", frame.headers.message, frame.body);
    };

    stompClient.onWebSocketError = (event) => {
      console.error("STOMP WebSocket Error (Admin):", event);
    };

    stompClient.onWebSocketClose = (event) => {
      console.warn("STOMP WebSocket Closed (Admin):", event);
    };

    stompClient.onConnect = () => {
      stompClient.subscribe("/topic/admin/notifications", (message) => {
        try {
          const notif = JSON.parse(message.body);

          if (notif.type === "NEW_STOCK_REQUEST" && notif.payload) {
            setRequests((prev) => {
              const newList = [notif.payload, ...prev];

              return newList.filter(
                (item, index, self) =>
                  index === self.findIndex((target) => target.id === item.id)
              );
            });
          }

          if (
            [
              "STOCK_REQUEST_APPROVED",
              "STOCK_REQUEST_SHIPPED",
              "STOCK_REQUEST_REJECTED",
              "STOCK_REQUEST_RECEIVED",
              "STOCK_REQUEST_REJECTED_BY_SOURCE",
              "NEW_STOCK_REQUEST",
            ].includes(notif.type)
          ) {
            if (window.adminRefreshTimer) {
              clearTimeout(window.adminRefreshTimer);
            }

            window.adminRefreshTimer = setTimeout(() => {
              fetchRequests(true);
              fetchTransfers(true);
            }, 500);
          }

          if (
            [
              "NEW_STOCK_TRANSFER",
              "STOCK_TRANSFER_SHIPPED",
              "STOCK_TRANSFER_COMPLETED",
              "STOCK_TRANSFER_CANCELLED",
            ].includes(notif.type)
          ) {
            if (window.adminRefreshTimer) {
              clearTimeout(window.adminRefreshTimer);
            }

            window.adminRefreshTimer = setTimeout(() => {
              fetchRequests(true);
              fetchTransfers(true);

              const currentLoc = locationFilterRef.current;
              fetchStocks(currentLoc === "ALL" ? null : currentLoc, true);
            }, 500);
          }
        } catch (error) {
          console.error("Admin socket parse error:", error);
        }
      });
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  const handleImportSubmit = async ({ items, notes }) => {
    const userId = user ? user.id : null;

    try {
      await Promise.all(
        items.map((item) =>
          addInitialStock({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            locationId: null,
            notes,
            createdBy: userId,
          })
        )
      );

      fetchStocks();
      fetchRequests(true);
    } catch (error) {
      console.error("Import fail:", error);
      throw error;
    }
  };

  const handleExportSubmit = async ({ items, notes, locationId }) => {
    const userId = user ? user.id : null;

    try {
      await createTransfer({
        fromLocationId: MAIN_WAREHOUSE_ID,
        toLocationId: locationId,
        type: "WAREHOUSE_TO_FRANCHISE",
        notes,
        createdBy: userId,
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
        })),
      });

      if (activeTab === "transfers") {
        fetchTransfers();
      }

      fetchStocks();
      fetchRequests(true);
    } catch (error) {
      console.error("Export fail:", error);
      throw error;
    }
  };

  const pendingRequestsCount = useMemo(
    () => requests.filter((request) => request.status === "PENDING").length,
    [requests]
  );

  const lowStockCount = useMemo(
    () =>
      stocks.filter((stock) => {
        const available =
          Number(stock.actual || 0) - Number(stock.reserved || 0);
        return available <= stock.minStock;
      }).length,
    [stocks]
  );

  const importInitialItems = useMemo(() => {
    return stocks
      .filter((stock) => {
        const available =
          Number(stock.actual || 0) - Number(stock.reserved || 0);

        return (
          available <= stock.minStock &&
          (!stock.locationId || stock.locationId === MAIN_WAREHOUSE_ID)
        );
      })
      .map((stock) => ({
        productVariantId: stock.productVariantId,
        name: stock.productName,
        quantity: 10,
      }));
  }, [stocks]);

  const tabs = [
    { id: "overview", label: "Tổng quan tồn kho", icon: LayoutGrid },
    { id: "requests", label: "Yêu cầu nhập hàng", icon: Inbox },
    {
      id: "transfers",
      label: "Điều chuyển kho",
      icon: ArrowLeftRight,
    },
    { id: "tx", label: "Nhật ký giao dịch", icon: History },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Quản lý kho</h2>
          <p className="text-gray-500 text-sm">
            Theo dõi tồn kho, hàng đã giữ và số lượng còn có thể bán hoặc xuất
            trên toàn hệ thống
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-[#1e293b] hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
          >
            <Plus size={18} />
            Nhập hàng vào kho tổng
          </button>
        </div>
      </div>

      {(lowStockCount > 0 || pendingRequestsCount > 0) && (
        <div
          className={`grid grid-cols-1 ${
            lowStockCount > 0 && pendingRequestsCount > 0
              ? "md:grid-cols-2"
              : ""
          } gap-4`}
        >
          <AnimatePresence>
            {lowStockCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
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
                    <p className="text-red-700/70 text-[11px] font-bold italic">
                      Có {lowStockCount} mặt hàng có số lượng có thể bán/xuất
                      thấp hơn mức tối thiểu.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab("overview");
                    setShowLowStockOnly(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  Xem ngay
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {pendingRequestsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="bg-gradient-to-r from-amber-50 via-orange-50/30 to-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 animate-bounce">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-amber-900 text-sm">
                      Có yêu cầu nhập hàng cần duyệt
                    </h4>
                    <p className="text-amber-700/80 text-[11px] font-bold">
                      Có {pendingRequestsCount} yêu cầu đang chờ xử lý.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("requests")}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Xử lý ngay
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}

            {tab.id === "requests" && pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-black text-[9px] size-4 rounded-full flex items-center justify-center animate-pulse shadow-sm shadow-amber-500/30 border border-white">
                {pendingRequestsCount}
              </span>
            )}
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

          {activeTab === "requests" &&
            (isLoadingRequests ? (
              <LoadingSpinner t={t} />
            ) : (
              <RequestManagement
                t={t}
                language={language}
                requests={requests}
                franchises={franchises}
                onApprove={(req) => {
                  setSelectedRequest(req);
                  setIsApproveOpen(true);
                }}
                onReject={(req) => {
                  setSelectedRequest(req);
                  setRejectReason("");
                  setIsRejectOpen(true);
                }}
                onShip={async (req) => {
                  try {
                    await shipStockRequest(req.id);
                    fetchRequests(true);
                    fetchTransfers(true);
                    fetchStocks(
                      locationFilter === "ALL" ? null : locationFilter,
                      true
                    );
                  } catch (error) {
                    console.error(error);
                    window.alert(
                      `Lỗi xuất hàng: ${
                        error.response?.data?.message || error.message
                      }`
                    );
                  }
                }}
              />
            ))}

          {activeTab === "transfers" &&
            (isLoadingTransfers ? (
              <LoadingSpinner t={t} />
            ) : (
              <TransferManagement
                t={t}
                language={language}
                transfers={transfers}
                currentPage={transfersCurrentPage}
                totalPages={transfersTotalPages}
                setPage={setTransfersCurrentPage}
                franchises={franchises}
                onShip={async (transfer) => {
                  try {
                    await shipStockTransfer(transfer.id);
                    fetchRequests(true);
                    fetchTransfers(true);
                    fetchStocks(
                      locationFilter === "ALL" ? null : locationFilter,
                      true
                    );
                  } catch (error) {
                    console.error(error);
                  }
                }}
                onReject={async (transfer) => {
                  if (window.confirm("Bạn chắc chắn muốn từ chối?")) {
                    try {
                      await rejectTransfer(transfer.id);
                      fetchRequests(true);
                      fetchTransfers(true);
                    } catch (error) {
                      console.error(error);
                    }
                  }
                }}
                onReceive={async (id) => {
                  try {
                    await receiveStockTransfer(id);
                    fetchRequests(true);
                    fetchTransfers(true);
                    fetchStocks(
                      locationFilter === "ALL" ? null : locationFilter,
                      true
                    );
                  } catch (error) {
                    console.error(error);
                  }
                }}
              />
            ))}

          {activeTab === "tx" && (
            <TransactionLog
              t={t}
              language={language}
              franchises={franchises}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <ProductCatalogModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập hàng vào kho tổng"
        submitText="Xác nhận nhập hàng"
        onSubmit={handleImportSubmit}
        t={catalogModalT}
        initialItems={importInitialItems}
      />

      <ProductCatalogModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Xuất / điều chuyển hàng"
        submitText="Xác nhận điều chuyển"
        showLocationPicker={true}
        locations={franchises}
        onSubmit={handleExportSubmit}
        t={catalogModalT}
      />

      <AnimatePresence>
        {isApproveOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-black text-xl text-slate-900 tracking-tight">
                  Duyệt yêu cầu nhập hàng
                </h3>
                <button
                  onClick={() => setIsApproveOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1 block">
                  Chọn nguồn cấp hàng
                </label>
                <select
                  id="sourceSelect"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                >
                  <option value={MAIN_WAREHOUSE_ID}>Kho tổng</option>
                  {franchises.map((franchise) => (
                    <option key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsApproveOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-slate-600 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    const sourceId =
                      document.getElementById("sourceSelect")?.value ||
                      MAIN_WAREHOUSE_ID;

                    try {
                      await approveStockRequest(
                        selectedRequest.id,
                        sourceId,
                        user?.id
                      );
                      setIsApproveOpen(false);
                      fetchRequests(true);
                      fetchTransfers(true);
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isRejectOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-black text-xl text-slate-900 tracking-tight">
                  Từ chối yêu cầu
                </h3>
                <button
                  onClick={() => setIsRejectOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1 block text-red-500">
                  Lý do từ chối
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Nhập lý do..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsRejectOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-slate-600 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    try {
                      await rejectStockRequest(selectedRequest.id, rejectReason);
                      setIsRejectOpen(false);
                      fetchRequests(true);
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-lg shadow-red-600/20 transition-all active:scale-95"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryManagement;