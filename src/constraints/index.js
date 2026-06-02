import {
  adminNavigation,
  managerNavigation,
  staffNavigation,
  storeManagerNavigation,
} from "@/navigations";

export const ROLES = {
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
  STORE_MANAGER: "STORE_MANAGER",
  STAFF: "STAFF",
  CUSTOMER: "CUSTOMER",
};

export const ROLE_ROUTES = {
  MANAGER: "/manager",
  ADMIN: "/admin",
  STORE_MANAGER: "/store-manager",
  STAFF: "/staff",
  CUSTOMER: "/",
};

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  SHIPPING: "shipping",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const PRODUCT_CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "signature-coffee", label: "Signature Coffee" },
  { id: "freeze-tea", label: "Freeze & Tea" },
  { id: "banh-mi-food", label: "Banh Mi & Food" },
  { id: "pastries", label: "Pastries" },
];

export const ICE_OPTIONS = [
  "Regular Ice",
  "Less Ice",
  "No Ice",
  "Extra Ice",
];

export const SUGAR_OPTIONS = [
  "Regular Sugar",
  "Less Sugar",
  "No Sugar",
  "Extra Sugar",
];

export const SIZE_OPTIONS = [
  { id: "S", label: "Small", price: 0 },
  { id: "M", label: "Medium", price: 0.5 },
  { id: "L", label: "Large", price: 1.0 },
];

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "jp", label: "日本語", flag: "🇯🇵" },
];

export const NAV_CONFIG = {
  manager: managerNavigation,
  admin: adminNavigation,
  storeManager: storeManagerNavigation,
  staff: staffNavigation,
};

export const AVAILABLE_COLORS = [
  "WHITE",
  "BLACK",
  "RED",
  "BLUE",
  "YELLOW",
  "GREEN",
];

export const AVAILABLE_SIZES = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
];

// ============================================
// SHIFT CONSTANTS
// ============================================

export const SHIFT_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  CHECK_IN: "check-in",
  CHECK_OUT: "check-out",
  ABSENT: "absent",
};

export const SHIFT_STATUS_LABELS = {
  active: "Hoạt động",
  paused: "Tạm dừng",
  "check-in": "Check-in",
  "check-out": "Check-out",
  absent: "Vắng mặt",
};

export const SHIFT_STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  paused: "bg-gray-100 text-gray-600",
  "check-in": "bg-blue-100 text-blue-700",
  "check-out": "bg-yellow-100 text-yellow-700",
  absent: "bg-red-100 text-red-700",
};

export const SHIFT_TYPES = [
  {
    value: "Ca sáng",
    label: "Ca sáng",
    time: "06:00 - 14:00",
    initial: "S",
  },
  {
    value: "Ca chiều",
    label: "Ca chiều",
    time: "14:00 - 22:00",
    initial: "C",
  },
  {
    value: "Ca tối",
    label: "Ca tối",
    time: "22:00 - 06:00",
    initial: "T",
  },
];

export const BRANCHES = [
  "Chi nhánh Quận 1",
  "Chi nhánh Quận 3",
  "Chi nhánh Quận 7",
  "Chi nhánh Bình Thạnh",
  "Chi nhánh Thủ Đức",
  "Chi nhánh Gò Vấp",
];

export const PAGE_SIZE = 5;

export const SHIFT_AVATAR_COLORS = {
  S: "bg-blue-500",
  C: "bg-amber-500",
  T: "bg-purple-500",
};

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  OPTION: "OPTION",
};