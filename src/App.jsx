// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Customer Pages
import HomePage from "./pages/customer/HomePage";
import ProductsPage from "./pages/customer/ProductsPage";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import ProfilePage from "./pages/customer/ProfilePage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderSuccessPage from "./pages/customer/OrderSuccessPage";
import OrderDetailPage from "./pages/customer/OrderDetailPage";
import CheckoutInfoPage from "./pages/customer/CheckoutInfoPage";
import CheckoutPaymentPage from "./pages/customer/CheckoutPaymentPage";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ConfirmForgotPasswordPage from "./pages/auth/ConfirmForgotPasswordPage";

// Manager Pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import CustomerManager from "./pages/manager/CustomerManager";
import ProductManager from "./pages/manager/ProductManager";
import CategoryManager from "./pages/manager/CategoryManager";
import InventoryManager from "./pages/manager/InventoryManager";
import ShiftSchedule from "./pages/manager/ShiftSchedule";
import StaffManager from "./pages/manager/StaffManager";
import LoyaltyReport from "./pages/manager/LoyaltyReport";
import ManagerOrder from "./pages/manager/ManagerOrder";
import PromotionManager from "./pages/manager/PromotionManager";
import FranchiseManager from "./pages/manager/FranchiseManager";

// Store Manager Pages
import StaffStoreManager from "./pages/storeManager/StaffStoreManager";
import CategoryStoreManager from "./pages/storeManager/CategoryStoreManager";
import CustomerStoreManager from "./pages/storeManager/CustomerStoreManager";
import StoreManagerDashboard from "./pages/storeManager/StoreManagerDashboard";
import PromotionStoreManager from "./pages/storeManager/PromotionStoreManager";
import OrderStoreManagement from "./pages/storeManager/OrderStoreManagement";
import ProductStoreManager from "./pages/storeManager/ProductStoreManager";
import InventoryStoreManager from "./pages/storeManager/InventoryStoreManager";
import ShiftScheduleStoreManager from "./pages/storeManager/ShiftScheduleStoreManager";

// Staff Pages
import CreateOrder from "./pages/staff/CreateOrder";
import OrderStatus from "./pages/staff/OrderManagement";
import CreateCustomer from "./pages/staff/CreateCustomer";
import CheckOut from "./pages/staff/CheckOut";
import CustomerManagement from "./pages/staff/CustomerManagement";
import MyShift from "./pages/staff/MyShift";
import PosOrderSuccessPage from "./pages/staff/PosOrderSuccessPage";

// Admin Pages
import UserManagement from "./pages/admin/UserManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import CustomersManagement from "./pages/admin/CustomersManagement";
import FranchiseManagement from "./pages/admin/FranchiseManagement";
import InventoryManagement from "./pages/admin/InventoryManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import LoyaltyManagement from "./pages/admin/LoyaltyManagement";
import PromotionManagement from "./pages/admin/PromotionManagement";
import AISettingsManagement from "./pages/admin/AISettingsManagement";

// Layouts
import CustomerLayout from "./layouts/CustomerLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

// Store / Services
import { useAuthStore } from "./stores";
import { GetProfile, Logout } from "./services";

