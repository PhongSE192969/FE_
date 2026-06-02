import React, { useState, useMemo, useEffect } from "react";
import {
  Layers,
  Search,
  Tag,
  CheckCircle2,
  Archive,
  Eye,
  Coffee
} from "lucide-react";

import { StatCard } from "@/components/ui";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { CategoryDetailModal } from "@/components/modal";
import { GetAllCategories } from "@/services";

const CategoryManager = () => {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).manager?.categoryManager || {};

  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [viewDetailCategory, setViewDetailCategory] = useState(null);

  // ==============================
  // FETCH API (REAL)
  // ==============================
  const fetchCategories = async () => {
    try {
      const res = await GetAllCategories();
      const data = res?.data || res || [];

      const normalized = data.map((c) => ({
        ...c,
        slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, "-"),
        itemCount:
            c.productCount ??
            c.products?.length ??
            0,
        status: c.status === "ACTIVE" ? "Active" : "Inactive"
      }));

      setCategories(normalized);
    } catch (error) {
      console.error("Fetch category error:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ==============================
  // STATS
  // ==============================
  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.status === "Active").length,
    totalItems: categories.reduce((acc, c) => acc + (c.itemCount || 0), 0),
    inactive: categories.filter(c => c.status === "Inactive").length
  }), [categories]);

  // ==============================
  // FILTER
  // ==============================
  const filteredCategories = categories.filter(c => {
    const matchesSearch =
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
        statusFilter === "All" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
      <div className="space-y-6 pb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {t.title || "Category Management"}
            </h2>

            <p className="text-gray-500 text-sm italic">
              {t.subtitle || "View & search categories"}
            </p>
          </div>

          {/* ❌ REMOVE ADD BUTTON */}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard icon={Layers} label="Total Categories" value={stats.total} color="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={CheckCircle2} label="Active" value={stats.active} color="text-green-600" bg="bg-green-50" />
          <StatCard icon={Coffee} label="Total Items" value={stats.totalItems} color="text-purple-600" bg="bg-purple-50" />
          <StatCard icon={Archive} label="Inactive" value={stats.inactive} color="text-slate-500" bg="bg-slate-50" />
        </div>

        {/* FILTER */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                  type="text"
                  placeholder="Search category..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">

              <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Slug</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Items</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
              </thead>

              <tbody>
              {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Tag size={18} />
                        <div className="font-bold">{cat.name}</div>
                      </div>
                    </td>

                    <td className="px-6 py-5">/{cat.slug}</td>

                    <td className="px-6 py-5">{cat.itemCount}</td>

                    <td className="px-6 py-5">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full
                      ${cat.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"}`}>
                      {cat.status}
                    </span>
                    </td>

                    <td className="px-6 py-5 flex justify-end">
                      <button onClick={() => setViewDetailCategory(cat)}>
                        <Eye size={16} />
                      </button>
                    </td>

                  </tr>
              ))}
              </tbody>

            </table>
          </div>
        </div>

        {/* DETAIL MODAL */}
        {viewDetailCategory && (
            <CategoryDetailModal
                viewDetailCategory={viewDetailCategory}
                setViewDetailCategory={setViewDetailCategory}
            />
        )}

      </div>
  );
};

export default CategoryManager;