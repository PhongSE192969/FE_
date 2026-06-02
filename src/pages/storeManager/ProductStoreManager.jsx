import React, { useState, useEffect, useCallback } from 'react';
import { Package, Search, Filter } from 'lucide-react';
// Giả định bạn có store chứa thông tin user đăng nhập
// import { useAuthStore } from '@/stores'; 
import { getProductsByFranchise } from '@/services/productService'; // Đảm bảo đường dẫn đúng
import {SearchInput, SelectOption, Table, PaginationControls, StatCard} from '@/components/ui'; // Điều chỉnh path nếu cần
import { useAuthStore } from '@/stores';

const ProductStoreManager = () => {
  // Mock lấy franchiseId từ store, thực tế bạn dùng: const { user } = useAuthStore();
  const user = useAuthStore(state => state.user)
  const franchiseId = user?.franchise?.id || null;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Params filter & pagination
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Cấu hình Table Columns
  const columns = [
    { id: 'image', label: 'Hình ảnh', sortable: false },
    { id: 'name', label: 'Tên sản phẩm', sortable: true, sortKey: 'name' },
    { id: 'category', label: 'Danh mục', sortable: true, sortKey: 'categoryName' },
    { id: 'price', label: 'Giá bán', sortable: true, sortKey: 'price' },
    { id: 'status', label: 'Trạng thái', sortable: true, sortKey: 'status' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(columns.map(c => c.id));

  const fetchProducts = useCallback(async () => {
    if (!franchiseId) return;
    setLoading(true);
    try {
      const payload = {
        keyword: keyword || undefined,
        categoryName: category !== 'All' ? category : undefined,
        page: page - 1, // API thường dùng page bắt đầu từ 0
        size: 10,
        sortBy,
        sortDir
      };
      
      const res = await getProductsByFranchise(franchiseId, payload);
      // Giả định API trả về dạng PageResponse (có content và totalPages)
      const dataList = res?.content || res?.data?.content || [];
      setProducts(dataList);
      setTotalPages(res?.totalPages || res?.data?.totalPages || 1);
      setTotalElements(res?.totalElements || res?.data?.totalElements || dataList.length);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  }, [franchiseId, keyword, category, page, sortBy, sortDir]);

  useEffect(() => {
    // Debounce cho search keyword
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Sản phẩm chi nhánh</h1>
          <p className="text-sm text-gray-500 mt-1">Xem danh sách các sản phẩm đang được kinh doanh tại cửa hàng</p>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          icon={Package} label="Tổng sản phẩm" value={totalElements} 
          bg="bg-blue-50" color="text-blue-600" 
        />
        {/* Thêm các StatCard khác nếu có data (vd: Sản phẩm hết hàng, sắp hết...) */}
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <SearchInput 
          value={keyword} 
          onChange={(val) => { setKeyword(val); setPage(1); }} 
          placeholder="Tìm kiếm theo tên sản phẩm..." 
          className="w-full sm:w-1/3"
        />
        <SelectOption 
          value={category} 
          onChange={(val) => { setCategory(val); setPage(1); }}
          options={[
            { label: 'Cà phê', value: 'Coffee' },
            { label: 'Trà', value: 'Tea' },
            { label: 'Bánh ngọt', value: 'Cake' }
          ]}
          placeholder="Tất cả danh mục"
          icon={Filter}
          className="w-full sm:w-48"
        />
      </div>

      {/* Bảng dữ liệu */}
      <div className={loading ? 'opacity-60 pointer-events-none' : ''}>
        <Table
          columns={columns}
          isEmpty={products.length === 0}
          emptyMessage="Không tìm thấy sản phẩm nào phù hợp."
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        >
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
              {visibleColumns.includes('image') && (
                <td className="px-6 py-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                    <img src={product.imageUrl || product.image || 'https://placehold.co/100'} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                </td>
              )}
              {visibleColumns.includes('name') && (
                <td className="px-6 py-4 font-semibold text-gray-800">{product.name}</td>
              )}
              {visibleColumns.includes('category') && (
                <td className="px-6 py-4 text-sm text-gray-500">{product.categoryName || '-'}</td>
              )}
              {visibleColumns.includes('price') && (
                <td className="px-6 py-4 text-sm font-medium text-gray-700">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price || 0)}
                </td>
              )}
              {visibleColumns.includes('status') && (
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    product.status === 'AVAILABLE' || product.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {product.status === 'AVAILABLE' || product.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </Table>

        <PaginationControls 
          currentPage={page} 
          totalPages={totalPages} 
          setPage={setPage} 
        />
      </div>
    </div>
  );
};

export default ProductStoreManager;