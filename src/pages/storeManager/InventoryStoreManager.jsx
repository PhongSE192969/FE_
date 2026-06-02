import React, { useState } from "react";
import {
  Search,
  AlertTriangle,
  History,
  ClipboardList,
  Truck,
  LayoutDashboard,
  Shirt,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Clock,
  Calendar,
  X,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguageStore, useAuthStore } from "@/stores";
import { translations } from "@/locales";
import ENV from "@/config/env";
import { Client } from "@stomp/stompjs";
import {
  getStocks,
  getTransactions,
  getTransfers,
  createTransfer,
  createStockRequest,
  getStockRequests,
  shipStockTransfer,
  receiveStockTransfer,
  receiveStockRequest,
  rejectTransfer,
} from "@/services/inventoryService";
import { getFranchises } from "@/services/franchiseService";
import ProductCatalogModal from "@/components/modal/ProductCatalogModal";
import PaginationControls from "@/components/ui/PaginationControls";
import toast from "react-hot-toast";

const MAIN_WAREHOUSE_ID = "00000000-0000-0000-0000-000000000000";

const extractData = (res) => {
  return res?.data?.data || res?.data || res;
};

const extractPage = (res) => {
  const data = extractData(res);

  return {
    content: Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data)
        ? data
        : [],
    totalPages: data?.totalPages || 1,
    totalElements: data?.totalElements || 0,
    pageNo: data?.pageNo || 0,
    pageSize: data?.pageSize || 10,
  };
};

