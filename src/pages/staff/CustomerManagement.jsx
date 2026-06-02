import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import customerService from "@/services/customerService";
import {
  Table,
  PaginationControls,
  SearchInput,
  SelectOption,
} from "@/components/ui";
import { Eye, Activity, Mail, Phone } from "lucide-react";
import toast from "react-hot-toast";

const CustomerManagement = () => {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).staff?.customerManagement || {};

  const [searchParams, setSearchParams] = useSearchParams();

  const queryKeyword = searchParams.get("keyword") || "";
  const queryStatus = searchParams.get("status") || "All";
  const queryPage = Number(searchParams.get("page") || "1");

  const [keyword, setKeyword] = useState(queryKeyword);
  const [status, setStatus] = useState(queryStatus);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(null);

  const size = 5;

  const tableColumns = useMemo(
    () => [
      { id: "index", label: "#", sortable: false },
      {
        id: "customer",
        label: t.table?.customerInfo || "Customer Info",
        sortable: false,
      },
      { id: "contact", label: t.table?.contact || "Contact", sortable: false },
      {
        id: "loyalty",
        label: t.table?.loyalty || "Loyalty Info",
        sortable: false,
      },
      { id: "status", label: t.table?.status || "Status", sortable: false },
      { id: "actions", label: t.table?.actions || "Actions", sortable: false },
    ],
    [t]
  );

  const [visibleColumns, setVisibleColumns] = useState(
    tableColumns.map((column) => column.id)
  );

  useEffect(() => {
    setVisibleColumns(tableColumns.map((column) => column.id));
  }, [tableColumns]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);

    try {
      const response = await customerService.searchCustomers({
        keyword: queryKeyword,
        status: queryStatus !== "All" ? queryStatus : null,
        page: Math.max(0, queryPage - 1),
        size,
        sortBy: "lastOrderAt",
        sortDir: "desc",
      });

      setCustomers(Array.isArray(response.items) ? response.items : []);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalItems || 0);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Không thể tải danh sách khách hàng");
      setCustomers([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [queryKeyword, queryStatus, queryPage]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = () => {
    setSearchParams({
      keyword: keyword.trim(),
      status,
      page: "1",
    });
  };

  const handleReset = () => {
    setKeyword("");
    setStatus("All");
    setSearchParams({
      keyword: "",
      status: "All",
      page: "1",
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({
      keyword: queryKeyword,
      status: queryStatus,
      page: String(newPage),
    });
  };

  const handleViewDetail = (customer) => {
    setCustomerDetail(customer);
    setDetailModalOpen(true);
  };

  const getTierBadge = (tier) => {
    const normalizedTier = tier?.toUpperCase?.() || "BRONZE";

    const styles = {
      BRONZE: "bg-orange-50 text-orange-600 border-orange-100",
      SILVER: "bg-slate-50 text-slate-600 border-slate-200",
      GOLD: "bg-yellow-50 text-yellow-600 border-yellow-200",
      PLATINUM: "bg-blue-50 text-blue-600 border-blue-100",
      DIAMOND: "bg-purple-50 text-purple-600 border-purple-100",
    };

    return (
      <span
        className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
          styles[normalizedTier] || styles.BRONZE
        }`}
      >
        {normalizedTier}
      </span>
    );
  };

  const getStatusBadge = (statusValue) => {
    const normalizedStatus = statusValue || "ACTIVE";
    const isActive = normalizedStatus === "ACTIVE";

    return (
      <span
        className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full w-fit ${
          isActive ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"
        }`}
      >
        <span
          className={`size-1.5 rounded-full ${
            isActive ? "bg-green-500" : "bg-red-500"
          }`}
        />
        {normalizedStatus}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-10 p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {t.title || "Customer Database"}
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            {t.subtitle || "Manage member profiles and loyalty program status."}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-bold text-gray-700">
            {t.totalCustomers
              ? t.totalCustomers.replace("{count}", totalElements)
              : `${totalElements} Total Customers`}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={keyword}
              onChange={setKeyword}
              placeholder={
                t.search?.placeholder || "Enter name, email or phone number..."
              }
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Search
            </button>

            <SelectOption
              value={status}
              onChange={(value) => {
                setStatus(value);
                setSearchParams({
                  keyword,
                  status: value,
                  page: "1",
                });
              }}
              placeholder={t.search?.allStatus || "All Statuses"}
              icon={Activity}
              options={[
                { value: "All", label: "All" },
                { value: "ACTIVE", label: "ACTIVE" },
                { value: "INACTIVE", label: "INACTIVE" },
                { value: "SUSPENDED", label: "SUSPENDED" },
              ]}
            />

            <button
              onClick={handleReset}
              className="px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg hover:bg-red-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Table
          columns={tableColumns}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          isLoading={loading}
          isEmpty={!loading && customers.length === 0}
          emptyMessage={
            t.table?.empty || "No customers matched your search criteria."
          }
        >
          {customers.map((customer, index) => {
            const fullName = customer.fullName || "Unknown";
            const rowKey = customer.userId || customer.id || index;

            return (
              <tr
                key={rowKey}
                className="group hover:bg-gray-50/80 transition-colors"
              >
                {visibleColumns.includes("index") && (
                  <td className="px-6 py-5 text-sm font-bold text-gray-400">
                    {(queryPage - 1) * size + index + 1}
                  </td>
                )}

                {visibleColumns.includes("customer") && (
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {customer.avatarUrl ? (
                        <img
                          src={customer.avatarUrl}
                          alt={fullName}
                          className="size-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500">
                          {fullName.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}

                      <div>
                        <div className="font-bold text-slate-900 leading-none">
                          {fullName}
                        </div>

                        <div className="text-[10px] text-gray-400 font-mono mt-1">
                          @{customer.username || "unknown"}
                        </div>
                      </div>
                    </div>
                  </td>
                )}

                {visibleColumns.includes("contact") && (
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                        <Phone size={12} className="text-gray-300" />
                        {customer.phone || "No phone"}
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                        <Mail size={12} className="text-gray-300" />
                        {customer.email || "no-email@example.com"}
                      </div>
                    </div>
                  </td>
                )}

                {visibleColumns.includes("loyalty") && (
                  <td className="px-6 py-5">
                    {getTierBadge(customer.loyaltyTier)}
                  </td>
                )}

                {visibleColumns.includes("status") && (
                  <td className="px-6 py-5">
                    {getStatusBadge(customer.userStatus || customer.status)}
                  </td>
                )}

                {visibleColumns.includes("actions") && (
                  <td className="px-6 py-5 text-right relative">
                    <button
                      onClick={() => handleViewDetail(customer)}
                      className="p-2 text-gray-400 hover:text-[#d9a13b] hover:bg-white rounded-lg border border-transparent shadow-none hover:shadow-sm transition-all"
                      title={t.table?.details || "Profile Details"}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </Table>

        <PaginationControls
          currentPage={queryPage}
          totalPages={totalPages}
          setPage={handlePageChange}
        />
      </div>

      {detailModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="relative h-32 bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] shrink-0">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="absolute top-4 right-4 size-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors"
              >
                &times;
              </button>

              <div className="absolute left-8 bottom-[-48px] flex items-end gap-4">
                <div className="size-24 rounded-3xl bg-white p-1 shadow-xl">
                  <div className="size-full rounded-2xl bg-[#d9a13b] flex items-center justify-center text-3xl font-black text-white overflow-hidden">
                    {customerDetail?.avatarUrl ? (
                      <img
                        src={customerDetail.avatarUrl}
                        alt={customerDetail.fullName}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      (customerDetail?.fullName || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                <div className="my-2">
                  <h3 className="text-xl font-bold text-white leading-none">
                    {customerDetail?.fullName || "Unknown"}
                  </h3>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-400 tracking-wider font-mono">
                      {customerDetail?.email || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-20 p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
              {!customerDetail ? (
                <div className="col-span-2 flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-[#d9a13b] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                        {t.modal?.personalInfo || "Personal Info"}
                      </h4>

                      <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                        <div className="flex justify-between items-center text-sm border-b pb-2">
                          <span className="text-gray-500 font-semibold">
                            {t.modal?.labels?.phone || "Phone"}
                          </span>
                          <span className="font-bold text-gray-900">
                            {customerDetail.phone || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm border-b pb-2">
                          <span className="text-gray-500 font-semibold">
                            Email
                          </span>
                          <span className="font-bold text-gray-900">
                            {customerDetail.email || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm border-b pb-2">
                          <span className="text-gray-500 font-semibold">
                            {t.modal?.labels?.status || "Status"}
                          </span>
                          <span className="font-bold text-green-600 bg-green-50 px-2 rounded-md">
                            {customerDetail.userStatus || customerDetail.status}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-semibold">
                            Verify Email
                          </span>
                          <span
                            className={`font-bold px-2 rounded-md ${
                              customerDetail.verifyEmail
                                ? "text-green-600 bg-green-50"
                                : "text-red-500 bg-red-50"
                            }`}
                          >
                            {customerDetail.verifyEmail ? "Verified" : "Unverified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                        {t.modal?.loyalty || "Loyalty Status"}
                      </h4>

                      <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-sm border-b pb-2">
                          <span className="text-gray-500 font-semibold">
                            Tier
                          </span>
                          {getTierBadge(customerDetail.loyaltyTier)}
                        </div>

                        <div className="flex justify-between items-center text-sm border-b pb-2">
                          <span className="text-gray-500 font-semibold">
                            Current Point
                          </span>
                          <span className="font-bold text-indigo-600">
                            {customerDetail.currentPoint ?? 0}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-semibold">
                            Total Point
                          </span>
                          <span className="font-bold text-indigo-600">
                            {customerDetail.totalPoint ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-8 py-5 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;