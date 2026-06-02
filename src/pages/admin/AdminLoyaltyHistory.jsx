import { useState, useEffect } from "react";
import { loyaltyApi } from "@/services/loyaltyApi";
import { formatCurrency } from "@/utils/helpers";

// Component này nhận vào prop là customerId (từ trang Chi tiết khách hàng)
export default function AdminLoyaltyHistory({ customerId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchHistory();
    }
  }, [customerId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await loyaltyApi.getCustomerTransactions(customerId);
      const txData = res?.data?.data || res?.data || [];
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (error) {
      console.error("Lỗi tải lịch sử admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "EARN":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "REDEEM":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "REFUND":
        return "bg-sky-50 text-sky-700 border border-sky-200";
      case "REVOKE":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  if (loading)
    return (
      <div className="h-full min-h-[280px] rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/50 to-lime-50/60 p-8 shadow-sm">
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-emerald-100/70" />
          </div>

          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Đang tải dữ liệu điểm khách hàng
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Hệ thống đang đồng bộ lịch sử giao dịch franchise...
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_18px_45px_rgba(15,118,110,0.08)] flex flex-col">
      {/* HEADER */}
      <div className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-r from-emerald-900 via-emerald-800 to-lime-700 px-6 py-5 shrink-0">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lime-300/20 blur-2xl" />
        <div className="absolute bottom-0 right-20 h-20 w-20 rounded-full bg-white/10 blur-xl" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-lime-100 ring-1 ring-white/15">
              Franchise Fertilizer
            </div>

            <h3 className="text-lg font-black tracking-tight text-white">
              Lịch sử Biến động Ví Điểm
            </h3>

            <p className="mt-1 text-sm text-emerald-50/80">
              Theo dõi điểm tích lũy, hoàn điểm và thu hồi điểm của khách hàng
            </p>
          </div>

          <div className="rounded-2xl bg-white/12 px-4 py-3 text-right ring-1 ring-white/15 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-lime-100">
              Tổng giao dịch
            </p>
            <p className="mt-1 text-2xl font-black text-white">
              {transactions.length}
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div className="grid grid-cols-1 gap-3 border-b border-emerald-100 bg-emerald-50/40 px-6 py-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Trạng thái dữ liệu
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-800">
            Đã đồng bộ
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Nhóm giao dịch
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-800">
            Tích điểm / Sử dụng / Hoàn / Thu hồi
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Kênh quản lý
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-800">
            Franchise phân bón
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-y-auto bg-white">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="sticky top-0 z-10 border-b border-emerald-100 bg-white/95 text-[11px] font-black uppercase tracking-wider text-emerald-900 shadow-sm backdrop-blur">
            <tr>
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Loại</th>
              <th className="px-6 py-4 text-right">Biến động</th>
              <th className="px-6 py-4 text-right">Số dư sau</th>
              <th className="px-6 py-4">Mã đơn hàng</th>
              <th className="px-6 py-4">Chi tiết</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-emerald-50">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-16">
                  <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                      🌱
                    </div>

                    <p className="text-sm font-bold text-emerald-900">
                      Chưa có giao dịch điểm
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Khách hàng này chưa phát sinh giao dịch tích điểm, đổi điểm
                      hoặc hoàn điểm trong hệ thống.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                // Format lại thời gian bằng Vanilla JS
                const txDate = new Date(tx.createdAt);
                const formattedDate = `${txDate.toLocaleDateString("vi-VN")} ${txDate.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`;

                // Xử lý mã Order ID
                const shortOrderId =
                  tx.orderId && tx.orderId !== "null"
                    ? tx.orderId.substring(0, 8).toUpperCase()
                    : "";
                const absPoints = Math.abs(tx.points);

                // LOGIC DỊCH SANG TIẾNG VIỆT TỰ ĐỘNG (cắt bỏ đuôi #... mặc định của BE)
                let baseDescription = (
                  tx.reason ||
                  tx.description ||
                  ""
                ).replace(/ #[A-Za-z0-9\-]+/, "");
                let displayReason = "";

                if (tx.type === "EARN" && shortOrderId) {
                  displayReason = `Tích lũy ${absPoints} điểm từ đơn hàng`;
                } else if (tx.type === "REDEEM" && shortOrderId) {
                  displayReason = `Sử dụng ${absPoints} điểm cho đơn hàng`;
                } else if (tx.type === "REFUND" && shortOrderId) {
                  displayReason = `Hoàn ${absPoints} điểm từ đơn hủy`;
                } else if (tx.type === "REVOKE" && shortOrderId) {
                  displayReason = `Thu hồi ${absPoints} điểm từ đơn trả`;
                } else {
                  displayReason = baseDescription || "Giao dịch hệ thống";
                }

                return (
                  <tr
                    key={tx.id}
                    className="group transition-colors hover:bg-emerald-50/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {formattedDate}
                        </span>
                        <span className="mt-0.5 text-[11px] text-slate-400">
                          Cập nhật ví điểm
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${getTypeStyle(
                          tx.type
                        )}`}
                      >
                        {tx.type}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-black whitespace-nowrap">
                      <span
                        className={`inline-flex min-w-[72px] justify-end rounded-xl px-3 py-1.5 ${
                          tx.points > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {tx.points > 0 ? "+" : ""}
                        {tx.points}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-slate-900">
                        {tx.balanceAfter}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {shortOrderId ? (
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600">
                          #{shortOrderId}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td
                      className="max-w-xs px-6 py-4 text-slate-500"
                      title={displayReason}
                    >
                      <div className="truncate rounded-xl bg-slate-50 px-3 py-2 text-sm transition-colors group-hover:bg-white">
                        {displayReason}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}