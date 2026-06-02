import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { revenueChartData } from '../../utils/mockData';
import { useLanguageStore } from '@/stores';
import { translations } from '@/locales';

const periods = ['thisMonth', 'lastMonth', 'thisQuarter', 'thisYear'];

export default function RevenueChart() {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).admin?.dashboard?.revenueChart || {};

  const [period, setPeriod] = useState(periods[0]);
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">
          {t.title || "So Sánh Doanh Thu Chi Nhánh"}
        </h3>

        {/* Period dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t.periods?.[period] || period}
            <ChevronDown size={14} />
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                    p === period ? 'text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {t.periods?.[p] || p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={revenueChartData} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: '#3b82f6' }}
            axisLine={false}
            tickLine={false}
            label={{
              value: t.metrics?.revenue || 'Doanh Thu (Triệu đ)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 11, fill: '#3b82f6' },
              offset: 10,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: '#ef4444' }}
            axisLine={false}
            tickLine={false}
            label={{
              value: t.metrics?.orders || 'Đơn Hàng',
              angle: 90,
              position: 'insideRight',
              style: { fontSize: 11, fill: '#ef4444' },
              offset: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            name={t.metrics?.revenue || "Doanh Thu (Triệu đ)"}
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            barSize={28}
          />
          <Bar
            yAxisId="right"
            dataKey="orders"
            name={t.metrics?.orders || "Đơn Hàng"}
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            barSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
