import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Users,
  UserPlus,
  UserCheck,
  Briefcase,
  Mail,
  Phone,
  Eye,
  MoreVertical,
  Shield,
  Activity,
} from "lucide-react";

import {
  PaginationControls,
  SearchInput,
  SelectOption,
  StatCard,
  Table,
} from "@/components/ui";

import { AddUserModal, ConfirmModal, UserDetailModal } from "@/components/modal";
import { useAuthStore, useUserStore, useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { formatDate } from "@/utils/helpers";

import {
  AssignRole,
  ChangeStatus,
  CreateOne,
  DeleteOne,
  GetAllFranchises,
  UpdateUser,
} from "@/services";

const userStatus = ["ACTIVE", "SUSPENDED", "INACTIVE"];

const ROLE_MANAGER = "MANAGER";
const ROLE_ADMIN = "ADMIN";
const ROLE_STORE_MANAGER = "STORE_MANAGER";
const ROLE_STAFF = "STAFF";
const ROLE_CUSTOMER = "CUSTOMER";

const normalizeRole = (role) => {
  return role ? String(role).trim().toUpperCase() : "";
};

const normalizeResponseData = (res) => {
  return res?.data?.data || res?.data || res;
};

const getAllowedRoleNamesForCreateOrAssign = (currentRole) => {
  switch (normalizeRole(currentRole)) {
    case ROLE_MANAGER:
      return [ROLE_ADMIN, ROLE_STORE_MANAGER];

    case ROLE_ADMIN:
      return [ROLE_STORE_MANAGER];

    case ROLE_STORE_MANAGER:
      return [ROLE_STAFF];

    default:
      return [];
  }
};

const UserManagement = () => {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).admin?.userManagement || {};

  const currentUser = useAuthStore((state) => state.user);

  const currentRole = normalizeRole(
    currentUser?.role?.name || currentUser?.role
  );

  const currentFranchiseId =
    currentUser?.franchise?.id ||
    currentUser?.franchiseId ||
    currentUser?.franchise_id ||
    null;

  const statsCounts = useUserStore((state) => state.statsCounts);
  const fetchCountUsers = useUserStore((state) => state.fetchCountUsers);

  const {
    users,
    roles,
    isLoading,
    totalPages,
    currentPage,
    fetchUsersList,
    fetchRolesList,
  } = useUserStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [franchiseFilter, setFranchiseFilter] = useState("All");
  const [franchises, setFranchises] = useState([]);

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const size = 10;

  const [sortBy, setSortBy] = useState("lastLogin");
  const [sortDir, setSortDir] = useState("desc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [assignRoleModalUser, setAssignRoleModalUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [assignFranchiseId, setAssignFranchiseId] = useState(null);

  const [selectRole, setSelectRole] = useState(null);
  const [selectFranchise, setSelectFranchise] = useState(null);
  const [selectGender, setSelectGender] = useState(true);
  const [statusConfirm, setStatusConfirm] = useState(null);

  const defaultFormData = {
    fullName: "",
    phone: "",
    email: "",
    username: "",
    gender: "",
    roleName: "",
    franchise: null,
    franchiseId: null,
  };

  const [formData, setFormData] = useState(defaultFormData);

  const allowedRoleNamesForCreateOrAssign = useMemo(() => {
    return getAllowedRoleNamesForCreateOrAssign(currentRole);
  }, [currentRole]);

  const internalCreatableRoles = useMemo(() => {
    return (roles || []).filter((role) => {
      const roleName = normalizeRole(role.name);

      return (
        roleName &&
        roleName !== ROLE_CUSTOMER &&
        allowedRoleNamesForCreateOrAssign.includes(roleName)
      );
    });
  }, [roles, allowedRoleNamesForCreateOrAssign]);

  const tableColumns = useMemo(
    () => [
      {
        id: "details",
        label: t.table?.details || "User Details",
        sortable: true,
        sortKey: "fullName",
      },
      {
        id: "role",
        label: t.table?.role || "Role",
        sortable: true,
        sortKey: "role",
      },
      {
        id: "contact",
        label: t.table?.contact || "Contact",
        sortable: false,
      },
      {
        id: "status",
        label: t.table?.status || "Status",
        sortable: true,
        sortKey: "status",
      },
      {
        id: "date",
        label: t.table?.date || "Join Date",
        sortable: true,
        sortKey: "createdAt",
      },
      {
        id: "actions",
        label: "",
        sortable: false,
      },
    ],
    [t]
  );

  const [visibleColumns, setVisibleColumns] = useState(
    tableColumns.map((column) => column.id)
  );

  const stats = useMemo(
    () => ({
      total: statsCounts?.totals || 0,
      active: statsCounts?.totalIsActive || 0,
      admins: statsCounts?.totalAdmin || 0,
      managers: statsCounts?.totalManager || 0,
      staff: statsCounts?.totalStaff || 0,
      customers: statsCounts?.totalCustomer || 0,
      deleted: statsCounts?.totalIsDeleted || 0,
      suspended: statsCounts?.totalIsSuspended || 0,
    }),
    [statsCounts]
  );

  const assignableRoles = useMemo(() => {
    return internalCreatableRoles.map((role) => ({
      value: role.id,
      label: normalizeRole(role.name),
      name: normalizeRole(role.name),
    }));
  }, [internalCreatableRoles]);

  const filterRoleOptions = useMemo(() => {
    const roleOptions = (roles || []).map((role) => ({
      value: normalizeRole(role.name),
      label: normalizeRole(role.name),
    }));

    return [{ value: "All", label: "All Roles" }, ...roleOptions];
  }, [roles]);

  const franchiseOptions = useMemo(() => {
    return franchises.map((franchise) => ({
      value: franchise.id,
      label: franchise.name || franchise.franchiseName || franchise.id,
    }));
  }, [franchises]);

  const getRoleBadge = (role) => {
    if (!role) return null;

    const roleName = normalizeRole(role?.name || role);

    const styles = {
      MANAGER: "bg-indigo-50 text-indigo-600 border-indigo-100",
      ADMIN: "bg-purple-50 text-purple-600 border-purple-100",
      STORE_MANAGER: "bg-amber-50 text-amber-700 border-amber-100",
      STAFF: "bg-slate-50 text-slate-600 border-slate-100",
      CUSTOMER: "bg-green-50 text-green-600 border-green-100",
    };

    return (
      <span
        className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
          styles[roleName] || styles.STAFF
        }`}
      >
        {roleName}
      </span>
    );
  };

  const getRoleNameFromValue = (roleValue) => {
    const foundRole = (roles || []).find(
      (role) =>
        role.id === roleValue ||
        normalizeRole(role.name) === normalizeRole(roleValue)
    );

    return normalizeRole(foundRole?.name || roleValue);
  };

  const roleRequiresFranchise = (roleName) => {
    const normalized = normalizeRole(roleName);

    return normalized === ROLE_STORE_MANAGER || normalized === ROLE_STAFF;
  };

  const canAssignUser = (user) => {
    const targetRole = normalizeRole(user?.role?.name || user?.role);

    if (targetRole === ROLE_CUSTOMER) {
      return false;
    }

    if (currentRole === ROLE_MANAGER) {
      return targetRole !== ROLE_MANAGER;
    }

    if (currentRole === ROLE_ADMIN) {
      return targetRole === ROLE_STORE_MANAGER || targetRole === ROLE_STAFF;
    }

    if (currentRole === ROLE_STORE_MANAGER) {
      return targetRole === ROLE_STAFF;
    }

    return false;
  };

  const canManageUser = (user) => {
    const targetRole = normalizeRole(user?.role?.name || user?.role);

    if (currentRole === ROLE_MANAGER) {
      return targetRole !== ROLE_MANAGER;
    }

    if (currentRole === ROLE_ADMIN) {
      return [ROLE_STORE_MANAGER, ROLE_STAFF, ROLE_CUSTOMER].includes(
        targetRole
      );
    }

    if (currentRole === ROLE_STORE_MANAGER) {
      const userFranchiseId =
        user?.franchise?.id || user?.franchiseId || user?.franchise_id || null;

      return targetRole === ROLE_STAFF && userFranchiseId === currentFranchiseId;
    }

    return false;
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

  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("All");
    setStatusFilter("All");
    setFranchiseFilter("All");
    setSortBy("lastLogin");
    setSortDir("desc");
    setPage(1);
  };

  const handleCreateUser = async () => {
    try {
      const roleName = getRoleNameFromValue(selectRole);

      if (!roleName) {
        toast.error("Vui lòng chọn role.");
        return;
      }

      if (roleName === ROLE_CUSTOMER) {
        toast.error("CUSTOMER chỉ được tạo qua đăng nhập Firebase.");
        return;
      }

      if (!allowedRoleNamesForCreateOrAssign.includes(roleName)) {
        toast.error("Bạn không có quyền tạo role này.");
        return;
      }

      let resolvedFranchiseId = selectFranchise || null;

      if (currentRole === ROLE_STORE_MANAGER) {
        resolvedFranchiseId = currentFranchiseId;
      }

      if (roleRequiresFranchise(roleName) && !resolvedFranchiseId) {
        toast.error("Vui lòng chọn cửa hàng/franchise cho role này.");
        return;
      }

      const payload = {
        ...formData,
        roleName,
        franchiseId: roleRequiresFranchise(roleName)
          ? resolvedFranchiseId
          : null,
        franchise: roleRequiresFranchise(roleName) ? resolvedFranchiseId : null,
        gender: selectGender === "MALE" || selectGender === true,
      };

      const response = await CreateOne(payload);

      if (response.statusCode === 201 || response.statusCode === 200) {
        setIsModalOpen(false);
        setFormData(defaultFormData);
        setSelectRole(null);
        setSelectFranchise(null);
        fetchCountUsers();
        setPage(1);
        setRefreshKey((prev) => prev + 1);
        toast.success(
          t.alerts?.createSuccess ||
            response.message ||
            "User created successfully"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create user"
      );
    }
  };

  const requestUpdateStatus = (user, nextStatus) => {
    setStatusConfirm({ user, userId: user.id, nextStatus });
    setOpenActionMenuId(null);
  };

  const executeUpdateStatus = async () => {
    if (!statusConfirm) return;

    const { userId, nextStatus } = statusConfirm;
    setStatusConfirm(null);

    toast.loading(t.alerts?.updating || "Updating...");

    try {
      const payload = {
        userId,
        params: { status: nextStatus },
      };

      const response = await ChangeStatus(payload);

      if (response.statusCode === 200) {
        toast.success(t.alerts?.updateSuccess || "Success");
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error(error);
      toast.error(t.alerts?.updateFailed || "Failed");
    } finally {
      toast.dismiss();
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    toast.loading(t.alerts?.updating || "Updating user status...");

    try {
      const payload = {
        userId,
        params: {
          status: newStatus,
        },
      };

      const response = await ChangeStatus(payload);

      if (response.statusCode === 200) {
        toast.success(
          t.alerts?.updateSuccess ||
            response.message ||
            "User status updated successfully"
        );
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error(error);
      toast.error(t.alerts?.updateFailed || "Failed to update user status");
    } finally {
      toast.dismiss();
    }

    setOpenActionMenuId(null);
  };

  const executeDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    try {
      const payload = { userId: deleteConfirmUser.id };
      const response = await DeleteOne(payload);

      if (response.statusCode === 200) {
        setDeleteConfirmUser(null);
        setRefreshKey((prev) => prev + 1);
        toast.success(
          t.alerts?.deleteSuccess ||
            response.message ||
            "User deleted successfully"
        );
      }
    } catch (error) {
      console.error(error);

      if (error.response) {
        toast.error(
          t.alerts?.deleteFailed ||
            error.response.data.message ||
            "Failed to delete user"
        );
      } else {
        toast.error(t.alerts?.deleteFailed || "Failed to delete user");
      }

      setDeleteConfirmUser(null);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleAssignRoleSubmit = async () => {
    if (!assignRoleModalUser || !newRole) return;

    const roleName = getRoleNameFromValue(newRole);

    if (roleName === ROLE_CUSTOMER) {
      toast.error("Không gán CUSTOMER trong màn quản lý nhân sự nội bộ.");
      return;
    }

    if (!allowedRoleNamesForCreateOrAssign.includes(roleName)) {
      toast.error("Bạn không có quyền gán role này.");
      return;
    }

    let resolvedFranchiseId = assignFranchiseId || null;

    if (currentRole === ROLE_STORE_MANAGER) {
      resolvedFranchiseId = currentFranchiseId;
    }

    if (roleRequiresFranchise(roleName) && !resolvedFranchiseId) {
      toast.error("Vui lòng chọn cửa hàng/franchise cho role này.");
      return;
    }

    try {
      const payload = {
        userId: assignRoleModalUser.id,
        params: {
          roleName,
          franchiseId: roleRequiresFranchise(roleName)
            ? resolvedFranchiseId
            : null,
        },
      };

      const response = await AssignRole(payload);

      if (response.statusCode === 200) {
        toast.success(
          t.alerts?.assignSuccess ||
            response.message ||
            "Role assigned successfully"
        );

        setAssignRoleModalUser(null);
        setNewRole("");
        setAssignFranchiseId(null);
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          t.alerts?.assignFailed ||
          "Failed to assign role"
      );
    }
  };

  const handleSaveProfile = async (userId, updatedData) => {
    try {
      const payload = {
        userId,
        data: updatedData,
      };

      const response = await UpdateUser(payload);

      if (response.statusCode === 200) {
        toast.success(response.message || "Profile updated successfully");
        setSelectedUser(null);
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error(error);
      toast.error(t.alerts?.updateFailed || "Failed to update profile");
    }
  };

  const fetchFranchises = async () => {
    try {
      const response = await GetAllFranchises();
      const data = normalizeResponseData(response);

      setFranchises(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch franchises:", error);
      setFranchises([]);
    }
  };

  useEffect(() => {
    fetchCountUsers();
    fetchRolesList();
    fetchFranchises();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (searchTerm !== debouncedSearch) setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const params = {
      page,
      size,
      keyword: debouncedSearch,
      role: roleFilter,
      status: statusFilter,
      sortBy,
      sortDir,
    };

    if (franchiseFilter !== "All") {
      params.franchiseId = franchiseFilter;
    }

    if (currentRole === ROLE_STORE_MANAGER && currentFranchiseId) {
      params.franchiseId = currentFranchiseId;
    }

    fetchUsersList(params);
  }, [
    page,
    size,
    debouncedSearch,
    roleFilter,
    statusFilter,
    franchiseFilter,
    sortBy,
    sortDir,
    refreshKey,
    currentRole,
    currentFranchiseId,
  ]);

  return (
    <div className="space-y-6 pb-10 p-6 bg-gray-50 min-h-screen font-sans">
      {openActionMenuId && (
        <div
          className="fixed inset-0 z-[40]"
          onClick={() => setOpenActionMenuId(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {t.title || "User Management"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {t.subtitle || "Manage system access and staff permissions"}
          </p>
        </div>

        {allowedRoleNamesForCreateOrAssign.length > 0 && (
          <button
            onClick={() => {
              setFormData(defaultFormData);
              setSelectRole(null);
              setSelectFranchise(null);
              setSelectGender(true);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#d9a13b] hover:bg-[#c48f32] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-yellow-900/10 active:scale-95"
          >
            <UserPlus size={18} />
            <span>{t.addUser || "Add New User"}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          label={t.stats?.total || "Total Users"}
          value={stats.total}
          subtext="System-wide accounts"
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={UserCheck}
          label={t.stats?.active || "Active Now"}
          value={stats.active}
          subtext="Currently active"
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          icon={Briefcase}
          label={t.stats?.staff || "Operators"}
          value={stats.managers + stats.staff}
          subtext="Managers & staff"
          color="text-orange-600"
          bg="bg-orange-50"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={
                t.searchPlaceholder ||
                "Search by name, email, phone or username..."
              }
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <SelectOption
              value={roleFilter}
              onChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
              placeholder={t.filters?.allRoles || "All Roles"}
              icon={Shield}
              options={filterRoleOptions}
            />

            {currentRole !== ROLE_STORE_MANAGER && (
              <SelectOption
                value={franchiseFilter}
                onChange={(value) => {
                  setFranchiseFilter(value);
                  setPage(1);
                }}
                placeholder="All Stores"
                icon={Briefcase}
                options={[
                  { value: "All", label: "All Stores" },
                  ...franchiseOptions,
                ]}
              />
            )}

            <SelectOption
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              placeholder={t.filters?.allStatus || "All Status"}
              icon={Activity}
              options={[
                { value: "All", label: "All Status" },
                ...userStatus.map((status) => ({
                  value: status,
                  label: t.status?.[status] || status,
                })),
              ]}
            />

            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg hover:bg-red-50"
            >
              {t.filters?.reset || "Reset"}
            </button>
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
          isEmpty={!isLoading && (!users || users.length === 0)}
          emptyMessage={
            t.table?.empty ||
            "Không tìm thấy người dùng nào phù hợp với bộ lọc."
          }
        >
          {users?.map((user) => {
            const manageable = canManageUser(user);
            const assignable = canAssignUser(user);

            return (
              <tr
                key={user.id}
                className="group hover:bg-gray-50/80 transition-colors"
              >
                {visibleColumns.includes("details") && (
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="size-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 group-hover:bg-[#d9a13b] group-hover:text-white transition-all shadow-sm">
                          {user.fullName
                            ? user.fullName.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      )}

                      <div>
                        <div className="font-bold text-slate-900 leading-none">
                          {user.fullName || user.username}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-1">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                )}

                {visibleColumns.includes("role") && (
                  <td className="px-6 py-5">{getRoleBadge(user?.role)}</td>
                )}

                {visibleColumns.includes("contact") && (
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                        <Mail size={12} className="text-gray-300" />{" "}
                        {user.email || "N/A"}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                        <Phone size={12} className="text-gray-300" />{" "}
                        {user.phone || "N/A"}
                      </div>
                    </div>
                  </td>
                )}

                {visibleColumns.includes("status") && (
                  <td className="px-6 py-5">
                    <span
                      className={`
                        flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full w-fit
                        ${
                          user.status === "ACTIVE"
                            ? "text-green-600 bg-green-50"
                            : user.status === "SUSPENDED"
                              ? "text-orange-600 bg-orange-50"
                              : "text-red-500 bg-red-50"
                        }
                      `}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          user.status === "ACTIVE"
                            ? "bg-green-500 animate-pulse"
                            : user.status === "SUSPENDED"
                              ? "bg-orange-500"
                              : "bg-red-500"
                        }`}
                      />
                      {t.status?.[user.status] || user.status}
                    </span>
                  </td>
                )}

                {visibleColumns.includes("date") && (
                  <td className="px-6 py-5 text-xs text-gray-500 font-medium">
                    {formatDate(user.createdAt)}
                  </td>
                )}

                {visibleColumns.includes("actions") && (
                  <td className="px-6 py-5 text-right relative">
                    <div
                      className={`flex items-center justify-end gap-1 transition-opacity ${
                        openActionMenuId === user.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-gray-400 hover:text-[#d9a13b] hover:bg-white rounded-lg border border-transparent shadow-none hover:shadow-sm transition-all"
                        title={t.actions?.view || "Xem chi tiết"}
                      >
                        <Eye size={16} />
                      </button>

                      {user?.status !== "INACTIVE" && manageable && (
                        <button
                          onClick={() =>
                            setOpenActionMenuId(
                              openActionMenuId === user.id ? null : user.id
                            )
                          }
                          className="p-2 text-gray-400 hover:text-slate-600 relative"
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}

                      {openActionMenuId === user.id && (
                        <div className="absolute right-10 top-10 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-[50] flex flex-col text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          {assignable && user?.status === "ACTIVE" && (
                            <button
                              onClick={() => {
                                setAssignRoleModalUser(user);
                                setNewRole("");
                                setAssignFranchiseId(
                                  currentRole === ROLE_STORE_MANAGER
                                    ? currentFranchiseId
                                    : user?.franchise?.id ||
                                        user?.franchiseId ||
                                        null
                                );
                                setOpenActionMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-slate-700 font-bold transition-colors"
                            >
                              {t.actions?.assignRole || "Assign Role"}
                            </button>
                          )}

                          {user.status === "ACTIVE" ? (
                            <button
                              onClick={() =>
                                requestUpdateStatus(user, "SUSPENDED")
                              }
                              className="w-full text-left px-4 py-2 hover:bg-orange-50 text-orange-600 font-bold transition-colors"
                            >
                              {t.actions?.suspend || "Suspend User"}
                            </button>
                          ) : user.status === "SUSPENDED" ? (
                            <button
                              onClick={() =>
                                requestUpdateStatus(user, "ACTIVE")
                              }
                              className="w-full text-left px-4 py-2 hover:bg-green-50 text-green-600 font-bold transition-colors"
                            >
                              {t.actions?.unlock || "Unlock User"}
                            </button>
                          ) : null}

                          <button
                            onClick={() => {
                              setDeleteConfirmUser(user);
                              setOpenActionMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-bold transition-colors"
                          >
                            {t.actions?.delete || "Delete User"}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </Table>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          setPage={setPage}
        />
      </div>

      <ConfirmModal
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={executeUpdateStatus}
        title={
          statusConfirm?.nextStatus === "ACTIVE"
            ? "Kích hoạt tài khoản"
            : "Khóa tài khoản"
        }
        message={
          statusConfirm?.nextStatus === "ACTIVE"
            ? `Bạn có chắc chắn muốn mở khóa cho người dùng ${
                statusConfirm?.user?.fullName || ""
              }?`
            : `Người dùng ${
                statusConfirm?.user?.fullName || ""
              } sẽ không thể đăng nhập vào hệ thống. Tiếp tục?`
        }
        confirmText="Xác nhận"
        cancelText="Hủy"
        type={statusConfirm?.nextStatus === "ACTIVE" ? "info" : "warning"}
      />

      <ConfirmModal
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={executeDeleteUser}
        title={t.modals?.delete?.title || "Confirm Deletion"}
        message={
          t.modals?.delete?.message
            ? t.modals.delete.message.replace(
                "{name}",
                deleteConfirmUser?.fullName
              )
            : `Are you sure you want to permanently delete user ${
                deleteConfirmUser?.fullName || ""
              }? This action cannot be undone.`
        }
        confirmText={t.modals?.delete?.confirm || "Yes, Delete"}
        cancelText={t.modals?.delete?.cancel || "Cancel"}
        type="danger"
      />

      {assignRoleModalUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {t.modals?.assign?.title || "Assign Role"}
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {t.modals?.assign?.message
                ? t.modals.assign.message.replace(
                    "{name}",
                    assignRoleModalUser.fullName
                  )
                : `Select a new role for ${assignRoleModalUser.fullName}.`}
            </p>

            <SelectOption
              value={newRole}
              onChange={(value) => {
                setNewRole(value);

                const roleName = getRoleNameFromValue(value);
                if (!roleRequiresFranchise(roleName)) {
                  setAssignFranchiseId(null);
                }
              }}
              options={assignableRoles}
              icon={Shield}
              label={t.modals?.assign?.label || "Select new access level"}
            />

            {roleRequiresFranchise(getRoleNameFromValue(newRole)) &&
              currentRole !== ROLE_STORE_MANAGER && (
                <div className="mt-4">
                  <SelectOption
                    value={assignFranchiseId}
                    onChange={setAssignFranchiseId}
                    options={franchiseOptions}
                    icon={Briefcase}
                    label="Select store/franchise"
                  />
                </div>
              )}

            {roleRequiresFranchise(getRoleNameFromValue(newRole)) &&
              currentRole === ROLE_STORE_MANAGER && (
                <p className="mt-3 text-xs text-gray-500">
                  Staff sẽ được gán vào cửa hàng hiện tại của Store Manager.
                </p>
              )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setAssignRoleModalUser(null);
                  setNewRole("");
                  setAssignFranchiseId(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm"
              >
                {t.modals?.delete?.cancel || "Cancel"}
              </button>
              <button
                onClick={handleAssignRoleSubmit}
                className="flex-1 py-2.5 rounded-xl bg-[#d9a13b] text-white font-bold hover:bg-[#c49033] transition-colors text-sm"
              >
                {t.modals?.assign?.save || "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <UserDetailModal
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          getRoleBadge={getRoleBadge}
          rolesList={roles}
          franchisesList={franchises}
          onSaveProfile={handleSaveProfile}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {isModalOpen && (
        <AddUserModal
          setIsModalOpen={setIsModalOpen}
          formData={formData}
          setFormData={setFormData}
          roles={internalCreatableRoles}
          selectRole={selectRole}
          setSelectRole={setSelectRole}
          setSelectFranchise={setSelectFranchise}
          selectFranchise={
            currentRole === ROLE_STORE_MANAGER
              ? currentFranchiseId
              : selectFranchise
          }
          selectGender={selectGender}
          setSelectGender={setSelectGender}
          onSubmit={handleCreateUser}
        />
      )}
    </div>
  );
};

export default UserManagement;