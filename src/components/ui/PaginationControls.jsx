import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useLanguageStore } from '@/stores';
import { translations } from '@/locales';

const PaginationControls = ({ currentPage, totalPages, setPage }) => {
  const { language } = useLanguageStore();
  const t = translations[language]?.ui?.pagination || translations.vi.ui.pagination;

  if (totalPages <= 1) return null;

  // Tạo logic hiển thị số trang (VD: 1 2 ... 5 6 7 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
      <span className="text-sm font-bold text-gray-400">
        {t.page} <span className="text-gray-800">{currentPage}</span> / {totalPages}
      </span>
      
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Đi thẳng đến trang đầu */}
        <button
          onClick={() => setPage(1)}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#d9a13b] disabled:opacity-50 disabled:cursor-not-allowed transition"
          title={t.firstPage}
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Lùi 1 trang */}
        <button
          onClick={() => setPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#d9a13b] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Các nút số trang */}
        <div className="flex items-center gap-1 hidden sm:flex">
          {getPageNumbers().map((pageNum, idx) => (
            <button
              key={idx}
              onClick={() => pageNum !== '...' && setPage(pageNum)}
              disabled={pageNum === '...'}
              className={`min-w-[32px] h-8 rounded-lg text-sm font-bold transition-all ${
                pageNum === currentPage
                  ? 'bg-[#d9a13b] text-white shadow-md shadow-yellow-900/10'
                  : pageNum === '...'
                  ? 'text-gray-400 cursor-default'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        {/* Tiến 1 trang */}
        <button
          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#d9a13b] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={16} />
        </button>

        {/* Đi thẳng đến trang cuối */}
        <button
          onClick={() => setPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#d9a13b] disabled:opacity-50 disabled:cursor-not-allowed transition"
          title={t.lastPage}
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;