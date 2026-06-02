// RevenueChart.jsx - Phiên bản hiển thị dữ liệu thật theo thời gian

import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useLanguageStore } from '@/stores';
import { translations } from "@/locales";
import { useMemo, useState, useEffect } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Helpers — try every known date field name the backend may return
const calculateRevenueFromOrders = (orders, days) => {
  const revenueByDate = new Map();
  const now = new Date();
  
  // Initialise all dates in the range
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    revenueByDate.set(d.toISOString().split('T')[0], 0);
  }
  
  // Aggregate revenue per day, tolerating multiple field names
  orders.forEach(order => {
    const rawDate =
      order.createAt   ||
      order.createdAt  ||
      order.date       ||
      order.orderDate  ||
      order.orderTime  ||
      order.updatedAt;

    if (!rawDate) return;

    // Handle both ISO string and epoch milliseconds
    const parsed = typeof rawDate === 'number' ? new Date(rawDate) : new Date(rawDate);
    if (isNaN(parsed)) return;

    const dateKey = parsed.toISOString().split('T')[0];
    const revenue = order.totalRevenue || order.totalDue || order.totalAmount || 0;
    
    if (revenueByDate.has(dateKey)) {
      revenueByDate.set(dateKey, revenueByDate.get(dateKey) + revenue);
    }
  });
  
  return Array.from(revenueByDate.entries())
    .map(([date, totalRevenue]) => ({ date, totalRevenue }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

export default function RevenueChart({ 
  data = [], 
  onFilterChange, 
  currentFilter = '7', 
  isStoreManager = false, 
  type = 'line',
}) {
  const { language } = useLanguageStore();
  
  // Update currentDay every 5 minutes to catch midnight transition for labels
  const [currentDay, setCurrentDay] = useState(() => new Date().toISOString().split('T')[0]);
  useEffect(() => {
    const itv = setInterval(() => {
      const d = new Date().toISOString().split('T')[0];
      if (d !== currentDay) setCurrentDay(d);
    }, 60000); // 1 minute
    return () => clearInterval(itv);
  }, [currentDay]);
  const t = (translations[language] || translations.vi).admin?.dashboard?.charts || {};

  const formatCurrency = (value) => {
    const locale = language === 'en' ? 'en-US' : language === 'jp' ? 'ja-JP' : 'vi-VN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatLabels = (dataArr, days) => {
    return dataArr.map(item => {
      const date = new Date(item.date);
      
      // Nếu > 100 ngày (ví dụ 1 năm), hiển thị theo tháng/năm
      if (days > 100) {
        return date.toLocaleDateString(language === 'en' ? 'en-US' : language === 'jp' ? 'ja-JP' : 'vi-VN', {
          month: 'short',
          year: 'numeric'
        });
      }
      
      // Nếu > 14 ngày (trong đó có 30 ngày và 3 tháng - 90 ngày), hiển thị ngày/tháng để tránh trùng mốc
      if (days > 14) {
        return date.toLocaleDateString(language === 'en' ? 'en-US' : language === 'jp' ? 'ja-JP' : 'vi-VN', {
          day: '2-digit',
          month: 'short'
        });
      }
      
      // Nếu <= 30 ngày, hiển thị thứ/ngày
      return date.toLocaleDateString(language === 'en' ? 'en-US' : language === 'jp' ? 'ja-JP' : 'vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      });
    });
  };

  // ── HOOKS (Always call at top level) ──
  
  const timeSeriesDataRaw = useMemo(() => {
    if (!isStoreManager) return [];
    
    console.log('📊 RevenueChart data received:', {
      hasRevenueByTime: !!data?.revenueByTime,
      recentOrdersCount: data?.recentOrders?.length ?? 0,
      sampleOrder: data?.recentOrders?.[0],
      currentFilter,
    });

    if (data?.revenueByTime) {
      const filterMap = {
        '7': 'revenueByTime7',
        '14': 'revenueByTime14',
        '30': 'revenueByTime30',
        '90': 'revenueByTime90',
        '365': 'revenueByTime365'
      };
      const timeKey = filterMap[currentFilter] || 'revenueByTime7';
      const result = data.revenueByTime[timeKey] || [];
      console.log('📊 Using revenueByTime key:', timeKey, 'points:', result.length);
      return result;
    }
    
    if (data?.recentOrders && Array.isArray(data.recentOrders) && data.recentOrders.length > 0) {
      const result = calculateRevenueFromOrders(data.recentOrders, parseInt(currentFilter));
      console.log('📊 Calculated from recentOrders:', result.length, 'points, sample:', result[0]);
      return result;
    }
    
    return [];
  }, [data, currentFilter, isStoreManager]);

  const processedData = useMemo(() => {
    if (!isStoreManager || timeSeriesDataRaw.length === 0) return [];
    
    const daysCount = parseInt(currentFilter);
    if (timeSeriesDataRaw.length <= 10 || daysCount <= 7) return timeSeriesDataRaw;
    
    let step = 1;
    if (daysCount <= 14) step = 2;
    else if (daysCount <= 35) step = 4;
    else if (daysCount <= 100) step = 10;
    else step = 30;
    
    const filtered = [];
    for (let i = timeSeriesDataRaw.length - 1; i >= 0; i -= step) {
      filtered.unshift(timeSeriesDataRaw[i]);
    }
    return filtered;
  }, [timeSeriesDataRaw, currentFilter, isStoreManager]);

  // ── RENDER ADMIN ──
  if (!isStoreManager) {
    let dataArray = Array.isArray(data) ? data : (data?.revenueByBranch || []);
    
    // Filter out DELETED franchises
    dataArray = dataArray.filter(item => {
      const status = (item.status || '').toUpperCase();
      return status !== 'DELETED';
    });
    
    if (dataArray.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex flex-col items-center justify-center text-gray-400">
          <p className="text-sm font-medium">{t.noData || (language === 'en' ? 'No data' : language === 'jp' ? 'データなし' : 'Chưa có dữ liệu')}</p>
        </div>
      );
    }
    
    const getBranchName = (item) => {
      const idSource = item.branchId || item.franchiseId || item.id || item._id;
      return item.branchName || item.franchiseName || item.name || `CN ${idSource?.substring(0, 4) || ''}`;
    };
    
    const labels = dataArray.map(getBranchName);
    const plotData = dataArray.map(item => item.totalRevenue || item.revenue || 0);
    
    // Per-bar colour: blue for active, muted gray for inactive
    const barColors = dataArray.map(item => {
      const active = item.isActive !== false; // default to active if not set
      return active ? 'rgba(59, 130, 246, 0.85)' : 'rgba(156, 163, 175, 0.6)';
    });
    const barBorderColors = dataArray.map(item => {
      const active = item.isActive !== false;
      return active ? '#3b82f6' : '#9ca3af';
    });
    
    const chartData = {
      labels,
      datasets: [{
        label: t.revenueTitle || (language === 'en' ? 'Revenue' : language === 'jp' ? '売上' : 'Doanh Thu'),
        data: plotData,
        borderColor: barBorderColors,
        backgroundColor: type === 'bar' ? barColors : 'rgba(59, 130, 246, 0.15)',
        borderWidth: type === 'bar' ? 0 : 3,
        borderRadius: type === 'bar' ? 6 : 0,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    };

    const hasInactive = dataArray.some(item => item.isActive === false);

    return (
      <ChartWrapper 
        chartData={chartData} 
        type={type} 
        title={t.revenueByBranchTitle || (language === 'en' ? 'Revenue by Branch' : language === 'jp' ? '店舗別売上' : 'Doanh thu theo chi nhánh')}
        subtitle={t.comparisonDesc || (language === 'en' ? 'Compare performance between branches' : language === 'jp' ? '店舗間のパフォーマンスを比較' : 'So sánh hiệu suất giữa các chi nhánh')}
        currentFilter={currentFilter}
        onFilterChange={onFilterChange}
        t={t}
        language={language}
        formatCurrency={formatCurrency}
        dataArray={dataArray}
        hasInactive={hasInactive}
      />
    );
  }

  // ── RENDER STORE MANAGER ──
  
  if (processedData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex flex-col items-center justify-center text-gray-400">
        <p className="text-sm font-medium">{t.noTimeData || (language === 'en' ? 'No revenue data over time' : language === 'jp' ? '期間内の売上データがありません' : 'Chưa có dữ liệu doanh thu theo thời gian')}</p>
        <p className="text-xs mt-1">{t.selectAnotherFilter || (language === 'en' ? 'Please select another time range' : language === 'jp' ? '別の期間を選択してください' : 'Vui lòng chọn khoảng thời gian khác')}</p>
      </div>
    );
  }
  
  const labels = formatLabels(processedData, parseInt(currentFilter));
  const plotData = processedData.map(item => item.totalRevenue);
  
  const chartData = {
    labels,
    datasets: [{
      label: t.revenueTitle || (language === 'en' ? 'Revenue' : language === 'jp' ? '売上' : 'Doanh Thu'),
      data: plotData,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#3b82f6',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointHoverBackgroundColor: '#3b82f6',
      pointHoverBorderColor: '#ffffff',
    }],
  };
  
  const getFilterOptions = () => [
    { value: '7', label: language === 'en' ? 'Last 7 days' : language === 'jp' ? '過去7日間' : '7 ngày qua' },
    { value: '14', label: language === 'en' ? 'Last 14 days' : language === 'jp' ? '過去14日間' : '14 ngày qua' },
    { value: '30', label: language === 'en' ? 'Last 30 days' : language === 'jp' ? '過去30日間' : '30 ngày qua' },
    { value: '90', label: language === 'en' ? 'Last 3 months' : language === 'jp' ? '過去3ヶ月間' : '3 tháng qua' },
    { value: '365', label: language === 'en' ? 'Last 1 year' : language === 'jp' ? '過去1年間' : '1 năm qua' },
  ];
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#F3F4F6',
        bodyColor: '#F9FAFB',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
          title: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const item = processedData[index];
            if (item) {
              const date = new Date(item.date);
              return date.toLocaleDateString(language === 'en' ? 'en-US' : language === 'jp' ? 'ja-JP' : 'vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            }
            return tooltipItems[0].label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12,
          font: { size: 11 }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#E5E7EB', drawBorder: false },
        ticks: {
          callback: (value) => {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
            return value;
          },
          font: { size: 11 }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {t.revenueTrend || (language === 'en' ? 'Revenue Trend' : language === 'jp' ? '売上推移' : 'Xu hướng doanh thu')}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {t.revenueHistoryDesc || (language === 'en' ? 'Revenue chart over time' : language === 'jp' ? '期間別の売上チャート' : 'Biểu đồ doanh thu theo thời gian')}
          </p>
        </div>
        <select 
          className="text-sm font-medium border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20"
          value={currentFilter}
          onChange={(e) => onFilterChange && onFilterChange(e.target.value)}
        >
          {getFilterOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-h-[200px] w-full relative">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

// ================= COMPONENT WRAPPER CHO ADMIN =================
const ChartWrapper = ({ chartData, type, title, subtitle, currentFilter, onFilterChange, t, language, formatCurrency, dataArray = [], hasInactive = false }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#F3F4F6',
        bodyColor: '#F9FAFB',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            const idx = tooltipItems[0]?.dataIndex;
            const item = dataArray[idx];
            const name = tooltipItems[0]?.label || '';
            if (item && item.isActive === false) {
              const inactiveLabel = language === 'en' ? 'Inactive' : language === 'jp' ? '非アクティブ' : 'Ngưng hoạt động';
              return `${name} (${inactiveLabel})`;
            }
            return name;
          },
          label: function(context) {
            return formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { 
          color: '#9CA3AF', 
          font: { family: "'Inter', sans-serif", size: 11 }, 
          padding: 10,
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false,
          callback: function(value) {
            const label = this.getLabelForValue(value);
            const item = dataArray[value];
            const isInactive = item && item.isActive === false;
            const inactiveLabel = language === 'en' ? 'Inactive' : language === 'jp' ? '非アクティブ' : 'Ngưng HĐ';

            if (typeof label === 'string' && label.length > 12) {
              const parts = label.split(' ');
              if (parts.length > 1) {
                const lines = [];
                let currentItemLine = parts[0];
                for(let i = 1; i < parts.length; i++) {
                   if ((currentItemLine + ' ' + parts[i]).length < 15) {
                      currentItemLine += ' ' + parts[i];
                   } else {
                      lines.push(currentItemLine);
                      currentItemLine = parts[i];
                   }
                }
                lines.push(currentItemLine);
                if (isInactive) lines.push(`✗ ${inactiveLabel}`);
                return lines;
              }
            }
            if (isInactive) return [label, `✗ ${inactiveLabel}`];
            return label;
          }
        }
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#F3F4F6', drawBorder: false, borderDash: [5, 5] },
        ticks: {
          color: '#9CA3AF',
          font: { family: "'Inter', sans-serif", size: 12 },
          padding: 10,
          callback: function(value) {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + (t.millionVND || (language === 'en' ? 'M VND' : language === 'jp' ? '百万 VND' : 'tr VNĐ'));
            if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
            return value;
          }
        }
      }
    }
  };

  if (!chartData || !chartData.labels || !Array.isArray(chartData.labels) || chartData.labels.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex flex-col items-center justify-center text-gray-400">
        {t.noData || (language === 'en' ? 'No data to display' : language === 'jp' ? 'データがありません' : "Chưa có dữ liệu")}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasInactive && (
            <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
                {language === 'en' ? 'Active' : language === 'jp' ? 'アクティブ' : 'Đang HĐ'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-gray-400 inline-block"></span>
                {language === 'en' ? 'Inactive' : language === 'jp' ? '非アクティブ' : 'Ngưng HĐ'}
              </span>
            </div>
          )}
          <select 
            className="text-sm font-medium border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20"
            value={currentFilter}
            onChange={(e) => onFilterChange && onFilterChange(e.target.value)}
          >
            <option value="7">{t.intervals?.days7 || (language === 'en' ? 'Last 7 days' : language === 'jp' ? '過去7日間' : "7 ngày qua")}</option>
            <option value="30">{t.intervals?.days30 || (language === 'en' ? 'Last 30 days' : language === 'jp' ? '過去30日間' : "30 ngày qua")}</option>
            <option value="90">{t.intervals?.months3 || (language === 'en' ? 'Last 3 months' : language === 'jp' ? '過去3ヶ月間' : "3 tháng qua")}</option>
            <option value="365">{t.intervals?.years1 || (language === 'en' ? 'Last 1 year' : language === 'jp' ? '過去1年間' : "1 năm qua")}</option>
          </select>
        </div>
      </div>
      <div className="flex-1 min-h-[200px] w-full relative">
        {type === 'bar' ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};