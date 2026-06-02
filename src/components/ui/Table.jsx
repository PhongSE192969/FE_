import React, { useState, useRef, useEffect } from "react";
import { ArrowDown, ArrowUp, Settings2, Check, Loader2 } from "lucide-react";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const Table = ({
  columns,
  data, // Hỗ trợ truyền mảng data để tự động render
  isLoading, // Hỗ trợ trạng thái loading (xoay xoay)
  children, // Hỗ trợ cách cũ: tự render <tr> thủ công
  isEmpty,
  emptyMessage,
  sortBy,
  sortDir,
  onSort,
  visibleColumns: propVisibleColumns,
  setVisibleColumns: propSetVisibleColumns,
}) => {
  const { language } = useLanguageStore();
  const t = translations[language]?.ui?.table || {
    emptyMessage: "Không có dữ liệu",
    showHideCols: "Ẩn/Hiện cột",
    customizeDisplay: "Tùy chỉnh hiển thị",
  };
  const finalEmptyMessage = emptyMessage || t.emptyMessage;

  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const dropdownRef = useRef(null);

  // Hàm tiện ích: Tự động lấy ID hoặc Accessor của cột
  const getColId = (col, idx) => col.id || col.accessor || `col-${idx}`;

  // Tự động nhận diện danh sách cột hiển thị mặc định
  const allColumnIds = columns?.map(getColId) || [];
  const [internalVisible, setInternalVisible] = useState(allColumnIds);

  // Dùng state ngoài (nếu truyền vào) hoặc state nội bộ
  const visibleColumns = propVisibleColumns || internalVisible;
  const setVisibleColumns = propSetVisibleColumns || setInternalVisible;

  const isDataEmpty =
    isEmpty !== undefined ? isEmpty : !data || data.length === 0;

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowColumnToggle(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleColumn = (colId) => {
    if (visibleColumns.includes(colId)) {
      if (visibleColumns.length > 1) {
        // Đảm bảo luôn hiển thị ít nhất 1 cột
        setVisibleColumns(visibleColumns.filter((id) => id !== colId));
      }
    } else {
      const colIndex = columns.findIndex(
        (c, idx) => getColId(c, idx) === colId,
      );
      const newVisible = [...visibleColumns];
      newVisible.splice(colIndex, 0, colId); // Cố gắng giữ đúng thứ tự
      setVisibleColumns(newVisible);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible relative">
      {/* Header controls (Column Toggle) */}
      <div className="flex justify-end p-2 border-b border-gray-100 bg-gray-50/30">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowColumnToggle(!showColumnToggle)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
          >
            <Settings2 size={14} />
            {t.showHideCols}
          </button>

          {showColumnToggle && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase text-gray-400">
                {t.customizeDisplay}
              </div>
              {columns?.map((col, idx) => {
                const colId = getColId(col, idx);
                const colLabel = col.label || col.header;
                if (!colLabel) return null; // Bỏ qua các cột không có tiêu đề (ví dụ cột hành động)

                return (
                  <button
                    key={colId}
                    onClick={() => handleToggleColumn(colId)}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    <span>{colLabel}</span>
                    {visibleColumns.includes(colId) && (
                      <Check size={14} className="text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              {columns?.map((col, idx) => {
                const colId = getColId(col, idx);
                const colLabel = col.label || col.header;

                if (!visibleColumns.includes(colId)) return null;

                return (
                  <th
                    key={colId}
                    className={`px-6 py-4 text-xs font-black uppercase tracking-wider ${col.sortable ? "cursor-pointer hover:bg-gray-100/80 group" : "text-gray-400"}`}
                    onClick={() =>
                      col.sortable &&
                      onSort &&
                      onSort(col.sortKey || col.accessor)
                    }
                  >
                    <div
                      className={`flex items-center gap-1.5 ${col.sortable ? "text-gray-700" : "text-gray-400"}`}
                    >
                      {colLabel}
                      {col.sortable && (
                        <span className="flex flex-col text-gray-300 group-hover:text-gray-400">
                          {sortBy === (col.sortKey || col.accessor) ? (
                            sortDir === "asc" ? (
                              <ArrowUp size={12} className="text-[#d9a13b]" />
                            ) : (
                              <ArrowDown size={12} className="text-[#d9a13b]" />
                            )
                          ) : (
                            <ArrowDown size={12} className="opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : isDataEmpty && !children ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-6 py-12 text-center text-gray-400 font-medium italic"
                >
                  {finalEmptyMessage}
                </td>
              </tr>
            ) : children ? (
              /* Dành cho các page dùng cách render <tr> thủ công cũ */
              children
            ) : data ? (
              /* Tự động render mảng data */
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  {columns.map((col, colIndex) => {
                    const colId = getColId(col, colIndex);
                    if (!visibleColumns.includes(colId)) return null;

                    return (
                      <td
                        key={colId}
                        className="px-6 py-4 text-sm text-gray-700"
                      >
                        {col.render
                          ? col.render(row[col.accessor || col.id], row)
                          : row[col.accessor || col.id]}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
