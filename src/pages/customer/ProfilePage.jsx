import { useState, useEffect } from "react";
import {
  User,
  Star, // Có thể xóa nếu không dùng ở nơi khác
  ShoppingBag,
  Edit2,
  Save,
  X,
  Phone,
  Mail,
  Award,
  Clock,
  KeyIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { formatCurrency, formatDate } from "@/utils/helpers";
import toast from "react-hot-toast";
import { loyaltyApi } from "@/services/loyaltyApi";
import { getPromotions } from "@/services/promotionService"; // Có thể xóa nếu không dùng
import { PaginationControls } from "@/components/ui";
import { useNavigate } from "react-router-dom";
import { getOrdersByCustomer } from "@/services/orderService";
import { ChangePasswordModal } from "@/components/modal";
import { ChangePassword, UpdateProfile } from "@/services";

export default function ProfilePage() {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).customer?.profile || {};
  const [redeemingId, setRedeemingId] = useState(null); // Có thể giữ lại hoặc xóa
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("orders");

  // STATE PHÂN TRANG
  const [orderPage, setOrderPage] = useState(1);
  const [pointPage, setPointPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [transactions, setTransactions] = useState([]);
  const [benefits, setBenefits] = useState(null);
  const [promotions, setPromotions] = useState([]); // Có thể giữ lại hoặc xóa
  const [orders, setOrders] = useState([]);
  const [totalOrderPages, setTotalOrderPages] = useState(1);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [form, setForm] = useState({
    username: user?.username || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: user?.gender ?? true,
  });

  // 👇 ĐÃ XÓA TAB REWARDS Ở ĐÂY
  const tabHeader = [
    {
      id: "orders",
      label: t.tabs?.orders || "Order History",
      icon: ShoppingBag,
    },
    { id: "points", label: t.tabs?.points || "Points History", icon: Clock },
  ];

  const userAttribute = [
    {
      icon: User,
      label: t.attributes?.fullName || "Full Name",
      key: "fullName",
      editable: true,
    },
    {
      icon: User,
      label: t.attributes?.username || "Username",
      key: "username",
      editable: false,
    },
    {
      icon: Mail,
      label: t.attributes?.email || "Email",
      key: "email",
      editable: false,
    },
    {
      icon: Phone,
      label: t.attributes?.phone || "Phone",
      key: "phone",
      editable: false,
    },
    {
      icon: User,
      label: t.attributes?.gender || "Gender",
      key: "gender",
      editable: true,
    },
  ];
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const customerId = user?.id;
  const franchiseId = user?.franchiseId;

  // LOGIC PHÂN TRANG CHO ORDERS
  const currentOrders = orders;

  // LOGIC PHÂN TRANG CHO POINTS HISTORY
  const totalPointPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const currentPoints = transactions.slice(
    (pointPage - 1) * ITEMS_PER_PAGE,
    pointPage * ITEMS_PER_PAGE,
  );

  const totalSpent = orders.reduce(
    (sum, o) => sum + Number(o.totalDue || 0),
    0,
  );

  const currentPointsBalance = benefits?.currentPoints || 0;
  const currentTier = benefits?.currentTier || "MEMBER";

  // Hàm handleRedeem đã được rút gọn lại

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        fullName: form.fullName,
        gender: form.gender,
      };

      const response = await UpdateProfile(payload);

      if (response.statusCode === 200) {
        updateUser({
          ...user,
          fullName: form.fullName,
          gender: form.gender,
        });

        toast.success(
          t.toasts?.successProfile || "Profile updated successfully!",
        );
        setEditing(false);
      } else {
        toast.error(
          response.message ||
            t.toasts?.failedProfile ||
            "Failed to update profile!",
        );
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error(
        error.message ||
          t.toasts?.failedProfile ||
          "An error occurred while updating profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const tAuth =
      (translations[language] || translations.vi).auth?.confirmPassword || {};
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(tAuth.toasts?.matchError || "Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      const payload = {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      };
      const response = await ChangePassword(payload);

      if (response.statusCode == 200) {
        toast.success(
          t.changePassword?.success || "Cập nhật mật khẩu thành công!",
        );
        setIsPasswordModalOpen(false);
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(
          response.message ||
            t.changePassword?.failed ||
            "Đổi mật khẩu thất bại!",
        );
      }
    } catch (error) {
      toast.error(
        t.changePassword?.error || "Đã có lỗi xảy ra khi đổi mật khẩu!",
      );
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await getOrdersByCustomer(
        customerId,
        statusFilter === "all" ? null : statusFilter,
        orderPage - 1,
        ITEMS_PER_PAGE,
      );

      const data = res.data?.data || res.data;

      setOrders(data?.content || []);
      setTotalOrderPages(data?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchLoyaltyData = async () => {
    try {
      const [transRes, benefitsRes] = await Promise.all([
        loyaltyApi.getCustomerTransactions(customerId),
        loyaltyApi.getCustomerTierInfo(customerId, franchiseId), // Đã sửa API call
      ]);

      const rawTx = transRes.data?.data || [];

      const uniqueTx = rawTx.filter(
        (tx, index, self) =>
          index ===
            self.findIndex(
              (t) =>
                t.orderId === tx.orderId &&
                t.type === tx.type &&
                t.orderId !== null,
            ) || tx.orderId === null,
      );

      setTransactions(transRes.data?.data || []);
      setBenefits(benefitsRes.data?.data || null);
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    }
  };

  useEffect(() => {
    if (customerId && customerId.length === 36) {
      fetchOrders();
    }
  }, [customerId, statusFilter, orderPage]);

  useEffect(() => {
    if (customerId && customerId.length === 36) {
      fetchLoyaltyData();
    }
  }, [customerId]);

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary to-[#1e3a5f] text-white px-4 lg:px-20 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="avatar"
              className="size-24 rounded-full border-4 border-gold object-cover shadow-xl shadow-gold/30"
            />
          ) : (
            <div className="size-24 rounded-full bg-gold flex items-center justify-center text-primary font-black text-4xl shadow-xl shadow-gold/30">
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black">
              {user?.fullName || "Customer Name"}
            </h1>
            <p className="text-white/60 mt-1">{user?.email}</p>
            <div className="flex items-center gap-3 mt-3 justify-center md:justify-start">
              <span className="flex items-center gap-1 bg-gold/20 text-gold border border-gold/30 rounded-full px-3 py-1 text-xs font-bold uppercase">
                <Award size={12} /> {currentTier}
              </span>
              <span className="text-white/60 text-sm">
                {t.memberSince || "Member since"}{" "}
                {formatDate(user?.createdAt || "2023-01-15")}
              </span>
            </div>
          </div>
          <div className="md:ml-auto grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-black text-gold">
                {currentPointsBalance}
              </div>
              <div className="text-white/60 text-xs mt-1">
                {t.points || "Points"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-black">{orders.length}</div>
              <div className="text-white/60 text-xs mt-1">
                {t.orders || "Orders"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-black">
                {formatCurrency(totalSpent)}
              </div>
              <div className="text-white/60 text-xs mt-1">
                {t.totalSpent || "Total Spent"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-20 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card*/}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
            {" "}
            {/* Đã thêm h-fit */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-lg text-primary">
                {t.title || "My Profile"}
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-primary"
                >
                  {t.edit || "Edit"} <Edit2 size={14} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700 ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSaving ? (
                      <span className="size-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {t.save || "Save"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-4 flex flex-col justify-start">
              {" "}
              {/* Bỏ min-h */}{" "}
              {userAttribute.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                    <field.icon size={12} /> {field.label}
                  </label>
                  {editing ? (
                    <>
                      {field.key === "gender" ? (
                        <select
                          value={form.gender}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              gender: e.target.value === "true",
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-primary bg-gray-50"
                        >
                          <option value="true">
                            {t.genderOptions?.male || "Male"}
                          </option>
                          <option value="false">
                            {t.genderOptions?.female || "Female"}
                          </option>
                        </select>
                      ) : (
                        <input
                          value={form[field.key]}
                          onChange={(e) =>
                            setForm({ ...form, [field.key]: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-primary bg-gray-50"
                          disabled={!field.editable}
                        />
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-primary py-2.5 px-3 bg-gray-50 rounded-xl">
                      {field.key === "gender"
                        ? form.gender
                          ? t.genderOptions?.male || "Male"
                          : t.genderOptions?.female || "Female"
                        : form[field.key] || "—"}
                    </p>
                  )}
                </div>
              ))}
              {/* change password */}
              <div className="flex items-center gap-2 mt-4">
                <KeyIcon size={12} className="text-red-400" />
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="text-start px-3 py-2 rounded-xl text-sm font-medium focus:text-red-500 hover:text-red-500 transition"
                >
                  {t.changePassword?.button || "Change Password"}
                </button>
              </div>
            </div>
          </div>

          {/* 3 TABS CONTAINER */}
          {/* 👇 ĐÃ THÊM min-h-[850px] ĐỂ KHỐI NÀY DÀI RA 👇 */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[850px] flex flex-col">
            {/* TABS HEADER */}
            <div className="flex border-b border-gray-100">
              {tabHeader.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-primary text-primary bg-gray-50/50"
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon size={16} />{" "}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Thêm flex-1 để nội dung chiếm hết khoảng trống bên dưới header */}
            <div className="p-6 flex-1 flex flex-col">
              {/* TAB 1: ORDER HISTORY */}
              {activeTab === "orders" && (
                <div className="flex flex-col h-full">
                  {/* FILTER */}
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex gap-2 flex-wrap">
                      {[
                        {
                          label: t.ordersTab?.filters?.all || "Tất cả",
                          value: "all",
                        },
                        {
                          label:
                            t.ordersTab?.filters?.waiting_for_confirmation ||
                            "Chờ xác nhận",
                          value: "WAITING_FOR_CONFIRMATION",
                        },
                        {
                          label:
                            t.ordersTab?.filters?.preparing || "Đang chuẩn bị",
                          value: "PREPARING",
                        },
                        {
                          label: t.ordersTab?.filters?.shipping || "Đang giao",
                          value: "SHIPPING",
                        },
                        {
                          label:
                            t.ordersTab?.filters?.completed || "Hoàn thành",
                          value: "COMPLETED",
                        },
                        {
                          label: t.ordersTab?.filters?.cancelled || "Đã hủy",
                          value: "CANCELLED",
                        },
                      ].map((f) => (
                        <button
                          key={f.value}
                          onClick={() => {
                            setStatusFilter(f.value);
                            setOrderPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                            statusFilter === f.value
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-xs text-gray-400 font-semibold">
                      {t.ordersTab?.count
                        ? t.ordersTab.count.replace("{count}", orders.length)
                        : `${orders.length} đơn hàng`}
                    </span>
                  </div>

                  {/* ORDER LIST */}
                  <div className="space-y-4 flex-1">
                    {currentOrders.map((order) => {
                      const statusConfig = {
                        waiting_for_confirmation: {
                          label:
                            t.ordersTab?.filters?.waiting_for_confirmation ||
                            "Chờ xác nhận",
                          class:
                            "bg-amber-100 text-amber-800 border-amber-200 shadow-sm",
                        },
                        waiting_payment: {
                          label:
                            t.ordersTab?.filters?.waiting_for_confirmation ||
                            "Chờ xác nhận",
                          class:
                            "bg-amber-100 text-amber-800 border-amber-200 shadow-sm",
                        },
                        preparing: {
                          label:
                            t.ordersTab?.filters?.preparing || "Đang chuẩn bị",
                          class:
                            "bg-indigo-100 text-indigo-800 border-indigo-200 shadow-sm",
                        },
                        shipping: {
                          label: t.ordersTab?.filters?.shipping || "Đang giao",
                          class:
                            "bg-blue-100 text-blue-800 border-blue-200 shadow-sm",
                        },
                        completed: {
                          label:
                            t.ordersTab?.filters?.completed || "Hoàn thành",
                          class:
                            "bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm",
                        },
                        cancelled: {
                          label: t.ordersTab?.filters?.cancelled || "Đã hủy",
                          class:
                            "bg-rose-100 text-rose-800 border-rose-200 shadow-sm",
                        },
                        failed_order: {
                          label:
                            t.ordersTab?.filters?.failed_order || "Thất bại",
                          class:
                            "bg-red-100 text-red-800 border-red-200 shadow-sm",
                        },
                        failed_payment: {
                          label:
                            t.ordersTab?.filters?.failed_order || "Thất bại",
                          class:
                            "bg-red-100 text-red-800 border-red-200 shadow-sm",
                        },
                        refunded: {
                          label:
                            t.ordersTab?.filters?.refunded || "Đã hoàn tiền",
                          class:
                            "bg-gray-200 text-gray-800 border-gray-300 shadow-sm",
                        },
                      };

                      const currentStatus =
                        order.orderStatus?.toLowerCase() || "created";
                      const config = statusConfig[currentStatus] || {
                        label: order.orderStatus,
                        class:
                          "bg-gray-50 text-gray-600 border border-gray-100",
                      };

                      const itemCount = order.orderDetails?.length || 0;

                      return (
                        <div
                          key={order.id}
                          className="group p-4 rounded-2xl border border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start gap-4">
                            {/* ICON */}
                            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <ShoppingBag size={20} />
                            </div>

                            {/* ORDER INFO */}
                            <div className="flex-1 min-w-0">
                              {/* TOP ROW */}
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-black text-sm text-primary">
                                    {/* Hide Order ID as requested */}
                                  </span>
                                </div>

                                <span className="font-black text-sm text-primary">
                                  {formatCurrency(order.totalDue)}
                                </span>
                              </div>

                              {/* ITEMS */}
                              <p className="text-xs text-gray-500 truncate">
                                {order.orderDetails
                                  ?.map(
                                    (i) =>
                                      `${i.productNameSnapshot} x${i.quantity}`,
                                  )
                                  .join(" · ") ||
                                  t.ordersTab?.noItems ||
                                  "Không có sản phẩm"}
                              </p>

                              {/* BOTTOM ROW */}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3">
                                  <p className="text-xs text-gray-400 font-medium">
                                    {formatDate(order.createAt)} · {itemCount}{" "}
                                    {t.ordersTab?.items || "sản phẩm"}
                                  </p>

                                  <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${config.class}`}
                                  >
                                    {config.label}
                                  </span>
                                </div>

                                <button
                                  onClick={() =>
                                    navigate(`/orders/${order.id}`)
                                  }
                                  className="flex items-center gap-1 text-xs font-bold border border-primary text-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition opacity-0 group-hover:opacity-100"
                                >
                                  {t.ordersTab?.viewDetails || "Xem chi tiết →"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* PAGINATION */}
                  <div className="mt-6">
                    <PaginationControls
                      currentPage={orderPage}
                      totalPages={totalOrderPages}
                      setPage={setOrderPage}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: POINTS HISTORY */}
              {activeTab === "points" && (
                <div className="flex flex-col h-full">
                  <div className="space-y-6 flex-1">
                    {currentPoints.map((tx) => {
                      const txType = tx.type || "MANUAL";
                      const isRedeem = txType === "REDEEM";
                      const isAddition =
                        !isRedeem && (txType === "EARN" || tx.points > 0);

                      const sign = isAddition ? "+" : "";
                      const boxColor = isAddition
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-500";
                      const badgeColor = isAddition
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-red-50 text-red-500 border border-red-200";

                      const shortOrderId =
                        tx.orderId && tx.orderId !== "null"
                          ? tx.orderId.substring(0, 8).toUpperCase()
                          : "";
                      const absPoints = Math.abs(tx.points);

                      let displayReason = "";

                      if (txType === "EARN" && shortOrderId) {
                        displayReason =
                          language === "vi"
                            ? `Tích lũy ${absPoints} điểm từ đơn hàng`
                            : `Earned ${absPoints} points from order`;
                      } else if (txType === "REDEEM" && shortOrderId) {
                        displayReason =
                          language === "vi"
                            ? `Sử dụng ${absPoints} điểm cho đơn hàng`
                            : `Used ${absPoints} points for order`;
                      } else if (txType === "REFUND" && shortOrderId) {
                        displayReason =
                          language === "vi"
                            ? `Hoàn ${absPoints} điểm từ đơn hủy`
                            : `Refunded ${absPoints} points for cancelled order`;
                      } else if (txType === "REVOKE" && shortOrderId) {
                        displayReason =
                          language === "vi"
                            ? `Thu hồi ${absPoints} điểm từ đơn trả`
                            : `Revoked ${absPoints} points from returned order`;
                      } else {
                        displayReason =
                          tx.reason ||
                          tx.description ||
                          (language === "vi"
                            ? "Giao dịch hệ thống"
                            : "System transaction");
                      }

                      return (
                        <div
                          key={tx.id}
                          className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary/20 transition-all"
                        >
                          <div
                            className={`size-12 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${boxColor}`}
                          >
                            {sign}
                            {tx.points}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              {tx.orderId && tx.orderId !== "null" ? (
                                <div className="flex items-center gap-2 pr-2 min-w-0">
                                  <p
                                    className="font-bold text-sm text-primary truncate"
                                    title={displayReason}
                                  >
                                    {displayReason}
                                  </p>

                                  {/* Logic kiểm tra: Đơn có trạng thái CANCELLED hoặc là giao dịch Hoàn/Thu hồi điểm */}
                                  {tx.orderStatus === "CANCELLED" ||
                                  tx.type === "REFUND" ||
                                  tx.type === "REVOKE" ? (
                                    <button
                                      disabled
                                      className="text-[12px] bg-gray-100 text-gray-400 font-bold px-1.5 py-0.5 rounded cursor-not-allowed whitespace-nowrap shrink-0"
                                      title={
                                        language === "vi"
                                          ? "Đơn hàng này đã bị hủy"
                                          : "This order has been cancelled"
                                      }
                                    >
                                      {language === "vi"
                                        ? "Đã hủy 🚫"
                                        : "Cancelled 🚫"}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        navigate(`/orders/${tx.orderId}`)
                                      }
                                      className="text-[12px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded hover:bg-primary hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                      title={
                                        language === "vi"
                                          ? "Xem chi tiết đơn hàng"
                                          : "View order details"
                                      }
                                    >
                                      {t.ordersTab?.viewDetails ||
                                        (language === "vi"
                                          ? "Xem chi tiết ↗"
                                          : "Details ↗")}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <p
                                  className="font-bold text-sm text-primary truncate pr-2"
                                  title={displayReason}
                                >
                                  {displayReason}
                                </p>
                              )}

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${badgeColor}`}
                              >
                                {txType}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock size={12} className="opacity-70" />
                              {language === "vi"
                                ? new Date(tx.createdAt).toLocaleDateString(
                                    "vi-VN",
                                  )
                                : new Date(tx.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                              {" - "}
                              {new Date(tx.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {transactions.length === 0 && (
                      <p className="text-sm text-gray-400 italic text-center py-4">
                        {t.pointsTab?.empty || "No transaction history found."}
                      </p>
                    )}
                  </div>
                  {/* Paginator */}
                  <div className="mt-6">
                    <PaginationControls
                      currentPage={pointPage}
                      totalPages={totalPointPages}
                      setPage={setPointPage}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <ChangePasswordModal
          setIsPasswordModalOpen={setIsPasswordModalOpen}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          handlePasswordSubmit={handlePasswordSubmit}
        />
      )}
    </div>
  );
}
