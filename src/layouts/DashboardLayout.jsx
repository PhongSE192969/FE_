// src/layouts/DashboardLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import {
  Coffee,
  LogOut,
  Menu,
  Languages,
  Check,
} from "lucide-react";
import { useAuthStore, useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import toast from "react-hot-toast";
import NavItem from "@/components/dashboard/NavItem";
import { NAV_CONFIG, SUPPORTED_LANGUAGES } from "@/constraints";
import { Logout } from "@/services";
import { firebaseLogout } from "@/services/firebaseAuthService";

const normalizeRoleName = (role) => {
  if (!role) return "ADMIN";
  return String(role).toUpperCase();
};

const getRoleKey = (role) => {
  const normalizedRole = normalizeRoleName(role);

  switch (normalizedRole) {
    case "MANAGER":
      return "manager";

    case "ADMIN":
      return "admin";

    case "STORE_MANAGER":
      return "storeManager";

    case "STAFF":
      return "staff";

    default:
      return "admin";
  }
};

const getRoleLabel = (roleKey, currentLangCode) => {
  const isVi = currentLangCode === "vi";

  switch (roleKey) {
    case "manager":
      return isVi ? "Quản lý tổng" : "Company Manager";

    case "admin":
      return isVi ? "Quản trị viên" : "Admin";

    case "storeManager":
      return isVi ? "Quản lý cửa hàng" : "Store Manager";

    case "staff":
      return isVi ? "Nhân viên" : "Staff";

    default:
      return isVi ? "Thành viên" : "Member";
  }
};

const getLoginPathByRoleKey = (roleKey) => {
  if (roleKey === "admin" || roleKey === "manager" || roleKey === "storeManager" || roleKey === "staff") {
    return "/admin/login";
  }

  return "/login";
};

export default function DashboardLayout({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuthStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const currentLangCode = useLanguageStore((state) => state.language);
  const setCurrentLangCode = useLanguageStore((state) => state.setLanguage);

  const t = translations[currentLangCode] || translations.vi;

  const modalRef = useRef(null);

  const roleKey = getRoleKey(role || user?.role?.name || user?.role);
  const config = NAV_CONFIG[roleKey] || NAV_CONFIG.admin;

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) ||
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setUserModalOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearLocalAuth = () => {
    try {
      logout?.();

      localStorage.removeItem("capital-coffee-auth");
      sessionStorage.clear();

      // Nếu sau này có thêm key auth/cart khác thì clear thêm ở đây.
      // localStorage.removeItem("cart-storage");
    } catch (error) {
      console.error("Clear local auth error:", error);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      setUserModalOpen(false);

      // 1. Logout Firebase trước, nếu không currentUser vẫn còn và interceptor có thể lấy token mới.
      try {
        await firebaseLogout();
      } catch (firebaseError) {
        console.warn("Firebase logout failed, continue clearing local auth:", firebaseError);
      }

      // 2. Gọi logout service cũ nếu project đang còn dùng.
      try {
        await Logout();
      } catch (backendLogoutError) {
        console.warn("Backend logout failed, continue clearing local auth:", backendLogoutError);
      }

      // 3. Clear Zustand persist + local/session storage.
      clearLocalAuth();

      toast.success(t.common?.logoutSuccess || "Logged out successfully");

      // 4. Điều hướng đúng trang login.
      navigate(getLoginPathByRoleKey(roleKey), { replace: true });
    } catch (error) {
      console.error("Logout error:", error);

      clearLocalAuth();
      toast.success(t.common?.logoutSuccess || "Logged out successfully");
      navigate(getLoginPathByRoleKey(roleKey), { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const currentLabel = (() => {
    const tSidebar = t.sidebar || {};

    for (const item of config.items || []) {
      if (item.href === location.pathname) {
        return tSidebar[item.label] || item.label;
      }

      if (item.children) {
        const child = item.children.find((c) => c.href === location.pathname);

        if (child) {
          return `${tSidebar[item.label] || item.label} — ${
            tSidebar[child.label] || child.label
          }`;
        }
      }
    }

    return tSidebar.Dashboard || "Dashboard";
  })();

  const displayFranchiseName =
    user?.franchise?.name ||
    user?.franchiseName ||
    t.common?.allFranchise ||
    "All franchises";

  const displayUserName =
    user?.fullName ||
    user?.username ||
    user?.email ||
    "User";

  return (
    <div
      className="flex h-screen bg-gray-50 overflow-hidden"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? "w-64" : "w-[72px]"} flex flex-col bg-gradient-to-b
          ${config.color} text-white transition-all duration-300 ease-in-out shrink-0 shadow-2xl z-20
        `}
      >
        {/* Logo */}
        <div
          onClick={() => navigate("/home")}
          className="flex items-center gap-3 px-4 py-5 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors group"
        >
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0 group-active:scale-95 transition-transform"
            style={{
              background: `${config.accent}20`,
              border: `1px solid ${config.accent}35`,
            }}
          >
            <Coffee size={20} style={{ color: config.accent }} />
          </div>

          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="font-black text-sm leading-tight tracking-tight">
                {currentLangCode === "vi"
                  ? "Quản lý Hệ thống"
                  : "System Management"}
              </div>

              <div className="text-[11px] font-semibold opacity-50 mt-0.5">
                {t.sidebar?.[config.title] || config.title}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
          {(config.items || []).map((item) => (
            <NavItem
              key={item.href}
              item={item}
              config={config}
              sidebarOpen={sidebarOpen}
              location={location}
            />
          ))}
        </nav>

        {/* User Section */}
        <div className="relative border-t border-white/10 p-3" ref={modalRef}>
          {userModalOpen && (
            <div
              className={`
                absolute bottom-full left-3 right-3 mb-2 bg-black/80 border border-white/10 rounded-2xl shadow-2xl
                overflow-hidden animate-in slide-in-from-bottom-2 duration-200 z-50
                ${!sidebarOpen ? "w-48 left-full ml-2 bottom-0" : ""}
              `}
            >
              <div className="p-4 border-b border-white/5 bg-white/5">
                <div className="space-y-1">
                  <div className="pt-2">
                    <div className="flex items-center gap-2 px-2 mb-1">
                      <Languages size={12} className="text-white/30" />
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-tighter">
                        {t.common?.language || "Language"}
                      </span>
                    </div>

                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setCurrentLangCode(lang.code);
                          setUserModalOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-xs
                          ${
                            currentLangCode === lang.code
                              ? "bg-[#d9a13b]/20 text-[#d9a13b]"
                              : "text-white/60 hover:bg-white/5"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span className="font-semibold">{lang.label}</span>
                        </div>

                        {currentLangCode === lang.code && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <div className="size-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <LogOut size={16} />
                  )}
                  <span>
                    {isLoggingOut
                      ? t.common?.loggingOut || "Logging out..."
                      : t.common?.logout || "Logout"}
                  </span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setUserModalOpen(!userModalOpen)}
            className={`
              w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200
              ${
                userModalOpen
                  ? "bg-white/10 ring-1 ring-white/20"
                  : "hover:bg-white/5"
              }
            `}
          >
            <div
              className="size-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-lg"
              style={{ backgroundColor: config.accent, color: "#0f172a" }}
            >
              {displayUserName?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {sidebarOpen && (
              <div className="flex-1 text-left overflow-hidden">
                <div className="text-xs font-bold truncate text-white">
                  {displayUserName}
                </div>

                <div className="text-[10px] text-white/40 capitalize leading-none mt-0.5">
                  {getRoleLabel(roleKey, currentLangCode)} •{" "}
                  {currentLang.code.toUpperCase()}
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-200 shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <Menu size={18} />
            </button>

            <div>
              <h1 className="text-base font-black text-gray-900 leading-tight">
                {currentLabel}
              </h1>

              <p className="text-[11px] text-gray-400 font-semibold tracking-wide capitalize">
                {new Date().toLocaleDateString(
                  currentLangCode === "vi"
                    ? "vi-VN"
                    : currentLangCode === "jp"
                      ? "ja-JP"
                      : "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-gray-500">
                {displayFranchiseName}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}