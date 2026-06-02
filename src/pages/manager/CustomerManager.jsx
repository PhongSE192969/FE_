import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-hot-toast";
import customerService from "@/services/customerService";
import {
  Table,
  PaginationControls,
  SearchInput,
  SelectOption,
  StatCard,
} from "@/components/ui";
import {
  Activity,
  Eye,
  Mail,
  Phone,
  Store,
  Users,
} from "lucide-react";
import { CustomerDetailModal } from "@/components/modal";
import { GetAllFranchises } from "@/services";

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalElements: 0,
  });

  const size = 10;

  const [keyword, setKeyword] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [franchiseFilter, setFranchiseFilter] = useState("All");

  const [sortBy, setSortBy] = useState("lastOrderAt");
  const [sortDir, setSortDir] = useState("desc");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const tableColumns = useMemo(
    () => [
      {
        id: "customer",
        label: "Khách hàng",
        sortable: true,
        sortKey: "fullName",
      },
      {
        id: "contact",
        label: "Liên hệ",
        sortable: false,
      },
      {
        id: "franchise",
        label: "Cửa hàng",
        sortable: false,
      },
      {
        id: "loyalty",
        label: "Hạng & Điểm",
        sortable: false,
      },
      {
        id: "status",
        label: "Trạng thái",
        sortable: true,
        sortKey: "status",
      },
      {
        id: "actions",
        label: "",
        sortable: false,
      },
    ],
    []
  );

  const [visibleColumns, setVisibleColumns] = useState(
    tableColumns.map((column) => column.id)
  );

  useEffect(() => {
    const fetchFranchisesList = async () => {
      try {
        const res = await GetAllFranchises();

        const data = res?.data?.data || res?.data || res;

        setFranchises(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi lấy danh sách cửa hàng", error);
        setFranchises([]);
      }
    };

    fetchFranchisesList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(keyword);

      setPagination((prev) => ({
        ...prev,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchCustomersList = useCallback(async () => {
    setLoading(true);

    try {
      const response = await customerService.searchCustomers({
        page: pagination.page - 1,
        size,
        sortBy,
        sortDir,
        keyword: debouncedSearch || "",
        status: statusFilter !== "All" ? statusFilter : null,
        franchiseId: franchiseFilter !== "All" ? franchiseFilter : null,
      });

      setCustomers(Array.isArray(response.items) ? response.items : []);

      setPagination((prev) => ({
        ...prev,
        totalPages: response.totalPages || 1,
        totalElements: response.totalItems || 0,
      }));
    } catch (error) {
      console.error("Fetch customers failed:", error);
      toast.error("Không thể tải danh sách khách hàng");

      setCustomers([]);
      setPagination((prev) => ({
        ...prev,
        totalPages: 1,
        totalElements: 0,
      }));
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    debouncedSearch,
    statusFilter,
    franchiseFilter,
    sortBy,
    sortDir,
  ]);

  useEffect(() => {
    fetchCustomersList();
  }, [fetchCustomersList]);

  const handleSort = (key) => {
    if (!key) return;

    if (sortBy === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setKeyword("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setFranchiseFilter("All");
    setSortBy("lastOrderAt");
    setSortDir("desc");

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
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

  const getStatusBadge = (status) => {
    const normalizedStatus = status || "ACTIVE";
    const isActive = normalizedStatus === "ACTIVE";

    return (
      <span
        className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full w-fit ${
          isActive ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"
        }`}
      >
        <span
          className={`size-1.5 rounded-full ${
            isActive ? "bg-green-500 animate-pulse" : "bg-red-500"
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
            Khách Hàng Toàn Hệ Thống
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Manager tổng theo dõi khách hàng theo từng cửa hàng/franchise
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          label="Tổng Khách Hàng"
          value={pagination.totalElements}
          subtext="Dựa trên bộ lọc hiện tại"
          color="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={keyword}
              onChange={setKeyword}
              placeholder="Tìm kiếm theo tên, username, email, SĐT..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <SelectOption
              value={franchiseFilter}
              onChange={(value) => {
                setFranchiseFilter(value);
                setPagination((prev) => ({
                  ...prev,
                  page: 1,
                }));
              }}
              placeholder="Tất cả cửa hàng"
              icon={Store}
              options={[
                { value: "All", label: "Tất cả cửa hàng" },
                ...franchises.map((franchise) => ({
                  value: franchise.id,
                  label: franchise.name,
                })),
              ]}
            />

            <SelectOption
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination((prev) => ({
                  ...prev,
                  page: 1,
                }));
              }}
              placeholder="Tất cả trạng thái"
              icon={Activity}
              options={[
                { value: "All", label: "Tất cả" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "SUSPENDED", label: "Suspended" },
              ]}
            />

            <button
              onClick={handleResetFilters}
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
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          isLoading={loading}
          isEmpty={!loading && customers.length === 0}
        >
          {customers.map((customer, index) => {
            const rowKey = customer.userId || customer.id || index;
            const fullName = customer.fullName || "Guest User";
            const avatarUrl = customer.avatarUrl;

            return (
              <tr
                key={rowKey}
                className="group hover:bg-gray-50/80 transition-colors"
              >
                {visibleColumns.includes("customer") && (
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={fullName}
                          className="size-10 rounded-full object-cover border border-gray-200"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
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
                        <Mail size={12} className="text-gray-300" />
                        {customer.email || "N/A"}
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                        <Phone size={12} className="text-gray-300" />
                        {customer.phone || "N/A"}
                      </div>
                    </div>
                  </td>
                )}

                {visibleColumns.includes("franchise") && (
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-slate-700">
                      {customer.franchiseName ||
                        customer.franchise?.name ||
                        "N/A"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-1">
                      {customer.franchiseId || customer.franchise?.id || ""}
                    </div>
                  </td>
                )}

                {visibleColumns.includes("loyalty") && (
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      {getTierBadge(customer.loyaltyTier)}

                      <span className="text-[10px] text-gray-400">
                        {customer.currentPoint ?? 0} pts / Tổng{" "}
                        {customer.totalPoint ?? 0}
                      </span>
                    </div>
                  </td>
                )}

                {visibleColumns.includes("status") && (
                  <td className="px-6 py-5">
                    {getStatusBadge(customer.userStatus || customer.status)}
                  </td>
                )}

                {visibleColumns.includes("actions") && (
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsDetailModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-[#d9a13b] hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm border border-transparent hover:border-gray-100"
                      title="Xem chi tiết"
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
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          setPage={(page) =>
            setPagination((prev) => ({
              ...prev,
              page,
            }))
          }
        />
      </div>

      {isDetailModalOpen && (
        <CustomerDetailModal
          customerData={selectedCustomer}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerManager;