import {
  Calendar,
  ClipboardList,
  ShoppingBag,
  UserPlus,
} from "lucide-react";

export const staffNavigation = {
  color: "from-[#2d1b4e] to-[#1a0f30]",
  accent: "#a78bfa",
  title: "Staff Portal",
  items: [
    { icon: Calendar, label: "My Schedule", href: "/staff/my-shift" },
    { icon: ClipboardList, label: "Order Management", href: "/staff/queue" },
    { icon: ShoppingBag, label: "New Order", href: "/staff/new-order" },
    { icon: UserPlus, label: "New Customer", href: "/staff/create-customer" },
  ],
};
