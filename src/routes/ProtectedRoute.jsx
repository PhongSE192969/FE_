// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

const normalizeRoleName = (role) => {
  if (!role) return null;
  return String(role).toUpperCase();
};

const getDashboardPathByRole = (roleName) => {
  const normalizedRole = normalizeRoleName(roleName);

  switch (normalizedRole) {
    case "MANAGER":
      return "/manager";
    case "ADMIN":
      return "/admin";
    case "STORE_MANAGER":
      return "/store-manager";
    case "STAFF":
      return "/staff";
    case "CUSTOMER":
      return "/";
    default:
      return "/";
  }
};

const getLoginPathByRole = (requiredRoles = []) => {
  const normalizedRoles = requiredRoles.map(normalizeRoleName);

  if (normalizedRoles.length === 1 && normalizedRoles[0] === "CUSTOMER") {
    return "/login";
  }

  return "/admin/login";
};

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          <p className="text-sm text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  const allowedRoles = Array.isArray(role)
    ? role.map(normalizeRoleName)
    : role
      ? [normalizeRoleName(role)]
      : [];

  if (!isAuthenticated || !user) {
    return <Navigate to={getLoginPathByRole(allowedRoles)} replace />;
  }

  const userRole = normalizeRoleName(user?.role?.name || user?.role);

  if (!userRole) {
    return <Navigate to="/admin/login" replace />;
  }

  const isRoleMatching =
    allowedRoles.length === 0 || allowedRoles.includes(userRole);

  if (!isRoleMatching) {
    return <Navigate to={getDashboardPathByRole(userRole)} replace />;
  }

  return children;
}