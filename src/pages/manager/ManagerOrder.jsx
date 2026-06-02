import { useState, useEffect } from "react";
import { formatCurrency } from "../../utils/helpers";
import { getOrdersByStatus, searchOrdersById } from "@/services/orderService";
import { getFranchises } from "@/services/franchiseService";
import {
  Search,
  Eye,
  RefreshCw,
  Package,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import OrderDetailModal from "@/components/order/OrderDetailModal";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

export default function ManagerOrder() {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).orderManagement;
  const staffT = (translations[language] || translations.vi).staff?.orderManagement || {};
  const STATUS_OPTIONS = t.statusOptions;
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [typeOrder, setTypeOrder] = useState("ALL");
  const [franchiseMap, setFranchiseMap] = useState({});

  useEffect(() => {
    const loadFranchises = async () => {
      try {
        const res = await getFranchises();
        const map = {};
        (Array.isArray(res) ? res : []).forEach(f => {
          map[f.id] = f.name || f.franchiseName || f.id;
        });
        setFranchiseMap(map);
      } catch (error) {
        console.error("Failed to fetch franchises:", error);
      }
    };
    loadFranchises();
  }, []);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let response;
      if (keyword.trim() !== "") {
        response = await searchOrdersById(keyword);
        setOrders(response.data || []);
        setTotalPages(1);
      } else {
        response = await getOrdersByStatus(status, typeOrder, page, pageSize);
        setOrders(response.data?.content || []);
        setTotalPages(response.data?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [status, typeOrder, page, pageSize, keyword]);

  const getStatusBadge = (status) => {
    const s = status ? status.toUpperCase() : "CREATED";
    const styles = {
      WAITING_FOR_CONFIRMATION: 'bg-orange-100 text-orange-700 border-orange-200',
      PREPARING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      SHIPPING: 'bg-teal-100 text-teal-700 border-teal-200',
      COMPLETED: 'bg-green-100 text-green-700 border-green-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
      FAILED_ORDER: 'bg-red-100 text-red-700 border-red-200',
      REFUNDED: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return styles[s] || styles.CREATED;
  }

  const getStatusIcon = (status) => {
    const s = status ? status.toUpperCase() : "CREATED";
    switch (s) {
      case 'CREATED': return <Clock size={14} />
      case 'WAITING_FOR_CONFIRMATION': return <Clock size={14} />
      case 'PAID': return <CheckCircle2 size={14} />
      case 'PREPARING': return <Package size={14} />
      case 'SHIPPING': return <CheckCircle2 size={14} />
      case 'COMPLETED': return <CheckCircle2 size={14} />
      case 'CANCELLED':
      case 'FAILED_ORDER':
      case 'FAILED_PAYMENT':
      case 'REFUNDED':
        return <XCircle size={14} />
      default: return <Clock size={14} />
    }
  }

  return (
    <div className="space-y-6 pb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{t.title}</h2>
          <p className="text-gray-500 text-sm italic">{t.subtitle}</p>
        </div>
      </div>


      {/* Filter Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm đơn hàng theo mã đơn"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a13b]/20 transition-all"
              value={keyword}
              onChange={(e) => { setPage(0); setKeyword(e.target.value); }}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 focus:outline-none cursor-pointer"
              value={status}
              onChange={(e) => { setPage(0); setStatus(e.target.value); }}
            >
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <select
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 focus:outline-none cursor-pointer"
              value={typeOrder}
              onChange={(e) => { setPage(0); setTypeOrder(e.target.value); }}
            >
              {t.typeOptions?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              )) || (
                  <>
                    <option value="ALL">All Types</option>
                    <option value="POS">In-Store (POS)</option>
                    <option value="Online">Online Delivery</option>
                  </>
                )}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">{staffT.table?.orderId || "Order ID"}</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">{staffT.modal?.branch || "Chi nhánh"}</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">{staffT.table?.customer || "Customer"}</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">{staffT.table?.total || "Total"}</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">{staffT.table?.time || "Time"}</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">{staffT.table?.status || "Status"}</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase">{staffT.table?.actions || "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-400">
                    <RefreshCw size={48} className="mx-auto mb-3 animate-spin opacity-50" />
                    <p className="font-medium text-black">{t.loading || "Loading orders..."}</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-400">
                    <Package size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium text-black">{t.empty || "No orders found"}</p>
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="group hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-black text-sm font-mono truncate max-w-[120px]">
                    {order.id.startsWith('O') ? order.id : `#${order.id.substring(0, 8)}...`}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-black">
                    {order.franchiseId ? (
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                        {franchiseMap[order.franchiseId] || order.franchiseId}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {order.customerName || t.guest}
                  </td>
                  <td className="px-6 py-4 font-black text-black">
                    {formatCurrency(order.totalDue || 0)}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {order.createAt ? new Date(order.createAt).toLocaleString() : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(order.orderStatus)}`}>
                      {getStatusIcon(order.orderStatus)}
                      {t.statusBadge?.[order.orderStatus] || order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-black hover:text-black/80 font-bold text-sm flex items-center gap-1"
                    >
                      <Eye size={16} />
                      {staffT.table?.view || "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between bg-white px-6 py-4 border-t border-gray-100">
          <div className="text-sm text-gray-500 font-bold">
            Trang <span className="text-[#d9a13b]">{page + 1}</span> / {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${page === i
                  ? 'bg-[#d9a13b] text-white border-[#d9a13b]'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={fetchOrders}
          showActions={true}
          franchiseMap={franchiseMap}
          showBranch={false}
          showOrderIdInHeader={false}
        />
      )}
    </div>
  );
}
