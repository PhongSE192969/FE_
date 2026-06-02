import {
  Award,
  Brain,
  Calendar,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingBag,
  UserCog,
  Users
} from "lucide-react";

export const storeManagerNavigation = {
  color: "from-[#0f172a] to-[#1e3a5f]",
  accent: "#d9a13b",
  title: "Store Manager Panel",
  items: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/store-manager" },
    {
      icon: Users,
      label: "Users",
      href: "/store-manager/users",
      children: [
        { icon: Users, label: "Staff", href: "/store-manager/users/staff" },
        { icon: Users, label: "Customers", href: "/store-manager/users/customers" }
      ]
    },
    { icon: UserCog, label: "Shift Schedule", href: "/store-manager/shift-schedule" },
    {
      icon: Package,
      label: "Catalog",
      href: "/store-manager/catalog",
      children: [
        { icon: Package, label: "Products", href: "/store-manager/catalog/products" },
        { icon: Package, label: "Categories", href: "/store-manager/catalog/categories" },
      ]
    },
    { icon: Package, label: "Inventories", href: "/store-manager/inventory" },
    { icon: ShoppingBag, label: "Orders", href: "/store-manager/orders" },
    { icon: Award, label: "Promotions", href: "/store-manager/promotions" },
  ],
};