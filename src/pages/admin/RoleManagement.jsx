import React, { useState, useMemo, useEffect } from "react";
import {
  Shield,
  Lock,
  Plus,
  Search,
  Filter,
  Check,
  Edit2,
  Trash2,
  MoreVertical,
  ShieldAlert,
  Layers,
  Save,
  Settings2,
} from "lucide-react";
import { StatCard } from "@/components/ui";
import { AddRoleModal, ManagePermissionModal } from "@/components/modal";
import toast from "react-hot-toast";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import {
  GetRoles,
  CreateRole,
  UpdateRole,
  DeleteRole,
  AssignPermissionsToRole,
  GetPermissions,
  CreatePermission,
  UpdatePermission,
  DeletePermission,
} from "@/services/identityService";

/**
 * Normalizes permission IDs from various formats (object, string, or name)
 */
const getNormalizedPermIds = (rolePerms, allPerms) => {
  if (!rolePerms || !Array.isArray(rolePerms)) return [];
  return rolePerms
    .map((p) => {
      if (p && typeof p === "object" && p.id) return p.id;
      if (p && typeof p === "object" && p.name) {
        const matched = allPerms.find((ap) => ap.name === p.name);
        return matched?.id;
      }
      if (typeof p === "string") {
        const matchedByName = allPerms.find((ap) => ap.name === p);
        return matchedByName ? matchedByName.id : p;
      }
      return null;
    })
    .filter(Boolean);
};