function App() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyUserSession = async () => {
      const authStore = useAuthStore.getState();
      const currentAuthStatus = authStore.isAuthenticated;
      const login = authStore.login;
      const logout = authStore.logout;

      if (currentAuthStatus) {
        try {
          const res = await GetProfile();
          console.log("Check session res: ", res);

          const user = res?.data || res?.user || res;

          if (user?.id) {
            login(user);

            const roleName = user?.role?.name || user?.role;

            if (String(roleName).toUpperCase() === "CUSTOMER") {
              import("@/stores/cartStore").then((m) => {
                m.useCartStore.getState().fetchCart?.(user.id);
              });
            }

            console.log("Check session success");
          } else {
            console.log("Check session failed: missing user");
            logout();
            await Logout();
          }
        } catch (error) {
          console.log("Check session failed", error);
          logout();
          await Logout();
        }
      }

      setCheckingAuth(false);
    };

    verifyUserSession();
  }, []);

  if (checkingAuth) {
    return null;
  }

  return (
    <Routes>
      {/* CUSTOMER SITE */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/checkout-info" element={<CheckoutInfoPage />} />
        <Route path="/checkout-payment" element={<CheckoutPaymentPage />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute role="CUSTOMER">
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* AUTH */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/forgot-password/confirm"
        element={<ConfirmForgotPasswordPage />}
      />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* MANAGER ROUTES - Tổng công ty, quyền cao nhất */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute role="MANAGER">
            <DashboardLayout role="MANAGER" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerDashboard />} />
        <Route path="orders" element={<ManagerOrder />} />
        <Route path="catalog/products" element={<ProductManager />} />
        <Route path="catalog/categories" element={<CategoryManager />} />
        <Route path="inventory" element={<InventoryManager />} />
        <Route path="promotions" element={<PromotionManager />} />
        <Route path="shift/staff" element={<StaffManager />} />
        <Route path="shift/schedule" element={<ShiftSchedule />} />
        <Route path="customers-loyalty/loyalty" element={<LoyaltyReport />} />
        <Route path="franchises" element={<FranchiseManager />} />
        <Route
          path="customers-loyalty/customers"
          element={<CustomerManager />}
        />
      </Route>

      {/* ADMIN ROUTES - Quản trị user/role/store manager */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <DashboardLayout role="ADMIN" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/identity/users" replace />} />
        <Route path="identity/users" element={<UserManagement />} />
        <Route path="identity/roles" element={<RoleManagement />} />
        <Route path="franchises" element={<FranchiseManagement />} />
        <Route path="inventories" element={<InventoryManagement />} />
        <Route path="catalog/products" element={<ProductManagement />} />
        <Route path="catalog/categories" element={<CategoryManagement />} />
        <Route path="promotions" element={<PromotionManagement />} />
        <Route path="ai-settings" element={<AISettingsManagement />} />

        <Route
          path="customers-loyalty/customers"
          element={<CustomersManagement />}
        />
        <Route
          path="customers-loyalty/loyalty"
          element={<LoyaltyManagement />}
        />

        <Route
          path="catalog"
          element={<Navigate to="/admin/catalog/products" replace />}
        />
        <Route
          path="identity"
          element={<Navigate to="/admin/identity/users" replace />}
        />
        <Route
          path="customers-loyalty"
          element={<Navigate to="/admin/customers-loyalty/customers" replace />}
        />
      </Route>

      {/* STORE MANAGER ROUTES - Quản lý 1 store/franchise */}
      <Route
        path="/store-manager"
        element={
          <ProtectedRoute role="STORE_MANAGER">
            <DashboardLayout role="STORE_MANAGER" />
          </ProtectedRoute>
        }
      >
        <Route index element={<StoreManagerDashboard />} />
        <Route path="users/staff" element={<StaffStoreManager />} />
        <Route path="users/customers" element={<CustomerStoreManager />} />
        <Route path="shift-schedule" element={<ShiftScheduleStoreManager />} />
        <Route path="catalog/products" element={<ProductStoreManager />} />
        <Route path="catalog/categories" element={<CategoryStoreManager />} />
        <Route path="orders" element={<OrderStoreManagement />} />
        <Route path="promotions" element={<PromotionStoreManager />} />
        <Route path="inventory" element={<InventoryStoreManager />} />
      </Route>

      {/* STAFF ROUTES */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute role="STAFF">
            <DashboardLayout role="STAFF" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/staff/new-order" replace />} />
        <Route path="new-order" element={<CreateOrder />} />
        <Route path="queue" element={<OrderStatus />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="my-shift" element={<MyShift />} />
        <Route path="checkout" element={<CheckOut />} />
        <Route path="create-customer" element={<CreateCustomer />} />
        <Route path="order-success" element={<PosOrderSuccessPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;