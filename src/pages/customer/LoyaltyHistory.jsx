import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { loyaltyApi } from "@/services/loyaltyApi";
import {
  Award,
  TrendingUp,
  TrendingDown,
  History,
  RotateCcw,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs"; // Hoặc moment/date-fns tùy dự án đang dùng

export default function LoyaltyHistory() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchLoyaltyData();
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      // Gọi song song 2 API cho nhanh: 1 lấy Ví, 1 lấy Lịch sử
      const [walletRes, historyRes] = await Promise.all([
        loyaltyApi.getCustomerTierInfo(user.id).catch(() => null),
        loyaltyApi.getTransactionHistory(user.id).catch(() => null),
      ]);

      if (walletRes?.data?.data) {
        setWallet(walletRes.data.data);
      }

      // Xử lý data lịch sử (nếu backend trả về ApiResponse chuẩn thì lấy trong .data)
      const txData = historyRes?.data?.data || historyRes?.data || [];
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (error) {
      console.error("Lỗi tải lịch sử điểm:", error);
      toast.error("Không thể tải dữ liệu điểm lúc này.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm helper để render Icon và Màu sắc tùy theo loại giao dịch
  const getTransactionUI = (type) => {
    switch (type) {
      case "EARN":
        return {
          icon: <TrendingUp size={18} />,
          color: "text-green-600",
          bg: "bg-green-100",
          sign: "+",
        };
      case "REDEEM":
        return {
          icon: <TrendingDown size={18} />,
          color: "text-orange-600",
          bg: "bg-orange-100",
          sign: "",
        };
      case "REFUND":
        return {
          icon: <RotateCcw size={18} />,
          color: "text-blue-600",
          bg: "bg-blue-100",
          sign: "+",
        };
      case "REVOKE":
        return {
          icon: <ShieldAlert size={18} />,
          color: "text-red-600",
          bg: "bg-red-100",
          sign: "",
        };
      default:
        return {
          icon: <History size={18} />,
          color: "text-gray-600",
          bg: "bg-gray-100",
          sign: "",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 font-sans">
      <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <Award className="text-primary" />
        Ví Điểm Thành Viên
      </h2>

      {/* Thẻ Ví Điểm (Tổng quan) */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-gray-900/20 mb-8 relative overflow-hidden">
        {/* Pattern chìm cho đẹp */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-gray-400 font-medium text-sm mb-1 uppercase tracking-wider">
              Hạng hiện tại
            </p>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500">
                {wallet?.loyaltyTier || "BRONZE"}
              </span>
            </div>
          </div>

          <div className="md:text-right border-t md:border-t-0 md:border-l border-gray-700 pt-4 md:pt-0 md:pl-6">
            <p className="text-gray-400 font-medium text-sm mb-1 uppercase tracking-wider">
              Điểm khả dụng
            </p>
            <div className="flex items-center md:justify-end gap-2 text-3xl md:text-4xl font-black text-white">
              <ShoppingBag size={28} className="text-primary opacity-80" />
              {wallet?.currentPoint?.toLocaleString() || 0}
              <span className="text-lg text-gray-400 font-bold">pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lịch sử giao dịch */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History size={20} className="text-gray-500" />
          Lịch sử biến động
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
            <History size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">
              Bạn chưa có giao dịch điểm nào.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const ui = getTransactionUI(tx.type);
              return (
                <div
                  key={tx.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${ui.bg} ${ui.color}`}
                    >
                      {ui.icon}
                    </div>

                    {/* Info */}
                    <div>
                      <p className="font-bold text-gray-900 text-sm sm:text-base">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                        <span className="bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider text-[10px] font-bold">
                          {tx.type}
                        </span>
                        <span>•</span>
                        <span>
                          {dayjs(tx.createdAt).format("HH:mm - DD/MM/YYYY")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <p className={`font-black text-lg sm:text-xl ${ui.color}`}>
                      {ui.sign}
                      {tx.points}
                    </p>
                    <p className="text-xs text-gray-400 font-bold">
                      Dư: {tx.balanceAfter}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
