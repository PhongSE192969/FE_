import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Grid, Filter, Layers, Search as SearchIcon, 
  ChevronRight, ArrowDown, ArrowUp, Settings2, 
  Check, ChevronLeft, ChevronsLeft, ChevronsRight 
} from 'lucide-react';
import { GetAllCategories } from '@/services';

import { SearchInput, SelectOption, Table, PaginationControls, StatCard} from '@/components/ui';

const CategoryStoreManager = () => {
  // Giả định franchiseId của Store Manager đang đăng nhập
  const franchiseId = 1; 

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Params filter & pagination
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const columns = [
    { id: 'image', label: 'Hình ảnh', sortable: false },
    { id: 'name', label: 'Tên danh mục', sortable: true, sortKey: 'name' },
    { id: 'description', label: 'Mô tả', sortable: false },
    { id: 'status', label: 'Trạng thái', sortable: true, sortKey: 'status' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(columns.map(c => c.id));

  const fetchCategories = useCallback(async () => {
    if (!franchiseId) return;
    setLoading(true);
    try {
      // 1. Lấy dữ liệu từ API
      const res = await GetAllCategories();
      
      // Xử lý an toàn cấu trúc trả về từ API
      let dataList = Array.isArray(res) ? res : (res?.data?.data || res?.data || res?.content || []);

      // 2. Lọc dữ liệu (Client-side filter)
      if (keyword) {
        dataList = dataList.filter(c => 
          c.name?.toLowerCase().includes(keyword.toLowerCase()) || 
          c.description?.toLowerCase().includes(keyword.toLowerCase())
        );
      }
      if (status !== 'All') {
        dataList = dataList.filter(c => c.status === status);
      }

      // 3. Sắp xếp dữ liệu (Client-side sorting)
      dataList.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });

      // Cập nhật tổng số lượng sau khi lọc
      setTotalElements(dataList.length);

      // 4. Phân trang (Client-side pagination)
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const paginatedData = dataList.slice(startIndex, startIndex + pageSize);

      setCategories(paginatedData);
      setTotalPages(Math.ceil(dataList.length / pageSize) || 1);

    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
    } finally {
      setLoading(false);
    }
  }, [franchiseId, keyword, status, page, sortBy, sortDir]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCategories(), 500);
    return () => clearTimeout(timer);
  }, [fetchCategories]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const activeCategoriesCount = categories.filter(c => c.status === 'ACTIVE').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-gray-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Danh mục sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Xem danh sách các danh mục hàng hóa đang được phép kinh doanh tại cửa hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard 
          icon={Grid} label="Tổng danh mục (Theo bộ lọc)" value={totalElements} 
          bg="bg-teal-50" color="text-teal-600" 
        />
        <StatCard 
          icon={Layers} label="Danh mục đang hiển thị trên trang này" value={activeCategoriesCount} 
          bg="bg-blue-50" color="text-blue-500" 
        />
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <SearchInput 
          value={keyword} 
          onChange={(val) => { setKeyword(val); setPage(1); }} 
          placeholder="Tìm tên danh mục..." 
          className="w-full sm:w-1/3"
        />
        <SelectOption 
          value={status} 
          onChange={(val) => { setStatus(val); setPage(1); }}
          options={[
            { label: 'Đang hoạt động', value: 'ACTIVE' },
            { label: 'Đang ẩn', value: 'INACTIVE' }
          ]}
          placeholder="Tất cả trạng thái"
          icon={Filter}
          className="w-full sm:w-48"
        />
      </div>

      <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>
        <Table
          columns={columns}
          isEmpty={categories.length === 0}
          emptyMessage="Chưa có dữ liệu danh mục."
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        >
          {categories.map((cat) => (
            <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
              {visibleColumns.includes('image') && (
                <td className="px-6 py-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                    <img src={cat.image || 'https://placehold.co/100'} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                </td>
              )}
              {visibleColumns.includes('name') && (
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-800">{cat.name}</span>
                </td>
              )}
              {visibleColumns.includes('description') && (
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {cat.description || '-'}
                </td>
              )}
              {visibleColumns.includes('status') && (
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${
                    cat.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {cat.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đang ẩn'}
                  </span>
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

export default CategoryStoreManager;