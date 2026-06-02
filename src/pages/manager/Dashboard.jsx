import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, Building2, Award } from 'lucide-react';
import { statsCards, revenueSummaryTable, topProducts, loyalCustomers } from '../../utils/mockData';
import { useLanguageStore } from '../../stores';
import { translations } from '../../locales';
import RevenueChart from '../../components/dashboard/RevenueChart';

const iconMap = {
  1: TrendingUp,
  2: ShoppingCart,
  3: Building2,
};

const colorMap = {
  1: 'bg-blue-50 text-blue-600',
  2: 'bg-green-50 text-green-600',
  3: 'bg-purple-50 text-purple-600',
};

const avatarColorMap = {
  N: 'bg-pink-100 text-pink-600',
  T: 'bg-purple-100 text-purple-600',
  L: 'bg-pink-100 text-pink-600',
};

const rankStyles = {
  Gold: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-500' },
  Silver: { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-400' },
  Bronze: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500' },
};

export default function Dashboard() {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).manager?.dashboard || {};

  const labelMap = {
    1: t.stats?.revenue || "Tổng doanh thu",
    2: t.stats?.orders || "Tổng đơn hàng",
    3: t.stats?.branches || "Số chi nhánh",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statsCards.map((card) => {
          const Icon = iconMap[card.id];
          return (
            <div
              key={card.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[card.id]}`}
              >
                <Icon size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{labelMap[card.id] || card.label}</p>
                <p className="text-xl font-bold text-gray-800">{card.value}</p>
                {card.change && (
                  <p
                    className={`text-xs font-medium mt-0.5 ${
                      card.up === true
                        ? 'text-green-600'
                        : card.up === false
                        ? 'text-red-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {card.change}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Summary Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            {t.table?.title || "Bảng Tổng Hợp Doanh Thu"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">{t.table?.branch || "Chi Nhánh"}</th>
                  <th className="pb-3 font-medium">{t.table?.revenue || "Doanh Tư"}</th>
                  <th className="pb-3 font-medium">{t.table?.orders || "Đơn Hàng"}</th>
                  <th className="pb-3 font-medium">{t.table?.growth || "Tăng Trưởng"}</th>
                </tr>
              </thead>
              <tbody>
                {revenueSummaryTable.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 text-gray-800 font-medium">{row.branch}</td>
                    <td className="py-3 text-gray-600">{row.revenue}</td>
                    <td className="py-3 text-gray-600">{row.orders}</td>
                    <td className="py-3">
                      <span className="text-green-600 font-medium">{row.growth}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Products + Loyal Customers */}
        <div className="space-y-5">
          {/* Top 3 Products */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{t.topProducts?.title || "Top 3 Products"}</h3>
            <div className="space-y-4">
              {topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">{product.price}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {product.sold} {t.topProducts?.sold || "sold"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Loyal Customers */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {t.customers?.title || "Khách hàng Thân Thiết"}
            </h3>
            <div className="space-y-4">
              {loyalCustomers.map((customer) => {
                const rs = rankStyles[customer.rank];
                return (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          avatarColorMap[customer.initial] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {customer.initial}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {customer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.orders} {t.customers?.orders || "đơn hàng"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${rs.bg} ${rs.text}`}
                    >
                      <Award size={13} className={rs.icon} />
                      {customer.rank}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