const RoleManagement = () => {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).admin?.roleManagement || {};

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  // Track modified roles in the Access Matrix
  const [dirtyRoles, setDirtyRoles] = useState(new Set());

  const fetchData = async () => {
    try {
      setLoading(true);
      const rolesRes = await GetRoles().catch((err) => {
        console.error("Roles API Error:", err);
        return { data: [] };
      });

      const permsRes = await GetPermissions().catch((err) => {
        console.error("Permissions API Error:", err);
        return { data: [] };
      });

      const extractArray = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.data?.data)) return res.data.data;
        return [];
      };

      setRoles(extractArray(rolesRes));
      setPermissions(extractArray(permsRes));
      setDirtyRoles(new Set());
    } catch (error) {
      toast.error(t.alerts?.loadFailed || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- PERMISSION CRUD ---
  const handleCreatePermission = async (permData) => {
    try {
      const newPerm = await CreatePermission(permData);
      setPermissions((prev) => [...prev, newPerm.data || newPerm]);
      toast.success(t.alerts?.createPermissionSuccess || "Permission created");
    } catch (error) {
      toast.error(error.message || "Error");
      throw error;
    }
  };

  const handleUpdatePermission = async (permId, permData) => {
    try {
      await UpdatePermission(permId, permData);
      setPermissions((prev) =>
        prev.map((p) => (p.id === permId ? { ...p, ...permData } : p)),
      );
      toast.success(t.alerts?.updatePermissionSuccess || "Permission updated");
    } catch (error) {
      toast.error(error.message || "Error");
      throw error;
    }
  };

  const handleDeletePermission = async (permId) => {
    try {
      await DeletePermission(permId);
      setPermissions((prev) => prev.filter((p) => p.id !== permId));
      toast.success(t.alerts?.deletePermissionSuccess || "Permission deleted");
    } catch (error) {
      toast.error(error.message || "Error");
    }
  };

  // --- ROLE CRUD ---
  const handleSaveRole = async (roleData) => {
    try {
      if (selectedRole) {
        const res = await UpdateRole(selectedRole.id, roleData);
        setRoles((prev) =>
          prev.map((r) =>
            r.id === selectedRole.id ? { ...r, ...res.data } : r,
          ),
        );
        toast.success(t.alerts?.updateRoleSuccess || "Role updated");
      } else {
        const res = await CreateRole(roleData);
        setRoles((prev) => [...prev, res.data]);
        toast.success(t.alerts?.createRoleSuccess || "Role created");
      }
      setIsRoleModalOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast.error(error.message || "Error saving role");
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm(t.alerts?.confirmDeleteRole || "Delete this role?")) {
      try {
        await DeleteRole(roleId);
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
        toast.success(t.alerts?.deleteRoleSuccess || "Role deleted");
      } catch (error) {
        toast.error(error.message || "Error");
      }
    }
  };

  // --- ACCESS MATRIX LOGIC ---
  const togglePermission = (roleId, permId) => {
    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id === roleId) {
          const currentPermIds = getNormalizedPermIds(
            role.permissions,
            permissions,
          );
          const updatedPerms = currentPermIds.includes(permId)
            ? currentPermIds.filter((id) => id !== permId)
            : [...currentPermIds, permId];
          return { ...role, permissions: updatedPerms };
        }
        return role;
      }),
    );
    setDirtyRoles((prev) => new Set(prev).add(roleId));
  };

  const handleSaveMatrixChanges = async () => {
    if (dirtyRoles.size === 0) return;
    setLoading(true);
    try {
      const updatePromises = Array.from(dirtyRoles).map((roleId) => {
        const role = roles.find((r) => r.id === roleId);
        return AssignPermissionsToRole(roleId, {
          permissionIds: role.permissions,
        });
      });
      await Promise.all(updatePromises);
      setDirtyRoles(new Set());
      toast.success(t.alerts?.updateMatrixSuccess || "Matrix updated");
    } catch (error) {
      toast.error(t.alerts?.updateMatrixFailed || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      totalRoles: roles?.length || 0,
      totalPerms: permissions?.length || 0,
      avgPerms:
        roles?.length > 0
          ? Math.round(
              roles.reduce((acc, r) => acc + (r?.permissions?.length || 0), 0) /
                roles.length,
            )
          : 0,
    }),
    [roles, permissions],
  );

  const filteredRoles = roles.filter((role) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      role.name?.toLowerCase().includes(searchLower) ||
      role.description?.toLowerCase().includes(searchLower);
    return matchesSearch && role.name?.toUpperCase() !== "ADMIN";
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {t.title || "Role & Permissions"}
          </h2>
          <p className="text-gray-500 text-sm">
            {t.subtitle || "Manage security policies"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsPermModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-50 active:scale-95 shadow-sm"
          >
            <Settings2 size={18} />
            <span>{t.managePermissions || "Manage Permissions"}</span>
          </button>
          <button
            onClick={() => {
              setSelectedRole(null);
              setIsRoleModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#d9a13b] hover:bg-[#c48f32] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus size={18} />
            <span>{t.createRole || "Create New Role"}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={Shield}
          label={t.stats?.totalRoles || "Total Roles"}
          value={stats.totalRoles}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <StatCard
          icon={Lock}
          label={t.stats?.permissions || "Permissions"}
          value={stats.totalPerms}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        {/* <StatCard
          icon={Layers}
          label={t.stats?.avgAccess || "Avg. Access"}
          value={stats.avgPerms}
          color="text-green-600"
          bg="bg-green-50"
        /> */}
        {/* <StatCard
          icon={ShieldAlert}
          label={t.stats?.security || "Security"}
          value={t.stats?.unlocked || "Unlocked"}
          color="text-orange-600"
          bg="bg-orange-50"
        /> */}
      </div>

      {/* Filters & Save Action */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder={t.searchPlaceholder || "Search..."}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a13b]/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            {/* <button className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 flex items-center gap-2">
              <Filter size={16} /> {t.filters || "Filters"}
            </button> */}
            <button
              onClick={handleSaveMatrixChanges}
              disabled={dirtyRoles.size === 0 || loading}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md
                ${dirtyRoles.size > 0 ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
              `}
            >
              <Save size={16} />
              {dirtyRoles.size > 0
                ? t.saveChangesCount
                  ? t.saveChangesCount.replace("{count}", dirtyRoles.size)
                  : `Save (${dirtyRoles.size})`
                : t.saved || "Saved"}
            </button>
          </div>
        </div>
      </div>

      {/* Access Matrix */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900">
              {t.matrix?.title || "Access Matrix"}
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {t.matrix?.subtitle || "Toggle permissions for roles"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 sticky left-0 z-20 bg-gray-50 min-w-[280px] border-b border-gray-100 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {t.matrix?.header || "Permissions \\ Roles"}
                  </span>
                </th>
                {filteredRoles.map((role) => (
                  <th
                    key={role.id}
                    className="px-4 py-4 min-w-[160px] text-center border-b border-gray-100 group align-top"
                  >
                    <div className="font-bold text-slate-900 text-sm">
                      {role.name}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium truncate max-w-[140px] mx-auto mt-1">
                      {role.description}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedRole(role);
                          setIsRoleModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-slate-900"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {permissions.map((perm) => (
                <tr
                  key={perm.id}
                  className="group hover:bg-gray-50/30 transition-colors"
                >
                  <td className="px-6 py-4 sticky left-0 z-10 bg-white group-hover:bg-gray-50/30 border-r border-gray-50">
                    <div className="group/perm relative w-full">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 uppercase break-words">
                          {perm.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              perm.httpMethod === "GET"
                                ? "bg-blue-100 text-blue-700"
                                : perm.httpMethod === "POST"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {perm.httpMethod}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono truncate max-w-[180px]">
                            {perm.api}
                          </span>
                        </div>
                      </div>
                      <div className="absolute hidden group-hover/perm:block left-full ml-2 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg w-56 z-30 shadow-xl">
                        <p className="font-bold text-yellow-500">{perm.api}</p>
                        <p className="mt-1 opacity-90">
                          {perm.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </td>
                  {filteredRoles.map((role) => {
                    const isActive = getNormalizedPermIds(
                      role.permissions,
                      permissions,
                    ).includes(perm.id);
                    return (
                      <td
                        key={`${role.id}-${perm.id}`}
                        className="px-4 py-4 text-center border-l border-gray-50/50"
                      >
                        <button
                          onClick={() => togglePermission(role.id, perm.id)}
                          className={`size-8 rounded-xl transition-all ${isActive ? "bg-green-100 text-green-600 shadow-inner" : "bg-gray-50 text-gray-300 hover:bg-gray-100"}`}
                        >
                          {isActive ? (
                            <Check size={16} strokeWidth={3} />
                          ) : (
                            <div className="size-1 rounded-full bg-gray-300" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Developer Information */}
      <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-4 mt-6">
        <div className="size-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-600 shrink-0">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-orange-900">
            Developer Override Mode
          </h4>
          <p className="text-xs text-orange-700 leading-relaxed mt-1">
            Safety locks removed. Modifying permissions for{" "}
            <strong>Super Admin</strong> is enabled.
          </p>
        </div>
      </div>

      {isPermModalOpen && (
        <ManagePermissionModal
          permissions={permissions}
          setIsPermModalOpen={setIsPermModalOpen}
          onCreatePerm={handleCreatePermission}
          onUpdatePerm={handleUpdatePermission}
          onDeletePerm={handleDeletePermission}
        />
      )}

      {isRoleModalOpen && (
        <AddRoleModal
          role={selectedRole}
          setIsRoleModalOpen={setIsRoleModalOpen}
          onSave={handleSaveRole}
        />
      )}
    </div>
  );
};

export default RoleManagement;
