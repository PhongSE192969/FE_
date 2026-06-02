import { motion as Motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, Building2, Award, RefreshCw } from 'lucide-react';
import RevenueChart from '../../components/ui/RevenueChart';
import { reportApi, ENDPOINTS } from '../../config/api';
import { useSSE } from '@/hooks/useSSE';
import { useState, useEffect, useCallback } from 'react';
import { useLanguageStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { translations } from "@/locales";

const iconMap = {
  totalRevenue: TrendingUp,
  totalOrders: ShoppingCart,
  activeBranches: Building2,
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

export default function StoreManagerDashboard() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = (translations[language] || translations.vi).storeManager?.dashboard || (translations[language] || translations.vi).manager?.dashboard || (translations[language] || translations.vi).admin?.dashboard || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('7');
  const [currentFilter, setCurrentFilter] = useState('7');
  
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      activeBranches: 0,
      totalProducts: 0,
      totalCustomers: 0
    },
    topProducts: [],
    topCustomers: [],
    revenueByBranch: [],
    orderStatusStats: {},
    recentOrders: [],
    generatedAt: null,
    error: false,
    message: ''
  });

  const franchiseId = user?.franchiseId || user?.franchise?.id || localStorage.getItem('franchiseId');

  // Filter data by franchiseId
  const filterDataByFranchise = useCallback((data, fid) => {
    if (!data) return data;
    
    // 1. Filter Branches explicitly
    const filteredRevenueByBranch = (data.revenueByBranch || []).filter(
      branch => !fid || branch.franchiseId === fid || branch.branchId === fid
    );
    const filteredRecentOrders = (data.recentOrders || []).filter(
      order => !fid || !order.franchiseId || order.franchiseId === fid || order.branchId === fid
    );

    // 2. Aggregate Summaries STRICTLY from the filtered branches. 
    // Never fall back to global summary when fid is present!
    let summaryRevenue = 0;
    let summaryOrders = 0;
    if (fid) {
      filteredRevenueByBranch.forEach(branch => {
        summaryRevenue += Number(branch.totalRevenue || branch.revenue || 0);
        summaryOrders += Number(branch.totalOrders || branch.orders || 0);
      });
    } else {
      summaryRevenue = Number(data.summary?.totalRevenue || 0);
      summaryOrders = Number(data.summary?.totalOrders || 0);
    }
    const scopedSummary = {
      ...(data.summary || {}),
      totalRevenue: summaryRevenue,
      totalOrders: summaryOrders
    };

    // 3. Robust Local Aggregation for Top Products from Recent Orders
    const productStats = {};
    filteredRecentOrders.forEach(order => {
       if (order.orderDetails && Array.isArray(order.orderDetails)) {
          order.orderDetails.forEach(item => {
             const pId = item.productId || item.product?._id || item.product?.id || item.id || 'unknown';
             const pName = item.productNameSnapshot || item.productName || item.product?.name || 'Sản phẩm';
             const qty = Number(item.quantity) || 1;
             const price = Number(item.priceSnapshot) || Number(item.price) || 0;
             const rev = (price * qty) || Number(item.totalAmount) || 0;
             if (!productStats[pId]) productStats[pId] = { productId: pId, productName: pName, totalSold: 0, totalRevenue: 0 };
             productStats[pId].totalSold += qty;
             productStats[pId].totalRevenue += rev;
          });
       }
    });
    let localTopProducts = Object.values(productStats).sort((a, b) => b.totalSold - a.totalSold).slice(0, 3);

    // 4. Robust Local Aggregation for Loyal Customers from Recent Orders
    const customerStats = {};
    filteredRecentOrders.forEach(order => {
       const user = order.user || order.customer || {};
       const cId = order.customerId || user._id || user.id || user.phone;
       const cName = order.customerName || user.fullName || user.username || user.name || 'Khách hàng';
       
       if (cId || order.customerName) {
          const idToUse = cId || cName;
          if (idToUse === 'guest' || cName.toLowerCase() === 'khách vãng lai' || cName.toLowerCase() === 'guest') return;
          
          const rev = Number(order.totalDue || order.totalAmount || order.totalRevenue) || 0;
          if (!customerStats[idToUse]) {
             customerStats[idToUse] = {
                customerId: idToUse,
                customerName: cName,
                fullName: cName,
                totalSpent: 0,
                totalOrders: 0
             };
          }
          customerStats[idToUse].totalSpent += rev;
          customerStats[idToUse].totalOrders += 1;
       }
    });
    let localTopCustomers = Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    // If local aggregation is empty (backend omitted orderDetails from recentOrders),
    // fall back to the API-returned lists which are already scoped by ?franchiseId=... sent in the request
    if (localTopProducts.length === 0) {
       localTopProducts = (data.topProducts || []).slice(0, 3);
       console.log('📦 Top products: using API result directly (no orderDetails in recentOrders)', localTopProducts);
    }
    if (localTopCustomers.length === 0) {
       localTopCustomers = (data.topCustomers || []).slice(0, 5);
       console.log('👥 Top customers: using API result directly (no customer data in recentOrders)', localTopCustomers);
    }

    return {
      ...data,
      summary: scopedSummary,
      recentOrders: filteredRecentOrders,
      revenueByBranch: filteredRevenueByBranch,
      topProducts: localTopProducts, // local strict aggregation
      topCustomers: localTopCustomers, // local strict aggregation
    };
  }, []);

  const fetchDashboardData = useCallback(async (days = '7') => {
    try {
      setLoading(true);
      const toDate = new Date().toISOString().split('T')[0];
      const fromDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const data = await reportApi.getDashboardByDate(fromDate, toDate, franchiseId);
      console.log(`✅ Dashboard data from API for ${days} days:`, data);

      const filteredData = filterDataByFranchise(data, franchiseId);
      
      setDashboardData({
        summary: filteredData?.summary || { totalRevenue: 0, totalOrders: 0, activeBranches: 0, totalProducts: 0, totalCustomers: 0 },
        topProducts: filteredData?.topProducts || [],
        topCustomers: filteredData?.topCustomers || [],
        revenueByBranch: filteredData?.revenueByBranch || [],
        orderStatusStats: filteredData?.orderStatusStats || {},
        recentOrders: filteredData?.recentOrders || [],
        generatedAt: filteredData?.generatedAt || null,
        error: filteredData?.error || false,
        message: filteredData?.message || ''
      });

      setError(null);
    } catch (err) {
      console.error('❌ Error fetching dashboard:', err);
      setError(t.error || (language === 'en' ? 'Could not load dashboard data. Please try again later.' : language === 'jp' ? 'ダッシュボードデータを読み込めませんでした。後でもう一度お試しください。' : 'Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  }, [t.error, language, franchiseId, filterDataByFranchise]);

  const handleFilterChange = (value) => {
    setCurrentFilter(value);
    setDateRange(value);
    fetchDashboardData(value);
  };

  // ── Midnight Refresh ──
  const [todayDateStr, setTodayDateStr] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().toISOString().split('T')[0];
      if (now !== todayDateStr) {
        console.log("🌙 Midnight passed! Refreshing dashboard data...");
        setTodayDateStr(now);
        fetchDashboardData(currentFilter);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [todayDateStr, currentFilter, fetchDashboardData]);

  // ── Realtime SSE ──
  const { data: realtimeData } = useSSE(ENDPOINTS.PROTECTED.REPORTS.events);

  useEffect(() => {
    if (realtimeData) {
      console.log("Realtime Report update received:", realtimeData);
      
      const { type, data: eventData } = realtimeData;
      
      if (type === 'DASHBOARD_UPDATED' && eventData) {
        const filteredData = filterDataByFranchise(eventData, franchiseId);
        setDashboardData(prev => ({
          ...prev,
          ...filteredData,
        }));
      } 
      else if (type === 'ORDER_UPDATED' && eventData) {
        if (eventData.franchiseId === franchiseId || eventData.branchId === franchiseId) {
          setDashboardData(prev => {
            const orderAmount = eventData.totalDue || eventData.totalAmount || 0;
            const customer = eventData.customer || eventData.customerId;

            // Update topCustomers dynamically
            let newCustomers = [...(prev.topCustomers || [])];
            if (customer && (customer.id || customer._id || typeof customer === 'string')) {
              const cId = typeof customer === 'string' ? customer : (customer.id || customer._id || customer.customerId);
              const exIdx = newCustomers.findIndex(c => (c.customerId || c.id || c._id) === cId);
              if (exIdx >= 0) {
                 newCustomers[exIdx] = {
                    ...newCustomers[exIdx],
                    totalOrders: (newCustomers[exIdx].totalOrders || 0) + 1,
                    totalSpent: (newCustomers[exIdx].totalSpent || 0) + orderAmount
                 };
              } else if (typeof customer === 'object') {
                 newCustomers.push({
                    ...customer,
                    customerId: cId,
                    totalOrders: 1,
                    totalSpent: orderAmount
                 });
              }
              newCustomers.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
            }

            // Update revenueByBranch dynamically
            let newRevByBranch = [...(prev.revenueByBranch || [])];
            const bId = eventData.branchId || eventData.franchiseId;
            if (bId) {
              const bIdx = newRevByBranch.findIndex(b => b.branchId === bId || b.franchiseId === bId);
              if (bIdx >= 0) {
                 newRevByBranch[bIdx] = {
                    ...newRevByBranch[bIdx],
                    totalRevenue: (newRevByBranch[bIdx].totalRevenue || 0) + orderAmount,
                    totalOrders: (newRevByBranch[bIdx].totalOrders || 0) + 1
                 };
              }
            }

            return {
              ...prev,
              recentOrders: [eventData, ...(prev.recentOrders || [])].slice(0, 10),
              topCustomers: newCustomers,
              revenueByBranch: newRevByBranch,
              summary: {
                ...prev.summary,
                totalOrders: (prev.summary?.totalOrders || 0) + 1,
                totalRevenue: (prev.summary?.totalRevenue || 0) + orderAmount
              }
            };
          });
        }
      }
      else if (type === 'INVENTORY_UPDATED' && eventData) {
        console.log('Inventory update:', eventData);
      }
      else if (realtimeData.summary) {
        const filteredData = filterDataByFranchise(realtimeData, franchiseId);
        setDashboardData(prev => ({
          ...prev,
          ...filteredData,
        }));
      }
    }
  }, [realtimeData, franchiseId, filterDataByFranchise]);



  useEffect(() => {
    if (franchiseId) {
      fetchDashboardData(dateRange);
    }
  }, [dateRange, language, fetchDashboardData, franchiseId]);

  // Format số tiền VND
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 ₫';
    const locale = language === 'en' ? 'en-US' : language === 'jp' ? 'ja-JP' : 'vi-VN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    const locale = language === 'en' ? 'en-US' : language === 'jp' ? 'ja-JP' : 'vi-VN';
    return new Intl.NumberFormat(locale).format(num);
  };

  const getCustomerDisplayName = (customer) => {
    if (!customer) return language === 'en' ? 'Customer' : language === 'jp' ? '顧客' : 'Khách hàng';
    const candidates = [
      customer.customerName,
      customer.name,
      customer.fullName,
      customer.displayName,
      customer.title,
      customer.customer?.customerName,
      customer.customer?.name,
      customer.customer?.fullName,
    ];

    const normalized = candidates
      .filter(Boolean)
      .map((value) => value.toString().trim())
      .filter(Boolean);

    const invalids = new Set(['unknown', 'khách hàng', 'customer', '顧客']);
    const good = normalized.find((value) => !invalids.has(value.toLowerCase()));
    if (good) return good;
    if (normalized.length > 0) return normalized[0];

    return customer.customerId || customer.id || customer._id || (language === 'en' ? 'Customer' : language === 'jp' ? '顧客' : 'Khách hàng');
  };

  const getSummaryValue = (key, defaultValue = 0) => {
    return dashboardData?.summary?.[key] ?? defaultValue;
  };

  const statsCards = [
    {
      id: 'totalRevenue',
      label: t.stats?.totalRevenue || (language === 'en' ? 'Total Revenue' : language === 'jp' ? '総売上' : 'Tổng Doanh Thu'),
      value: formatCurrency(getSummaryValue('totalRevenue')),
      change: null,
      up: dashboardData?.revenueByBranch?.length > 0
    },
    {
      id: 'totalOrders',
      label: t.stats?.totalOrders || (language === 'en' ? 'Total Orders' : language === 'jp' ? '総注文数' : 'Tổng Đơn Hàng'),
      value: formatNumber(getSummaryValue('totalOrders')),
      change: dashboardData?.orderStatusStats?.COMPLETED > 0 ?
        `${formatNumber(dashboardData.orderStatusStats.COMPLETED)} ${t.stats?.completedOrders || (language === 'en' ? 'completed' : language === 'jp' ? '完了' : 'đơn hoàn thành')}` :
        null,
      up: dashboardData?.orderStatusStats?.COMPLETED > 0
    }
  ];

  if (loading && !dashboardData.generatedAt) {
    return (
      <div className="flex flex-col space-y-5 animate-pulse pb-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 h-24 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="w-48 h-12 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 h-[340px]"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[280px]">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 h-full"></div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 h-full"></div>
        </div>
      </div>
    );
  }

  if (error || dashboardData.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error || dashboardData.message}</p>
        <button
          onClick={() => fetchDashboardData(dateRange)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          {t.retry || "Thử lại"}
        </button>
      </div>
    );
  }

  const displayTopProducts = (dashboardData.topProducts || []).slice(0, 3);

  return (
    <Motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col space-y-5 pb-10 relative transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Absolute Loading overlay when filtering */}
      {loading && dashboardData.generatedAt && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="bg-white/90 p-3 rounded-full shadow-lg">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t.title || (language === 'en' ? 'Overview' : language === 'jp' ? 'ダッシュボード' : 'Tổng quan')}</h1>
          <p className="text-sm font-medium text-gray-500 mt-1 capitalize">
            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : language === 'jp' ? 'ja-JP' : 'vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-8">
          {statsCards.map((card) => {
            const Icon = iconMap[card.id];
            return (
              <div key={card.id} className="flex items-center justify-end gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
                  <div className="flex items-baseline justify-end mt-1">
                    <p className="text-xl font-black text-blue-700 leading-none tracking-tight">{card.value}</p>
                  </div>
                  {card.change && (
                    <p className="text-[10px] font-bold mt-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md inline-flex items-center">
                      <span className="w-1 h-1 rounded-full bg-blue-500 mr-1"></span>
                      {card.change}
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 shadow-inner text-blue-600`}>
                  <Icon size={24} strokeWidth={2.5} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Section: Chart Full-width */}
      <div className="w-full max-w-7xl mx-auto min-h-[360px]">
        <RevenueChart 
          data={dashboardData}
          onFilterChange={handleFilterChange}
          currentFilter={currentFilter}
          isStoreManager={true}
          type="line"
        />
      </div>

      {/* Bottom Section: Top Products & Loyal Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[300px]">
        {/* LEFT: Top Products */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                <ShoppingCart size={16} strokeWidth={2.5} />
              </span>
              {t.sidebar?.topProducts || (language === 'en' ? 'Top 3 Bestselling Products' : language === 'jp' ? '売れ筋商品トップ3' : 'Top 3 Sản Phẩm Bán Chạy')}
            </h3>
            <span className="text-xs font-bold bg-gray-50 text-gray-500 px-2.5 py-1 rounded-md border border-gray-200">
              {currentFilter === '7' ? '7 ngày' : 
               currentFilter === '14' ? '14 ngày' :
               currentFilter === '30' ? '30 ngày' :
               currentFilter === '90' ? '3 tháng' : 
               currentFilter === '365' ? '1 năm' : `${currentFilter} ngày`}
            </span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-3 relative">
            {displayTopProducts.length > 0 ? (
              displayTopProducts.map((product, idx) => (
                <div key={product.productId || idx} className="flex items-center gap-4 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm transition-all p-3 rounded-xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                    idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-200/50' : 
                    idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-200/50' : 
                    'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-orange-200/50'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <p className="text-[14px] font-bold text-gray-800 leading-tight break-words">
                      {product.productName || (language === 'en' ? 'Product' : language === 'jp' ? '製品' : 'Sản phẩm')}
                    </p>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(product.totalRevenue)}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{formatNumber(product.totalSold)} {t.sidebar?.soldUnit || (language === 'en' ? 'sold' : language === 'jp' ? '販売済み' : "đã bán")}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-400">
                <ShoppingCart size={32} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">{t.sidebar?.waitingProduct || (language === 'en' ? 'Waiting for data...' : language === 'jp' ? 'データを待機中...' : 'Đang chờ dữ liệu...')}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Loyal Customers */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center shadow-sm">
                <Award size={18} strokeWidth={2.5} />
              </span>
              {t.sidebar?.loyalCustomers || (language === 'en' ? 'Loyal Customers' : language === 'jp' ? 'ロイヤルカスタマー' : 'Khách hàng Thân Thiết')}
            </h3>
            <span className="text-xs font-bold text-gray-400">{dashboardData.topCustomers?.length} {language === 'en' ? 'customers' : language === 'jp' ? '顧客' : 'khách hàng'}</span>
          </div>

          <div className="flex-1 flex flex-col space-y-2 relative mt-2">
            {dashboardData.topCustomers?.length > 0 ? (
              dashboardData.topCustomers.slice(0, 5).map((customer, idx) => {
                const displayName = getCustomerDisplayName(customer);
                const initial = displayName?.charAt(0) || '?';
                const totalSpent = customer.totalSpent || 0;
                let rank = 'Bronze';
                if (totalSpent > 10000000) rank = 'Gold';
                else if (totalSpent > 5000000) rank = 'Silver';
                const rs = rankStyles[rank];

                return (
                  <div key={customer.customerId || idx} className="flex items-center gap-3 py-1.5 px-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.06)] ${avatarColorMap[initial] || 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700'}`}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                         <p className="text-[13px] font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                           {displayName}
                         </p>
                         <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1)] ${rs.bg} ${rs.text} shrink-0`}>
                           {rank}
                         </span>
                      </div>
                      <p className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span className="text-gray-700 font-bold">{formatNumber(customer.totalOrders)}</span> {t.sidebar?.ordersUnit || (language === 'en' ? 'orders' : language === 'jp' ? '注文' : "đơn hàng")} <span className="text-gray-300 mx-0.5">•</span> <span className="text-gray-600 font-semibold">{formatCurrency(totalSpent)}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
               <div className="absolute inset-0 flex items-center justify-center text-gray-400 gap-2 flex-col">
                 <Award size={32} className="opacity-30 mb-2" />
                 <p className="text-sm font-medium">{t.sidebar?.noCustomerData || (language === 'en' ? 'No customer data' : language === 'jp' ? '顧客データなし' : 'Chưa có dữ liệu khách hàng')}</p>
               </div>
            )}
          </div>
        </div>
        
      </div>

    </Motion.div>
  );
}