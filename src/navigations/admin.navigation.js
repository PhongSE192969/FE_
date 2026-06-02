import {
  Award,
  Brain,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingBag,
  UserCog,
  Users
} from "lucide-react";

export const adminNavigation = {
  color: "from-[#0f172a] to-[#1e3a5f]",
  accent: "#d9a13b",
  title: "Admin Panel",
  items: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: MapPin, label: "Franchises", href: "/admin/franchises" },
    {
      icon: Users,
      label: "Identity",
      href: "/admin/identity",
      children: [
        { icon: UserCog, label: "Users", href: "/admin/identity/users" },
        { icon: UserCog, label: "Roles & Permissions", href: "/admin/identity/roles" },
      ],
    },
    {
      icon: Package,
      label: "Catalog",
      href: "/admin/catalog",
      children: [
        { icon: Package, label: "Products", href: "/admin/catalog/products" },
        { icon: Package, label: "Categories", href: "/admin/catalog/categories" },
      ]
    },
    { icon: Award, label: "Promotions", href: "/admin/promotions" },
    { icon: Package, label: "Inventories", href: "/admin/inventories" },
    {
      icon: Award,
      label: "Customers & Loyalty",
      href: "/admin/customers-loyalty",
      children: [
        { icon: Package, label: "Customers", href: "/admin/customers-loyalty/customers" },
        { icon: Package, label: "Loyalty Programs", href: "/admin/customers-loyalty/loyalty" },
      ]
    },
    { icon: Brain, label: "AI Settings", href: "/admin/ai-settings" },
  ],
};