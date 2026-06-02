import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Edit, Trash2, UserCog, Plus } from 'lucide-react';
// import { useAuthStore } from '@/stores'; 
import { SearchUsers, DeleteOne, GetStaffByFranchise } from '@/services/userService';
import { SearchInput, Table, SelectOption, PaginationControls, StatCard } from '@/components/ui';
import { useAuthStore } from '@/stores';

const StaffStoreManager = () => {
  const user = useAuthStore(state => state.user);
  const franchiseId = 1; // user?.franchiseId;

  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const columns = [
    { id: 'info', label: 'Nhân viên', sortable: true, sortKey: 'fullName' },
    { id: 'phone', label: 'Liên hệ', sortable: false },
    { id: 'role', label: 'Vai trò', sortable: false },
    { id: 'status', label: 'Trạng thái', sortable: true, sortKey: 'status' },
    { id: 'actions', label: '', sortable: false },
  ];
  const [visibleColumns, setVisibleColumns] = useState(columns.map(c => c.id));

  const fetchStaffs = useCallback(async () => {
    if (!franchiseId) return;
    setLoading(true);
    try {
      // const payload = {
      //   role: 'STAFF', // Lấy Role Staff
      //  gi || undefined,
      //   status: status !== 'All' ? status : undefined,
      //   page: page - 1,
      //   size: 10,
      //   sortBy,
      //   sortDir
      // };

      console.log("user before: ", user)
      const payload = {
        franchiseId: user?.franchise?.id,
        page: page - 1,
      }

      // const res = await SearchUsers(payload);
      const response = await GetStaffByFranchise(payload);
      if (response.statusCode == 200) {
        const dataList = response?.data?.content || response?.data || [];
        setStaffs(dataList);
        setTotalPages(response?.data?.totalPages || 1);
        setTotalElements(response?.data?.totalElements || dataList.length);
      }

    } catch (error) {
      console.error("Lỗi khi tải nhân viên:", error);
    } finally {
      setLoading(false);
    }
  }, [franchiseId, keyword, status, page, sortBy, sortDir]);

  useEffect(() => {
    const timer = setTimeout(() => fetchStaffs(), 500);
    return () => clearTimeout(timer);
  }, [fetchStaffs]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Thao tác này sẽ vô hiệu hóa tài khoản nhân viên. Tiếp tục?")) return;
    try {
      await DeleteOne({ userId });
      fetchStaffs(); // Reload list
    } catch (error) {
      alert(error.message || "Xóa thất bại");
    }
  };

  const handleEdit = (user) => {
    console.log("Edit staff:", user);
    alert(`Mở form cập nhật nhân viên: ${user.fullName}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Quản lý Nhân viên</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách nhân sự làm việc tại chi nhánh</p>
        </div>

        {/* Tuỳ chọn: Nút thêm mới nếu FE có form tạo */}
        <button className="flex items-center gap-2 px-4 py-2 bg-[#d9a13b] text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors shadow-sm">
          <Plus size={18} /> Thêm nhân viên
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          icon={Briefcase} label="Tổng nhân sự" value={totalElements}
          bg="bg-indigo-50" color="text-indigo-600"
        />
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={keyword}
          onChange={(val) => { setKeyword(val); setPage(1); }}
          placeholder="Tìm tên, mã NV, sđt..."
          className="w-full sm:w-1/3"
        />
        <SelectOption
          value={status}
          onChange={(val) => { setStatus(val); setPage(1); }}
          options={[
            { label: 'Đang làm việc', value: 'ACTIVE' },
            { label: 'Đã nghỉ việc', value: 'INACTIVE' }
          ]}
          placeholder="Tất cả trạng thái"
          icon={UserCog}
          className="w-full sm:w-48"
        />
      </div>

      <div className={loading ? 'opacity-60 pointer-events-none' : ''}>
        <Table
          columns={columns}
          isEmpty={staffs.length === 0}
          emptyMessage="Chưa có dữ liệu nhân viên."
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        >
          {staffs.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
              {visibleColumns.includes('info') && (
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{user.fullName || 'Chưa cập nhật'}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                </td>
              )}
              {visibleColumns.includes('phone') && (
                <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '-'}</td>
              )}
              {visibleColumns.includes('role') && (
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg">
                    Nhân viên cửa hàng
                  </span>
                </td>
              )}
              {visibleColumns.includes('status') && (
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {user.status === 'ACTIVE' ? 'Đang làm việc' : 'Đã nghỉ'}
                  </span>
                </td>
              )}
              {visibleColumns.includes('actions') && (
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(user)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa thông tin">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa/Nghỉ việc">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </Table>

        <PaginationControls currentPage={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </div>
  );
};

export default StaffStoreManager;