const buildStockProductName = (stock) => {
  const baseName =
    stock.productName ||
    `Sản phẩm ${String(stock.productVariantId || "")
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

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, t }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8 text-center">
            <div className="size-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              {title || t?.confirmTitle || "Xác nhận"}
            </h3>

            <p className="text-slate-500 font-medium leading-relaxed">
              {message ||
                t?.confirmMessage ||
                "Bạn có chắc chắn muốn thực hiện hành động này?"}
            </p>
          </div>

          <div className="flex p-4 gap-3 bg-slate-50">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white transition-all active:scale-95"
            >
              {t?.cancel || "Hủy bỏ"}
            </button>

            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 rounded-xl font-black bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95"
            >
              {t?.confirm || "Xác nhận"}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const InventoryOverview = ({
  t,
  stocks = [],
  franchiseId,
  searchTerm,
  setSearchTerm,
  showLowStockOnly,
  setShowLowStockOnly,
}) => {
  const [locationFilter, setLocationFilter] = useState(franchiseId || "ALL");
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [locationFilter, searchTerm, showLowStockOnly]);

  React.useEffect(() => {
    setLocationFilter(franchiseId || "ALL");
  }, [franchiseId]);

  const filteredStocks = stocks.filter((stock) => {
    const matchesLocation =
      locationFilter === "ALL" ||
      (locationFilter === "SYSTEM" &&
        (stock.locationId === null ||
          stock.locationId === "SYSTEM" ||
          stock.locationId === MAIN_WAREHOUSE_ID)) ||
      String(stock.locationId) === String(locationFilter);

    const keyword = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !keyword ||
      (stock.productName || "").toLowerCase().includes(keyword) ||
      (stock.sku || "").toLowerCase().includes(keyword) ||
      String(stock.productVariantId || "").toLowerCase().includes(keyword);

    const actual = Number(stock.actual || 0);
    const reserved = Number(stock.reserved || 0);
    const available = actual - reserved;

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
            placeholder={
              t.overview?.searchPlaceholder ||
              t.searchPlaceholder ||
              "Tìm kiếm sản phẩm..."
            }
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
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
            {showLowStockOnly
              ? t.overview?.filterLowStockActive || "Đang lọc hàng thấp"
              : t.overview?.filterLowStock || "Lọc hàng sắp hết"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                  {t.table?.product || "Sản phẩm"}
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
                  {t.table?.status || "Trạng thái"}
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
                          <div className="size-10 rounded-lg bg-gray-50 flex items-center justify-center text-slate-400 border border-gray-100 group-hover:text-blue-500 transition-colors">
                            <Shirt size={20} />
                          </div>

                          <div>
                            <div className="font-bold text-slate-900">
                              {stock.productName}
                            </div>

                            <div className="text-[10px] text-gray-400 font-mono tracking-tight uppercase">
                              SKU: {stock.sku}
                            </div>

                            <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                              {stock.locationType === "WAREHOUSE"
                                ? t.overview?.mainWarehouseShort || "Kho Tổng"
                                : stock.locationName || "Chi nhánh"}
                            </div>
                          </div>
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
                            available <= stock.minStock
                              ? "text-red-500"
                              : "text-blue-600"
                          }`}
                        >
                          {available}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                              isLow
                                ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                                : "bg-green-50 text-green-600 border-green-100"
                            }`}
                          >
                            {isLow
                              ? t.overview?.statusLow || "Sắp hết hàng"
                              : t.overview?.statusSafe || "An toàn"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {filteredStocks.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-gray-400 font-bold text-sm"
                  >
                    {t.overview?.empty || "Không có dữ liệu tồn kho"}
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
  requests = [],
  onReceive,
  onShip,
  onReject,
  currentFranchiseId,
  stocks = [],
  getLocName,
}) => {
  const getStockForVariant = (variantId) => {
    const stock = stocks.find(
      (item) => String(item.productVariantId) === String(variantId)
    );

    if (!stock) return 0;

    return Number(stock.actual || 0) - Number(stock.reserved || 0);
  };

  const hasInsufficientStock = (req) => {
    return req.items?.some(
      (item) => getStockForVariant(item.productVariantId) < item.quantity
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <h3 className="font-black text-slate-900 uppercase tracking-tighter">
          {t.requests?.title || "Danh sách yêu cầu nhập hàng"}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase w-32">
                {t.requests?.code || "Mã yêu cầu"}
              </th>

              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase w-44">
                {t.requests?.route || t.requests?.unit || "Đơn vị yêu cầu"}
              </th>

              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                {t.requests?.details || "Chi tiết"}
              </th>

              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase w-40">
                {t.requests?.notes || "Ghi chú"}
              </th>

              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-right">
                {t.table?.status || "Trạng thái"}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {requests.map((req) => {
              const isTransfer = Boolean(req.transferCode);
              const isOutgoing =
                isTransfer &&
                String(req.fromLocationId) === String(currentFranchiseId);
              const isIncoming = !isOutgoing;

              const autoDisable =
                isOutgoing &&
                (req.status === "PENDING" || req.status === "APPROVED") &&
                hasInsufficientStock(req);

              return (
                <tr
                  key={`${req.transferCode ? "trn" : "req"}-${req.id}`}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="font-mono font-bold text-slate-900">
                      {req.requestCode || req.transferCode}
                    </div>

                    <div className="text-[10px] text-gray-400 mt-1 uppercase flex items-center gap-1">
                      <Clock size={10} />
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleString("vi-VN")
                        : "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    {isTransfer ? (
                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-black uppercase text-gray-400">
                          {isOutgoing ? "Gửi đến:" : "Nhận từ:"}
                        </div>

                        <div className="font-bold text-slate-700">
                          {isOutgoing
                            ? getLocName(req.toLocationId)
                            : getLocName(req.fromLocationId)}
                        </div>
                      </div>
                    ) : (
                      <div className="font-bold text-slate-700">
                        {t.requests?.myBranch || "Chi nhánh của tôi"}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    {req.items?.map((item, index) => {
                      const sourceStock = getStockForVariant(item.productVariantId);
                      const isLow = isOutgoing && sourceStock < item.quantity;

                      const itemName =
                        item.productName ||
                        item.productVariantName ||
                        `Sản phẩm ${String(item.productVariantId || "")
                          .substring(0, 6)
                          .toUpperCase()}`;

                      const variantText = [item.color, item.size]
                        .filter((value) => value && value !== "N/A")
                        .join(" - ");

                      return (
                        <div
                          key={`${item.productVariantId}-${index}`}
                          className="text-xs font-bold text-gray-500 mb-1 last:mb-0"
                        >
                          <div>
                            {itemName}
                            {variantText ? ` - ${variantText}` : ""} x{" "}
                            <span className="text-slate-900">
                              {item.quantity}
                            </span>
                          </div>

                          {isOutgoing &&
                            (req.status === "PENDING" ||
                              req.status === "APPROVED") && (
                              <div
                                className={`text-[10px] mt-0.5 px-1.5 py-0.5 rounded-sm inline-block ${
                                  isLow
                                    ? "bg-red-50 text-red-500 font-bold"
                                    : "bg-gray-50 text-gray-400"
                                }`}
                              >
                                {(t.requests?.warehouseInfo ||
                                  "Kho xuất còn: {qty}").replace(
                                  "{qty}",
                                  sourceStock
                                )}
                              </div>
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
                      {isOutgoing &&
                      (req.status === "PENDING" ||
                        req.status === "APPROVED") ? (
                        <>
                          <button
                            onClick={() => onShip?.(req.id)}
                            disabled={autoDisable}
                            className={`px-2.5 py-1.5 text-white text-[10px] font-black uppercase rounded-lg shadow-sm active:scale-95 transition-colors ${
                              autoDisable
                                ? "bg-gray-300 cursor-not-allowed opacity-50"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                            title={
                              autoDisable
                                ? t.requests?.insufficientStock ||
                                  "Không đủ hàng trong kho để giao"
                                : ""
                            }
                          >
                            {t.transfers?.confirmShip || "Giao hàng"}
                          </button>

                          <button
                            onClick={() => onReject?.(req.id)}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-lg"
                          >
                            {t.requests?.reject || "Từ chối"}
                          </button>
                        </>
                      ) : req.status === "SHIPPED" ||
                        (req.status === "IN_TRANSIT" && isIncoming) ? (
                        <button
                          onClick={() => onReceive?.(req)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-lg shadow-sm active:scale-95"
                        >
                          {t.requests?.confirmReceipt || "Nhận hàng"}
                        </button>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase whitespace-nowrap ${
                            req.status === "PENDING"
                              ? "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
                              : req.status === "APPROVED" ||
                                  req.status === "IN_TRANSIT"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : req.status === "SHIPPED"
                                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                                  : req.status === "RECEIVED" ||
                                      req.status === "COMPLETED"
                                    ? "bg-green-50 text-green-600 border border-green-100"
                                    : req.status === "REJECTED" ||
                                        req.status === "CANCELLED"
                                      ? "bg-red-50 text-red-600 border border-red-100"
                                      : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {t.status?.[req.status?.toLowerCase?.()] ||
                            req.status}
                        </span>
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
                  {t.requests?.empty || "Không có yêu cầu nhập hàng nào"}
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
  transfers = [],
  currentPage = 1,
  totalPages = 1,
  setPage,
  getLocName,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase w-32">
                  {t.transfers?.code || "Lệnh điều chuyển"}
                </th>

                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                  {t.transfers?.route || "Lộ trình"}
                </th>

                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-center w-32">
                  {t.table?.status || "Trạng thái"}
                </th>

                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-right w-32">
                  {t.transfers?.details || "Chi tiết"}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {transfers.map((transfer) => (
                <tr
                  key={transfer.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-900 tracking-tight">
                      {transfer.transferCode}
                    </div>

                    <div className="text-[10px] text-gray-400 mt-1 uppercase flex items-center gap-1 font-bold">
                      <Clock size={10} className="text-gray-300" />
                      {transfer.createdAt
                        ? `${new Date(transfer.createdAt).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            }
                          )} ${new Date(
                            transfer.createdAt
                          ).toLocaleDateString("vi-VN")}`
                        : "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-black text-slate-800">
                        {getLocName(transfer.fromLocationId)}
                      </span>

                      <ArrowRight size={14} className="text-gray-300" />

                      <span className="font-black text-slate-800">
                        {getLocName(transfer.toLocationId)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block whitespace-nowrap ${
                        transfer.status === "PENDING"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : transfer.status === "APPROVED" ||
                              transfer.status === "IN_TRANSIT" ||
                              transfer.status === "SHIPPED"
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : transfer.status === "COMPLETED" ||
                                transfer.status === "RECEIVED"
                              ? "bg-green-50 text-green-600 border border-green-100"
                              : transfer.status === "REJECTED" ||
                                  transfer.status === "CANCELLED"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-gray-50 text-gray-500 border border-gray-100"
                      }`}
                    >
                      {t.status?.[transfer.status?.toLowerCase?.()] ||
                        transfer.status}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-right font-bold text-slate-400 text-xs">
                    {transfer.items?.length || 0}{" "}
                    {t.requests?.itemsCount || "món"}
                  </td>
                </tr>
              ))}

              {transfers.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-10 text-gray-400 font-bold text-sm"
                  >
                    {t.transfers?.empty || "Không có lệnh điều chuyển nào"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          setPage={setPage}
        />
      )}
    </div>
  );
};

const TransactionLog = ({ t, franchiseId }) => {
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

      const res = await getTransactions(
        franchiseId,
        fromISO,
        toISO,
        currentPage - 1,
        10
      );

      const dataPage = extractPage(res);

      const uniqueTx = dataPage.content.filter(
        (item, index, self) =>
          index === self.findIndex((tx) => tx.id === item.id)
      );

      setTransactions(uniqueTx);
      setTotalPages(dataPage.totalPages || 1);
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
              {t.logs?.title || "Lịch sử giao dịch"}
            </h4>

            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              {t.logs?.subtitle || "Lọc khoảng ngày phát sinh"}
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
              {t.logs?.from || "Từ"}
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
              {t.logs?.to || "Đến"}
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
            title={t.logs?.clearFilter || "Xóa lọc"}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
        {isLoading ? (
          <LoadingSpinner t={t} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    {t.logs?.time || "Thời gian"}
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    {t.logs?.product || "Sản phẩm"}
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-center">
                    {t.logs?.change || "Biến động"}
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-center">
                    {t.logs?.balance || "Số dư (Trước/Sau)"}
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-right">
                    {t.logs?.type || "Phân loại"}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => {
                  const variantText = [tx.color, tx.size]
                    .filter((value) => value && value !== "N/A")
                    .join(" | ");

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleString("vi-VN")
                          : "N/A"}
                      </td>

                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-800 text-sm">
                          {tx.productName || "N/A"}
                        </div>

                        {variantText && (
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            {variantText}
                          </div>
                        )}
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
                        {t.logs?.types?.[tx.type] || tx.type}
                      </td>
                    </tr>
                  );
                })}

                {transactions.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-10 text-gray-400 font-bold text-sm"
                    >
                      {t.logs?.empty || "Không tìm thấy giao dịch nào"}
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

const InventoryStoreManager = () => {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();

  const getEffectiveFranchiseId = () => {
    return user?.franchise?.id;
  };

  const fullT = translations[language] || translations.vi;
  const t = fullT.admin?.inventoryManagement || {};
  const catalogModalT = fullT.admin?.catalogModal || {};

  const [activeTab, setActiveTab] = useState("overview");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stocks, setStocks] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  const [transfers, setTransfers] = useState([]);
  const [transfersCurrentPage, setTransfersCurrentPage] = useState(1);
  const [transfersTotalPages, setTransfersTotalPages] = useState(1);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [requests, setRequests] = useState([]);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    title: "",
    message: "",
    onConfirm: null,
  });

  const pendingRequestsCount = React.useMemo(() => {
    const fId = getEffectiveFranchiseId();

    return requests.filter(
      (request) =>
        request.status === "PENDING" ||
        request.status === "APPROVED" ||
        ((request.status === "SHIPPED" ||
          request.status === "IN_TRANSIT") &&
          request.toLocationId === fId)
    ).length;
  }, [requests, user]);

  const lowStockCount = React.useMemo(
    () =>
      stocks.filter((stock) => {
        const available =
          Number(stock.actual || 0) - Number(stock.reserved || 0);
        return available <= stock.minStock;
      }).length,
    [stocks]
  );

  const fetchFranchises = async () => {
    try {
      const res = await getFranchises();
      const data = extractData(res);
      const list = Array.isArray(data) ? data : [];

      setFranchises(list);
    } catch (error) {
      console.error("Fetch franchises error:", error);
      setFranchises([]);
    }
  };

  const getLocName = (id) => {
    if (id === MAIN_WAREHOUSE_ID || !id) {
      return t.overview?.mainWarehouseShort || "Kho Tổng";
    }

    const franchise = franchises.find((item) => String(item.id) === String(id));
    return franchise ? franchise.name : t.overview?.branchDefault || "Chi nhánh";
  };

  const fetchStocks = async (silent = false) => {
    if (!silent) setIsLoading(true);

    try {
      const res = await getStocks(getEffectiveFranchiseId(), false, 1, 100);
      const dataPage = extractPage(res);

      const mapped = dataPage.content.map((stock) => ({
        id: stock.id || `${stock.productVariantId}-${stock.locationId || "system"}`,
        stockId: stock.id,
        productVariantId: stock.productVariantId,

        productName: buildStockProductName(stock),
        rawProductName: stock.productName || "",
        variantName: stock.variantName || "",
        packageSize: stock.packageSize || "",
        packageUnit: stock.packageUnit || "",

        locationId: stock.locationId,
        locationType: stock.locationType,
        locationName:
          stock.locationType === "WAREHOUSE"
            ? t.overview?.mainWarehouseShort || "Kho Tổng"
            : stock.locationName || "Chi nhánh",

        actual: Number(stock.quantity || 0),
        reserved: Number(stock.reservedQuantity || 0),
        minStock: Number(stock.minStock || 10),

        sku:
          stock.sku ||
          `SKU-${String(stock.productVariantId || "")
            .substring(0, 6)
            .toUpperCase()}`,

        createdAt: stock.createdAt,
        updatedAt: stock.updatedAt,
      }));

      setStocks(mapped);
    } catch (error) {
      console.error("Fetch stocks error:", error);
      setStocks([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const fetchRequests = async (silent = false) => {
    if (!silent) setIsLoadingRequests(true);

    fetchStocks(true);

    try {
      const currentFranchiseId = getEffectiveFranchiseId();

      const resReq = await getStockRequests(currentFranchiseId);
      const reqData = extractData(resReq);
      const listReq = Array.isArray(reqData) ? reqData : [];

      const resTrn = await getTransfers(0, 100, currentFranchiseId);
      const dataTrn = extractPage(resTrn);

      const interFranchiseTransfers = dataTrn.content.filter(
        (transfer) =>
          transfer.toLocationId &&
          transfer.toLocationId !== MAIN_WAREHOUSE_ID &&
          transfer.fromLocationId === currentFranchiseId &&
          ![
            "IN_TRANSIT",
            "SHIPPED",
            "COMPLETED",
            "RECEIVED",
            "REJECTED",
            "CANCELLED",
          ].includes(transfer.status)
      );

      const combined = [...listReq, ...interFranchiseTransfers].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      const uniqueList = combined.filter(
        (item, index, self) =>
          index === self.findIndex((target) => target.id === item.id)
      );

      setRequests(uniqueList);
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
      const res = await getTransfers(
        transfersCurrentPage,
        10,
        getEffectiveFranchiseId()
      );

      const dataPage = extractPage(res);

      setTransfers(dataPage.content);
      setTransfersTotalPages(dataPage.totalPages || 1);
    } catch (error) {
      console.error("Fetch transfers error:", error);
      setTransfers([]);
      setTransfersTotalPages(1);
    } finally {
      if (!silent) setIsLoadingTransfers(false);
    }
  };

  React.useEffect(() => {
    fetchFranchises();
    fetchStocks();

    const stompClient = new Client({
      brokerURL: `${ENV.BASE_URL.replace(
        /^http/,
        "ws"
      )}/api/inventory/ws-inventory`,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log("STOMP_DEBUG (StoreManager):", str);
      },
    });

    stompClient.onStompError = (frame) => {
      console.error(
        "STOMP Error (StoreManager):",
        frame.headers["message"],
        frame.body
      );
    };

    stompClient.onWebSocketError = (event) => {
      console.error("STOMP WebSocket Error (StoreManager):", event);
    };

    stompClient.onWebSocketClose = (event) => {
      console.warn("STOMP WebSocket Closed (StoreManager):", event);
    };

    stompClient.onConnect = (frame) => {
      console.log("STOMP Connected (StoreManager):", frame);

      const fId = getEffectiveFranchiseId();

      const processMessage = (message) => {
        try {
          const notif = JSON.parse(message.body);
          const payload = notif.payload || notif;

          const isRelevant =
            String(payload.franchiseId) === String(fId) ||
            String(payload.sourceLocationId) === String(fId) ||
            String(payload.fromLocationId) === String(fId) ||
            String(payload.toLocationId) === String(fId);

          const shouldRefresh = [
            "NEW_STOCK_REQUEST",
            "STOCK_REQUEST_APPROVED",
            "STOCK_REQUEST_SHIPPED",
            "STOCK_REQUEST_RECEIVED",
            "STOCK_REQUEST_REJECTED",
            "STOCK_REQUEST_REJECTED_BY_SOURCE",
            "NEW_STOCK_TRANSFER",
            "STOCK_TRANSFER_SHIPPED",
            "STOCK_TRANSFER_COMPLETED",
            "STOCK_TRANSFER_CANCELLED",
          ].includes(notif.type);

          if (isRelevant && shouldRefresh) {
            if (window.refreshTimer) clearTimeout(window.refreshTimer);

            window.refreshTimer = setTimeout(() => {
              fetchRequests(true);
              fetchTransfers(true);
              fetchStocks(true);
            }, 500);
          }
        } catch (error) {
          console.error("Socket parse error:", error);
        }
      };

      stompClient.subscribe("/topic/admin/notifications", processMessage);

      if (fId) {
        stompClient.subscribe(
          `/topic/franchise/${fId}/notifications`,
          processMessage
        );
      }
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  React.useEffect(() => {
    if (activeTab === "overview") {
      fetchStocks();
    }
  }, [activeTab]);

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

  const handleImportSubmit = async ({ items, notes }) => {
    const userId = user ? user.id : null;
    const franchiseId = getEffectiveFranchiseId();

    const payload = {
      franchiseId,
      notes: notes || "",
      createdBy: userId,
      items: items.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      })),
    };

    try {
      await createStockRequest(payload);
      setIsImportModalOpen(false);
      fetchRequests();
      fetchStocks(true);
      toast.success(t.alerts?.createdSuccess || "Tạo yêu cầu thành công");
    } catch (error) {
      console.error("Create request fail:", error);
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

      if (activeTab === "transfers") fetchTransfers();

      fetchStocks();
      toast.success(t.alerts?.transferCreated || "Tạo lệnh điều chuyển thành công");
    } catch (error) {
      console.error("Export fail:", error);
      throw error;
    }
  };

  const currentStocksForModal = React.useMemo(() => {
    return stocks.map((stock) => ({
      productVariantId: stock.productVariantId,
      quantity: Number(stock.actual || 0) - Number(stock.reserved || 0),
      minStock: stock.minStock,
    }));
  }, [stocks]);

  const lowStockInitialItems = React.useMemo(() => {
    return stocks
      .filter((stock) => {
        const available =
          Number(stock.actual || 0) - Number(stock.reserved || 0);
        return available <= stock.minStock;
      })
      .map((stock) => ({
        productVariantId: stock.productVariantId,
        name: stock.productName,
        quantity: 10,
      }));
  }, [stocks]);

  const tabs = [
    {
      id: "overview",
      label: t.tabs?.overview || "Tổng quan tồn kho",
      icon: LayoutDashboard,
    },
    {
      id: "requests",
      label: t.tabs?.requests || "Yêu cầu nhập hàng",
      icon: ClipboardList,
    },
    {
      id: "transfers",
      label: t.tabs?.transfers || "Lệnh điều chuyển",
      icon: Truck,
    },
    {
      id: "tx",
      label: t.tabs?.logs || "Nhật ký giao dịch",
      icon: History,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {t.title || "Quản lý Kho"}
          </h2>

          <p className="text-gray-500 text-sm">
            {t.subtitle || "Theo dõi tồn kho tại chi nhánh theo thời gian thực"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsImportModalOpen(true);
              fetchRequests(true);
              fetchStocks(true);
            }}
            className="flex items-center gap-2 bg-[#1e293b] hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            {t.actions?.createRequest || "Tạo yêu cầu nhập hàng"}
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${
          lowStockCount > 0 && pendingRequestsCount > 0 ? "md:grid-cols-2" : ""
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
                    {t.alerts?.lowStockTitle || "Cảnh báo: Hàng sắp hết!"}
                  </h4>

                  <p className="text-red-700/70 text-[11px] font-bold italic">
                    {(t.alerts?.lowStockDesc ||
                      "Phát hiện {count} mặt hàng đang ở mức báo động.").replace(
                      "{count}",
                      lowStockCount
                    )}
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
                {t.alerts?.viewNow || "Xem ngay"}
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
                    {t.alerts?.pendingRequestsTitle ||
                      "Hành động: Duyệt yêu cầu!"}
                  </h4>

                  <p className="text-amber-700/80 text-[11px] font-bold">
                    {(t.alerts?.pendingRequestsDesc ||
                      "Có {count} yêu cầu mới cần xử lý.").replace(
                      "{count}",
                      pendingRequestsCount
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("requests")}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                {t.alerts?.processNow || "Xử lý ngay"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}

            {tab.id === "requests" && pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center animate-pulse border-2 border-white">
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
              franchiseId={getEffectiveFranchiseId()}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
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
                requests={requests}
                currentFranchiseId={getEffectiveFranchiseId()}
                getLocName={getLocName}
                onReceive={async (req) => {
                  try {
                    if (req.transferCode) {
                      await receiveStockTransfer(req.id);
                    } else {
                      await receiveStockRequest(req.id);
                    }

                    fetchRequests(true);
                    fetchStocks(true);
                    toast.success(t.alerts?.receivedSuccess || "Đã nhận hàng");
                  } catch (error) {
                    console.error(error);
                    toast.error(error.message || "Nhận hàng thất bại");
                  }
                }}
                onShip={async (id) => {
                  try {
                    await shipStockTransfer(id);
                    fetchRequests(true);
                    fetchStocks(true);
                    toast.success(
                      t.alerts?.shippedSuccess || "Đã xác nhận giao hàng"
                    );
                  } catch (error) {
                    console.error(error);
                    toast.error(error.message || "Giao hàng thất bại");
                  }
                }}
                onReject={(id) => {
                  setConfirmModal({
                    isOpen: true,
                    id,
                    title: t.modals?.confirmRejectTitle || "Từ chối yêu cầu",
                    message:
                      t.modals?.confirmRejectMessage ||
                      "Bạn có chắc chắn muốn từ chối yêu cầu này? Hành động này không thể hoàn tác.",
                    onConfirm: async () => {
                      try {
                        await rejectTransfer(id);
                        fetchRequests(true);
                        setConfirmModal((prev) => ({
                          ...prev,
                          isOpen: false,
                        }));
                        toast.success(
                          t.alerts?.rejectedSuccess || "Đã từ chối yêu cầu"
                        );
                      } catch (error) {
                        console.error(error);
                        toast.error(error.message || "Từ chối thất bại");
                      }
                    },
                  });
                }}
                stocks={stocks}
              />
            ))}

          {activeTab === "transfers" &&
            (isLoadingTransfers ? (
              <LoadingSpinner t={t} />
            ) : (
              <TransferManagement
                t={t}
                transfers={transfers}
                currentPage={transfersCurrentPage}
                totalPages={transfersTotalPages}
                setPage={setTransfersCurrentPage}
                getLocName={getLocName}
              />
            ))}

          {activeTab === "tx" && (
            <TransactionLog
              t={t}
              franchiseId={getEffectiveFranchiseId()}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <ProductCatalogModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title={t.actions?.createRequest || "Tạo yêu cầu nhập hàng"}
        submitText={t.actions?.submitRequest || "Gửi yêu cầu"}
        onSubmit={handleImportSubmit}
        t={catalogModalT}
        currentStocks={currentStocksForModal}
        initialItems={lowStockInitialItems}
      />

      <ProductCatalogModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={t.modals?.transferTitle || "Xuất kho / Điều chuyển"}
        submitText={t.actions?.confirmExport || "Xác nhận xuất"}
        showLocationPicker={true}
        locations={franchises}
        onSubmit={handleExportSubmit}
        t={catalogModalT}
        currentStocks={currentStocksForModal}
      />

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        t={t.common}
      />
    </div>
  );
};

export default InventoryStoreManager;