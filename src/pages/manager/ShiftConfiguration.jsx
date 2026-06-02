// src/pages/manager/shift/ShiftConfiguration.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Edit2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import useShiftStore from "@/stores/shiftStore";
import { useAuthStore } from "@/stores/authStore";

const DEFAULT_FORM = {
  name: "",
  startTime: "07:00",
  endTime: "11:00",
  breakMinutes: 0,
};

const getUserFranchiseId = (user = {}) => {
  return (
    user?.franchise?.id ||
    user?.franchiseId ||
    user?.franchise_id ||
    localStorage.getItem("franchiseId") ||
    ""
  );
};

const normalizeTime = (time) => {
  if (!time) return "";

  if (Array.isArray(time)) {
    const [hour, minute] = time;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  return String(time).slice(0, 5);
};

const getDuration = (startTime, endTime, breakMinutes = 0) => {
  if (!startTime || !endTime) return "—";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let totalMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  totalMinutes = Math.max(0, totalMinutes - Number(breakMinutes || 0));

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours}h${minutes}m` : `${hours} giờ`;
};

const validateForm = (form) => {
  if (!form.name.trim()) {
    toast.error("Vui lòng nhập tên ca.");
    return false;
  }

  if (!form.startTime || !form.endTime) {
    toast.error("Vui lòng nhập giờ bắt đầu và giờ kết thúc.");
    return false;
  }

  const [startHour, startMinute] = form.startTime.split(":").map(Number);
  const [endHour, endMinute] = form.endTime.split(":").map(Number);

  if (startHour * 60 + startMinute >= endHour * 60 + endMinute) {
    toast.error("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
    return false;
  }

  if (Number(form.breakMinutes || 0) < 0) {
    toast.error("Thời gian nghỉ không được âm.");
    return false;
  }

  return true;
};

export default function ShiftConfiguration() {
  const { user } = useAuthStore();
  const franchiseId = getUserFranchiseId(user);

  const {
    shifts,
    loading,
    actionLoading,
    fetchShifts,
    createShiftConfig,
    updateShiftConfig,
    deleteShift,
  } = useShiftStore();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingShift, setEditingShift] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!franchiseId) {
      toast.error("Không tìm thấy chi nhánh để tải cấu hình ca.");
      return;
    }

    fetchShifts(franchiseId);
  }, [franchiseId, fetchShifts]);

  const normalizedShifts = useMemo(() => {
    return Array.isArray(shifts)
      ? shifts.map((shift) => ({
          ...shift,
          id: shift.id || shift.shiftConfigId || shift.shiftConfigurationId,
          name: shift.name || shift.shiftName || shift.shiftType || "Ca làm việc",
          startTime: normalizeTime(shift.startTime || shift.shiftStartTime),
          endTime: normalizeTime(shift.endTime || shift.shiftEndTime),
          breakMinutes: Number(shift.breakMinutes || 0),
          status: shift.status || "ACTIVE",
        }))
      : [];
  }, [shifts]);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingShift(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setForm(DEFAULT_FORM);
    setEditingShift(null);
    setShowForm(true);
  };

  const openEditForm = (shift) => {
    setEditingShift(shift);
    setForm({
      name: shift.name || "",
      startTime: normalizeTime(shift.startTime) || "07:00",
      endTime: normalizeTime(shift.endTime) || "11:00",
      breakMinutes: Number(shift.breakMinutes || 0),
    });
    setShowForm(true);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!franchiseId) {
      toast.error("Thiếu chi nhánh.");
      return;
    }

    if (!validateForm(form)) return;

    try {
      const payload = {
        name: form.name.trim(),
        shiftType: form.name.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        breakMinutes: Number(form.breakMinutes || 0),
        franchiseId,
      };

      if (editingShift?.id) {
        await updateShiftConfig(editingShift.id, payload);
      } else {
        await createShiftConfig(payload);
      }

      await fetchShifts(franchiseId);
      resetForm();
    } catch (error) {
      console.error("Save shift configuration failed:", error);
    }
  };

  const handleDelete = async (shift) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa cấu hình "${shift.name}" không?`
    );

    if (!confirmDelete) return;

    try {
      await deleteShift(null, shift.id);
      await fetchShifts(franchiseId);
    } catch (error) {
      console.error("Delete shift configuration failed:", error);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary">
            Cấu hình ca làm việc
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Tạo và quản lý các khung giờ ca làm việc theo chi nhánh.
          </p>

          {franchiseId && (
            <p className="text-xs text-gray-400 mt-1">
              Chi nhánh: <span className="font-semibold">{franchiseId}</span>
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => fetchShifts(franchiseId)}
            disabled={!franchiseId || loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Tải lại
          </button>

          <button
            onClick={openCreateForm}
            disabled={!franchiseId}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#d9a13b] text-white font-bold hover:bg-[#c48f32] transition disabled:opacity-50"
          >
            <Plus size={18} />
            Thêm cấu hình ca
          </button>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900">
              {editingShift ? "Cập nhật cấu hình ca" : "Tạo cấu hình ca mới"}
            </h2>

            <button
              type="button"
              onClick={resetForm}
              className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs font-black text-gray-400 uppercase">
                Tên ca
              </label>
              <input
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="VD: Ca sáng"
                className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b]"
              />
            </div>

            <div>
              <label className="text-xs font-black text-gray-400 uppercase">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  handleChange("startTime", event.target.value)
                }
                className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b]"
              />
            </div>

            <div>
              <label className="text-xs font-black text-gray-400 uppercase">
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => handleChange("endTime", event.target.value)}
                className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b]"
              />
            </div>

            <div>
              <label className="text-xs font-black text-gray-400 uppercase">
                Nghỉ giữa ca/phút
              </label>
              <input
                type="number"
                min="0"
                value={form.breakMinutes}
                onChange={(event) =>
                  handleChange("breakMinutes", event.target.value)
                }
                className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b]"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            <div className="text-sm text-gray-500">
              Tổng thời lượng:{" "}
              <span className="font-black text-gray-900">
                {getDuration(form.startTime, form.endTime, form.breakMinutes)}
              </span>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 disabled:opacity-50"
            >
              <Save size={18} />
              {actionLoading
                ? "Đang lưu..."
                : editingShift
                  ? "Cập nhật"
                  : "Tạo ca"}
            </button>
          </div>
        </form>
      )}

      {/* LIST */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900">Danh sách cấu hình ca</h2>

          <span className="text-xs font-bold text-gray-400">
            {normalizedShifts.length} cấu hình
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw size={42} className="mx-auto mb-3 animate-spin opacity-50" />
            <p className="font-semibold">Đang tải cấu hình ca...</p>
          </div>
        ) : normalizedShifts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Clock size={42} className="mx-auto mb-3 opacity-50" />
            <p className="font-semibold">Chưa có cấu hình ca nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Tên ca
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Nghỉ giữa ca
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Tổng giờ
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {normalizedShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50/80">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {shift.name}
                      </div>

                      <div className="text-xs text-gray-400 font-mono">
                        {shift.id}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 text-sm font-bold text-gray-700">
                        <Clock size={16} />
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {shift.breakMinutes} phút
                    </td>

                    <td className="px-6 py-4 text-sm font-black text-primary">
                      {getDuration(
                        shift.startTime,
                        shift.endTime,
                        shift.breakMinutes
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-black bg-green-50 text-green-700 border border-green-100">
                        {shift.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(shift)}
                          className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"
                          title="Sửa cấu hình"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(shift)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          title="Xóa cấu hình"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}