import React, { useMemo, useState } from "react";
import {
  X,
  Mail,
  Phone,
  User,
  Calendar,
  Store,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  History,
} from "lucide-react";
import { formatDate } from "@/utils/helpers";
import AdminLoyaltyHistory from "@/pages/admin/AdminLoyaltyHistory";

const CustomerDetailModal = ({ customerData, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const normalizedCustomer = useMemo(() => {
    if (!customerData) return null;

    const user = customerData.user || {};

    return {
      id: customerData.userId || user.id || customerData.id,
      customerFranchiseId: customerData.customerFranchiseId || customerData.id,

      fullName: customerData.fullName || user.fullName || "Guest User",
      username: customerData.username || user.username || "unknown",
      email: customerData.email || user.email || "",
      phone: customerData.phone || user.phone || "",
      gender:
        customerData.gender !== undefined ? customerData.gender : user.gender,
      avatarUrl: customerData.avatarUrl || user.avatarUrl || "",
      verifyEmail:
        customerData.verifyEmail !== undefined
          ? customerData.verifyEmail
          : Boolean(user.verifyEmail),

      status:
        customerData.userStatus ||
        user.status ||
        customerData.status ||
        "ACTIVE",

      createdAt: customerData.createdAt || user.createdAt || null,

      loyaltyInfo:
        customerData.loyaltyInfo ||
        {
          loyaltyTier: customerData.loyaltyTier || "BRONZE",
          currentPoint: customerData.currentPoint ?? 0,
          totalPoint: customerData.totalPoint ?? 0,
        },

      purchasedFranchises: Array.isArray(customerData.purchasedFranchises)
        ? customerData.purchasedFranchises
        : [],
    };
  }, [customerData]);

  if (!normalizedCustomer) return null;

  const renderStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">
            ACTIVE
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold">
            SUSPENDED
          </span>
        );
      case "INACTIVE":
        return (
          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
            INACTIVE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
            {status || "UNKNOWN"}
          </span>
        );
    }
  };

  const loyaltyInfo = normalizedCustomer.loyaltyInfo;
  const purchasedFranchises = normalizedCustomer.purchasedFranchises;

  return (
    <div className="w-full h-full fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
        <div className="relative h-36 bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 size-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors z-10"
          >
            <X size={18} />
          </button>

          <div className="absolute -bottom-8 left-8 flex items-end gap-5">
            <div className="size-28 rounded-3xl bg-white p-1.5 shadow-xl">
              {normalizedCustomer.avatarUrl ? (
                <img
                  src={normalizedCustomer.avatarUrl}
                  alt="Avatar"
                  className="size-full rounded-2xl object-cover bg-gray-100"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="size-full rounded-2xl bg-[#d9a13b] flex items-center justify-center text-4xl font-black text-white">
                  {normalizedCustomer.fullName?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>

            <div className="mb-10 text-white">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold leading-none">
                  {normalizedCustomer.fullName}
                </h3>
                {renderStatusBadge(normalizedCustomer.status)}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-300 tracking-wider">
                  @{normalizedCustomer.username}
                </span>
              </div>

              <div className="text-xs text-slate-300 mt-1 font-mono">
                ID: {normalizedCustomer.id || "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 px-8 border-b border-gray-100 flex gap-6 shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <FileText size={16} /> Thông Tin Chung
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <History size={16} /> Lịch Sử Ví Điểm
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-gray-50/30">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Thông Tin Liên Hệ
                  </h4>

                  <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                        <Mail size={16} />
                      </div>

                      <div className="flex-1 truncate">
                        {normalizedCustomer.email || "Chưa cập nhật"}
                      </div>

                      {normalizedCustomer.verifyEmail ? (
                        <CheckCircle2
                          size={16}
                          className="text-green-500"
                          title="Đã xác thực"
                        />
                      ) : (
                        <XCircle
                          size={16}
                          className="text-red-400"
                          title="Chưa xác thực"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                        <Phone size={16} />
                      </div>
                      <div className="flex-1 truncate">
                        {normalizedCustomer.phone || "Chưa cập nhật"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                        <User size={16} />
                      </div>
                      <div className="flex-1 truncate">
                        {normalizedCustomer.gender === true
                          ? "Nam"
                          : normalizedCustomer.gender === false
                            ? "Nữ"
                            : "Chưa cập nhật"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                        <Calendar size={16} />
                      </div>
                      <div className="flex-1 truncate">
                        Tham gia:{" "}
                        {normalizedCustomer.createdAt
                          ? formatDate(normalizedCustomer.createdAt)
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Thông Tin Tích Điểm
                  </h4>

                  {loyaltyInfo ? (
                    <div className="bg-gradient-to-br from-[#d9a13b]/10 to-transparent p-5 rounded-2xl border border-[#d9a13b]/20 space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                          <Award size={16} className="text-[#d9a13b]" /> Hạng
                          Hiện Tại
                        </span>

                        <span className="px-3 py-1.5 bg-[#d9a13b] text-white text-xs font-black rounded-lg shadow-sm tracking-wider">
                          {loyaltyInfo.loyaltyTier || "BRONZE"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#d9a13b]/10 text-center">
                          <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-wider">
                            Điểm Hiện Có
                          </div>
                          <div className="text-2xl font-black text-[#d9a13b]">
                            {(loyaltyInfo.currentPoint ?? 0).toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                          <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-wider">
                            Tổng Điểm Tích
                          </div>
                          <div className="text-2xl font-black text-gray-700">
                            {(loyaltyInfo.totalPoint ?? 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-white border border-dashed border-gray-200 text-center text-sm text-gray-400 italic font-medium">
                      <Award size={32} className="mx-auto text-gray-300 mb-2" />
                      Khách hàng chưa phát sinh giao dịch tích điểm.
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 pt-6 border-t border-gray-200">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Chi Nhánh Đã Giao Dịch
                </h4>

                {purchasedFranchises.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {purchasedFranchises.map((pf, index) => (
                      <div
                        key={pf.franchise?.id || index}
                        className="flex flex-col p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Store size={18} />
                          </div>

                          <div>
                            <div
                              className="text-sm font-bold text-slate-800 line-clamp-1"
                              title={pf.franchise?.name}
                            >
                              {pf.franchise?.name || "Chi nhánh không xác định"}
                            </div>

                            <div
                              className="text-[10px] text-gray-400 mt-0.5 line-clamp-1"
                              title={pf.franchise?.address}
                            >
                              {pf.franchise?.address || "Chưa có địa chỉ"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto space-y-2 pt-3 border-t border-gray-50">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Clock size={12} /> Đơn đầu:
                            </span>
                            <span className="font-semibold text-slate-700">
                              {pf.firstOrderAt
                                ? formatDate(pf.firstOrderAt)
                                : "--"}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Clock size={12} /> Đơn cuối:
                            </span>
                            <span className="font-semibold text-slate-700">
                              {pf.lastOrderAt
                                ? formatDate(pf.lastOrderAt)
                                : "--"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                    <Store size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400 font-medium italic">
                      Chưa ghi nhận giao dịch tại bất kỳ chi nhánh nào.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="h-full">
              <AdminLoyaltyHistory customerId={normalizedCustomer.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;