import { useState, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Coffee,
  Menu,
  X,
  User,
  LogOut,
  Star,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore, useSearchStore } from "@/stores";
import { translations } from "@/locales";
import { SUPPORTED_LANGUAGES } from "@/constraints";
import { useCartStore } from "@/stores/cartStore";
import toast from "react-hot-toast";
import { Logout } from "@/services";
import { firebaseLogout } from "@/services/firebaseAuthService";

const normalizeRoleName = (role) => {
  return String(role || "").toUpperCase();
};

const getDashboardPathByRole = (roleName) => {
  const role = normalizeRoleName(roleName);

  switch (role) {
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

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuthStore();

  const { language: currentLangCode, setLanguage: setCurrentLangCode } =
    useLanguageStore();

  const {
    searchQuery,
    setSearchQuery,
    isSearching,
    clearSearch,
    performSearch,
    searchResults,
  } = useSearchStore();

  const debounceRef = useRef(null);

  const t =
    translations[currentLangCode]?.customer || translations.vi?.customer || {};

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { items } = useCartStore();
  const cartCount = items.length;

  const userRole = normalizeRoleName(user?.role?.name || user?.role);
  const isCustomer = isAuthenticated && userRole === "CUSTOMER";
  const isBackOfficeUser = isAuthenticated && userRole !== "CUSTOMER";

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      clearSearch();
      return;
    }

    if (location.pathname !== "/products") {
      debounceRef.current = setTimeout(() => {
        performSearch(val, 10);
      }, 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      navigate("/products");
    }
  };

  const clearLocalAuth = () => {
    try {
      useCartStore.getState().clearCart?.(true);
      logout?.();
      localStorage.removeItem("capital-coffee-auth");
      sessionStorage.clear();
    } catch (error) {
      console.error("Clear local auth error:", error);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      setMobileMenuOpen(false);

      try {
        await firebaseLogout();
      } catch (firebaseError) {
        console.warn("Firebase logout failed, continue clearing local auth:", firebaseError);
      }

      try {
        await Logout();
      } catch (backendLogoutError) {
        console.warn("Backend logout failed, continue clearing local auth:", backendLogoutError);
      }

      clearLocalAuth();

      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);

      clearLocalAuth();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { label: t.nav?.menu || "Menu", href: "/products" },
    { label: t.nav?.locations || "Locations", href: "#" },
    { label: t.nav?.about || "About Us", href: "#" },
    { label: t.nav?.rewards || "Rewards", href: "#" },
  ];

  return (
    <div className="relative flex min-h-screen flex-col bg-bg-light font-display">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 lg:px-10 bg-primary text-white shadow-md border-b border-white/10">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-14 flex items-center justify-center rounded-full">
              <img
                src="/logo01.png"
                alt="Capital Fashion"
                className="size-full object-contain"
              />
            </div>
            <span className="text-xl font-black tracking-tight">
              Capital Fashion
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 pl-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`text-sm font-semibold transition-colors hover:text-gold ${
                  location.pathname === link.href ? "text-gold" : "text-white/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl px-1.5 h-10 border border-white/10">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setCurrentLangCode(l.code)}
                className={`p-1 rounded-lg text-sm transition-all ${
                  currentLangCode === l.code
                    ? "bg-gold text-primary font-bold"
                    : "opacity-60 hover:opacity-100"
                }`}
                title={l.label}
              >
                {l.flag}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center bg-white/10 border border-white/10 rounded-xl px-3 h-10 gap-2 hover:border-gold/40 transition-colors focus-within:border-gold/40 relative">
            {isSearching ? (
              <Loader2 size={16} className="text-white/50 animate-spin" />
            ) : (
              <Search size={16} className="text-white/50" />
            )}

            <input
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder={t.nav?.searchPlaceholder || "Search menu..."}
              className="bg-transparent text-sm text-white placeholder-white/40 outline-none w-40"
            />

            {searchQuery && (
              <button
                onClick={clearSearch}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}

            {searchQuery && location.pathname !== "/products" && (
              <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 text-gray-800">
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    Searching...
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="flex flex-col">
                    <div className="flex flex-col max-h-[280px] overflow-y-auto">
                      {searchResults.map((item) => (
                        <Link
                          key={item.id}
                          to={`/products/${item.id}`}
                          onClick={clearSearch}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <img
                            src={item.image || item.imageUrl || "/logo01.png"}
                            alt={item.name}
                            className="size-10 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/logo01.png";
                            }}
                          />

                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-gray-700">
                              {item.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.categoryName}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate("/products")}
                      className="p-3 text-center text-sm font-bold text-primary bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      View all results
                    </button>
                  </div>
                ) : searchResults && searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No products found
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {isCustomer ? (
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => navigate("/checkout")}
                className="relative flex items-center gap-2 h-10 px-3 lg:px-4 bg-gold text-primary font-bold text-sm rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-gold/20"
              >
                <ShoppingBag size={18} />
                <span className="hidden lg:inline">
                  {t.nav?.cart || "Cart"}
                </span>

                {cartCount > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center px-1 font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-center gap-2 h-12 ${
                  user?.avatarUrl ? "border-gold" : "bg-gold"
                } text-primary font-bold rounded-xl`}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="avatar"
                    className="size-10 rounded-full border-2 mx-3 border-gold object-cover"
                  />
                ) : (
                  <User size={18} />
                )}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                title="Logout"
              >
                {isLoggingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
              </button>
            </div>
          ) : isBackOfficeUser ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to={getDashboardPathByRole(userRole)}
                className="h-10 px-4 flex items-center text-sm font-bold text-white border border-white/20 rounded-xl hover:bg-white/10 transition-colors"
              >
                {t.nav?.dashboard || "Dashboard"}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                title="Logout"
              >
                {isLoggingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <Link
                to="/login"
                className="h-10 px-4 flex items-center text-sm font-bold text-white border border-white/20 rounded-xl hover:bg-white/10 transition-colors"
              >
                {t.nav?.signIn || "Sign In"}
              </Link>

              <Link
                to="/register"
                className="h-10 px-4 flex items-center text-sm font-bold text-primary bg-gold rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-gold/20"
              >
                {t.nav?.joinUs || "Join Us"}
              </Link>

              <button
                onClick={() => navigate("/checkout")}
                className="relative flex items-center gap-2 h-10 px-3 lg:px-4 bg-gold text-primary font-bold text-sm rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-gold/20"
              >
                <ShoppingBag size={18} />
                <span className="hidden lg:inline">
                  {t.nav?.cart || "Cart"}
                </span>

                {cartCount > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center px-1 font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center size-10 rounded-xl bg-white/10 text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex flex-col pt-20 px-6 gap-2">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 text-white size-10 flex items-center justify-center"
          >
            <X size={24} />
          </button>

          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-black text-white/80 hover:text-gold transition-colors py-3 border-b border-white/10"
            >
              {link.label}
            </Link>
          ))}

          <div className="flex flex-col gap-3 mt-6">
            {isCustomer ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 h-12 bg-gold text-primary font-bold rounded-xl"
                >
                  <User size={18} />
                  {t.nav?.myProfile || "My Profile"}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center justify-center gap-2 h-12 border border-white/20 text-white font-bold rounded-xl disabled:opacity-60"
                >
                  {isLoggingOut ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <LogOut size={18} />
                  )}
                  {t.nav?.signOut || "Sign Out"}
                </button>
              </>
            ) : isBackOfficeUser ? (
              <>
                <Link
                  to={getDashboardPathByRole(userRole)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center h-12 bg-gold text-primary font-bold rounded-xl"
                >
                  {t.nav?.dashboard || "Dashboard"}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center justify-center gap-2 h-12 border border-white/20 text-white font-bold rounded-xl disabled:opacity-60"
                >
                  {isLoggingOut ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <LogOut size={18} />
                  )}
                  {t.nav?.signOut || "Sign Out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center h-12 border border-white/20 text-white font-bold rounded-xl"
                >
                  {t.nav?.signIn || "Sign In"}
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center h-12 bg-gold text-primary font-bold rounded-xl"
                >
                  {t.nav?.joinUs || "Join Us"}
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-primary text-white px-4 lg:px-20 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-gold/20 text-gold flex items-center justify-center border border-gold/30">
                <Coffee size={22} />
              </div>
              <span className="text-2xl font-black">Capital Fashion</span>
            </div>

            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              {t.footer?.brandDesc ||
                "Authentic Vietnamese coffee culture, served fresh at 24 locations and growing."}
            </p>

            <div className="flex items-center gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-gold fill-gold" />
              ))}
              <span className="text-sm text-white/60 ml-2">
                {t.footer?.reviews || "4.8 · 10,000+ reviews"}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-gold uppercase text-xs tracking-widest">
              {t.footer?.company || "Company"}
            </h4>

            <ul className="space-y-2">
              {[
                { label: t.footer?.aboutUs || "About Us", href: "#" },
                { label: t.footer?.franchise || "Franchise", href: "#" },
                { label: t.footer?.careers || "Careers", href: "#" },
                { label: t.footer?.press || "Press", href: "#" },
              ].map((i) => (
                <li key={i.label}>
                  <a
                    href={i.href}
                    className="text-white/60 hover:text-gold text-sm transition-colors"
                  >
                    {i.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-gold uppercase text-xs tracking-widest">
              {t.footer?.support || "Support"}
            </h4>

            <ul className="space-y-2">
              {[
                { label: t.footer?.helpCenter || "Help Center", href: "#" },
                { label: t.footer?.contactUs || "Contact Us", href: "#" },
                {
                  label: t.footer?.privacyPolicy || "Privacy Policy",
                  href: "#",
                },
                { label: t.footer?.terms || "Terms", href: "#" },
              ].map((i) => (
                <li key={i.label}>
                  <a
                    href={i.href}
                    className="text-white/60 hover:text-gold text-sm transition-colors"
                  >
                    {i.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
          <p className="text-white/40 text-xs">
            {t.footer?.rights || "© 2025 Capital Coffee. All rights reserved."}
          </p>

          <Link
            to="/admin/login"
            className="text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            {t.footer?.staffPortal || "Staff Portal"}
          </Link>
        </div>
      </footer>
    </div>
  );
}