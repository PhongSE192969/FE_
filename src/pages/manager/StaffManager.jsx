import React, { useState, useMemo, useEffect } from 'react';
import { useLanguageStore, useUserStore } from '@/stores';
import { translations } from '@/locales';
import { formatDate } from '@/utils/helpers';
import { 
  Users, UserPlus, Eye, Edit2, Trash2, X, Clock, Mail, Phone, 
  Calendar, ShieldCheck, UserCheck, UserMinus, Award, Activity
} from 'lucide-react';

import { 
  PaginationControls, 
  SearchInput, 
  SelectOption, 
  StatCard, 
  Table 
} from '@/components/ui';

const StaffManager = () => {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).manager?.staffManager || {};

  // Store state and actions
  const {
    users,
    isLoading,
    totalPages,
    currentPage,
    fetchUsersList,
    statsCounts,
    fetchCountUsers
  } = useUserStore();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination & Sort State
  const [page, setPage] = useState(1);
  const size = 10;
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewProfile, setViewProfile] = useState(null);

  // Table Columns Definition
  const tableColumns = useMemo(() => [
    { id: 'details', label: t.table?.staff || 'Nhân viên', sortable: true, sortKey: 'fullName' },
    { id: 'contact', label: t.table?.contact || 'Liên hệ', sortable: false },
    { id: 'status', label: t.table?.status || 'Trạng thái', sortable: true, sortKey: 'status' },
    { id: 'date', label: t.table?.date || 'Ngày vào làm', sortable: true, sortKey: 'createdAt' },
    { id: 'actions', label: '', sortable: false }
  ], [t]);

  const [visibleColumns, setVisibleColumns] = useState(tableColumns.map(c => c.id));

  // Debounce logic for Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (searchTerm !== debouncedSearch) setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Users List explicitly for STAFF
  useEffect(() => {
    fetchUsersList({
      page,
      size,
      keyword: debouncedSearch,
      role: 'STAFF', // Mặc định truyền role là STAFF
      status: statusFilter === 'All' ? '' : statusFilter,
      sortBy,
      sortDir
    });
  }, [page, size, debouncedSearch, statusFilter, sortBy, sortDir, refreshKey]);

  // Fetch global stats (optional, for stat cards)
  useEffect(() => {
    fetchCountUsers();
  }, []);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setSortBy('createdAt');
    setSortDir('desc');
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{t.title || "Chi nhánh - Nhân sự"}</h2>
          <p className="text-gray-500 text-sm italic">{t.subtitle || "Quản lý đội ngũ nhân viên và ca làm việc tại cửa hàng"}</p>
        </div>
        {/* <button 
          onClick={() => { setSelectedStaff(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-[#d9a13b] hover:bg-[#c48f32] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-yellow-900/10 active:scale-95"
        >
          <UserPlus size={18} />
          <span>{t.addStaff || "Thêm Nhân viên"}</span>
        </button> */}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={Users} label={t.stats?.total || "Tổng Staff Hệ Thống"} value={statsCounts?.totalStaff || 0} subtext="System-wide staff" color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={UserCheck} label={t.stats?.onDuty || "Đang hoạt động"} value={statsCounts?.totalIsActive || 0} subtext="Trạng thái Active" color="text-green-600" bg="bg-green-50" />
        <StatCard icon={UserMinus} label={t.stats?.onLeave || "Đang khoá (Suspend)"} value={statsCounts?.totalIsSuspended || 0} subtext="Tạm thời vắng mặt" color="text-orange-600" bg="bg-orange-50" />
        <StatCard icon={Award} label={t.stats?.performance || "Hiệu suất TB"} value={"4.8"} subtext="Dựa trên đánh giá tháng" color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t.search?.placeholder || "Tìm nhân viên theo tên, email, sđt..."}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <SelectOption
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              placeholder={t.filters?.allStatus || "All Status"}
              icon={Activity}
              options={['ACTIVE', 'SUSPENDED', 'DELETED', 'INACTIVE'].map(status => ({
                value: status,
                label: t.status?.[status] || status
              }))}
            />
            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg hover:bg-red-50"
            >
              {t.filters?.reset || "Reset"}
            </button>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="w-8 h-8 border-4 border-[#d9a13b] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <Table
          columns={tableColumns}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          isEmpty={!isLoading && (!users || users.length === 0)}
          emptyMessage={t.table?.empty || "Không tìm thấy nhân viên nào phù hợp với bộ lọc."}
        >
          {users?.map((staff) => (
            <tr key={staff.id} className="group hover:bg-gray-50/80 transition-colors">
              
              {visibleColumns.includes('details') && (
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    {staff.avatarUrl ? (
                      <img src={staff.avatarUrl} alt={staff.fullName} className="size-10 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 group-hover:bg-[#d9a13b] group-hover:text-white transition-all shadow-sm">
                        {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 leading-none">{staff.fullName || staff.username}</div>
                      <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase mt-1">ID: {staff.id.substring(0,8)}</div>
                    </div>
                  </div>
                </td>
              )}

              {visibleColumns.includes('contact') && (
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                      <Mail size={12} className="text-gray-300" /> {staff.email || 'N/A'}
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                      <Phone size={12} className="text-gray-300" /> {staff.phone || 'N/A'}
                    </div>
                  </div>
                </td>
              )}

              {visibleColumns.includes('status') && (
                <td className="px-6 py-5">
                  <span className={`
                    flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full w-fit uppercase
                    ${staff.status === 'ACTIVE' ? 'text-green-600 bg-green-50' : 
                      (staff.status === 'SUSPENDED' ? 'text-orange-600 bg-orange-50' : 'text-red-500 bg-red-50')}
                  `}>
                    <span className={`size-1.5 rounded-full 
                      ${staff.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 
                        (staff.status === 'SUSPENDED' ? 'bg-orange-500' : 'bg-red-500')
                      }`} 
                    />
                    {t.status?.[staff.status] || staff.status}
                  </span>
                </td>
              )}

              {visibleColumns.includes('date') && (
                <td className="px-6 py-5 text-xs text-gray-500 font-medium">
                  {formatDate(staff.createdAt)}
                </td>
              )}

              {visibleColumns.includes('actions') && (
                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setViewProfile(staff)} 
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent shadow-none hover:shadow-sm transition-all"
                      title="Xem chi tiết"
                    >
                      <Eye size={16}/>
                    </button>
                    <button 
                      onClick={() => { setSelectedStaff(staff); setIsModalOpen(true); }} 
                      className="p-2 text-gray-400 hover:text-[#d9a13b] hover:bg-white rounded-lg border border-transparent shadow-none hover:shadow-sm transition-all"
                      title="Cập nhật"
                    >
                      <Edit2 size={16}/>
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="Xoá"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </Table>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          setPage={setPage}
        />
      </div>

      {/* Modal: View Staff Profile (Giữ nguyên giao diện UI cũ nhưng map data mới) */}
      {viewProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="relative h-32 bg-gradient-to-r from-[#1e3a5f] to-[#0f172a]">
              <button onClick={() => setViewProfile(null)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20}/></button>
              <div className="absolute -bottom-12 left-8 flex items-end gap-4">
                <div className="size-24 rounded-3xl bg-white p-1 shadow-xl">
                  {viewProfile.avatarUrl ? (
                    <img src={viewProfile.avatarUrl} alt="avatar" className="size-full rounded-2xl object-cover" />
                  ) : (
                    <div className="size-full rounded-2xl bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-400">
                      {(viewProfile.fullName || viewProfile.username)?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="mb-2">
                  <h3 className="text-2xl font-black text-white leading-none">{viewProfile.fullName || viewProfile.username}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 uppercase">STAFF</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{viewProfile.id.substring(0,8)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-16 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.modal?.view?.contactInfo || "Thông tin liên hệ"}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-700 font-bold">
                      <div className="size-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><Mail size={16}/></div>
                      {viewProfile.email || 'N/A'}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700 font-bold">
                      <div className="size-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><Phone size={16}/></div>
                      {viewProfile.phone || 'N/A'}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700 font-bold">
                      <div className="size-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><Calendar size={16}/></div>
                      {t.modal?.view?.joinedDate || "Ngày vào làm:"} {formatDate(viewProfile.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.modal?.view?.schedulePerms || "Lịch trực & Phân quyền"}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Clock size={14}/> {t.modal?.view?.currentShift || "Ca làm việc hiện tại"}</div>
                      <span className="text-xs font-black text-slate-900">Full-time</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><ShieldCheck size={14}/> {t.modal?.view?.access || "Quyền truy cập"}</div>
                      <span className="text-xs font-black text-blue-600">
                        {viewProfile.franchise?.name || "Branch Restricted"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setViewProfile(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">{t.modal?.view?.close || "Đóng"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;