// src/pages/storeManager/ShiftScheduleStoreManager.jsx
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  HelpCircle,
  Info,
  Plus,
  Search,
  Timer,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import useShiftStore from "@/stores/shiftStore";
import ShiftModal from "@/components/modal/ShiftModal";
import { useLanguageStore } from "@/stores";
import { useAuthStore } from "@/stores/authStore";
import { translations } from "@/locales";

const TERMINAL_STATUSES = ["CHECKED_OUT", "INCOMPLETE"];

const STATUS_LABELS = {
  ASSIGNED: "Đã phân ca",
  CHECKED_IN: "Đã check-in",
  CHECKED_OUT: "Đã check-out",
  ABSENT: "Vắng mặt",
  INCOMPLETE: "Chưa hoàn tất",
};

const STATUS_STYLES = {
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-100",
  CHECKED_IN: "bg-green-50 text-green-700 border-green-100",
  CHECKED_OUT: "bg-slate-100 text-slate-700 border-slate-200",
  ABSENT: "bg-red-50 text-red-700 border-red-100",
  INCOMPLETE: "bg-amber-50 text-amber-700 border-amber-100",
};

const getLocalTodayStr = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

const addDays = (dateString, amount) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + amount);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatDateLabel = (dateString) => {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeDate = (date) => {
  if (!date) return "";

  if (Array.isArray(date)) {
    const [year, month, day] = date;

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  }

  return String(date).slice(0, 10);
};

const normalizeTime = (time) => {
  if (!time) return "";

  if (Array.isArray(time)) {
    const [hour, minute] = time;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`;
  }

  return String(time).slice(0, 5);
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

const getRowId = (row = {}) => {
  return row.id || row.assignmentId || row.staffShiftId || "";
};

const getShiftConfigId = (row = {}) => {
  return (
    row.shiftConfigId ||
    row.shiftConfigurationId ||
    row.shiftId ||
    row.shift?.id ||
    row.shiftConfiguration?.id ||
    ""
  );
};

const getWorkDate = (row = {}) => {
  return normalizeDate(row.workDate || row.work_date || row.date);
};

const getShiftName = (row = {}) => {
  return row.shiftName || row.shift_name || row.name || "Ca làm việc";
};

const getStartTime = (row = {}) => {
  return normalizeTime(
    row.shiftStartTime || row.startTime || row.start_time || row.shift?.startTime
  );
};

const getEndTime = (row = {}) => {
  return normalizeTime(
    row.shiftEndTime || row.endTime || row.end_time || row.shift?.endTime
  );
};

const getStaffName = (row = {}) => {
  return (
    row.staffName ||
    row.staff_name ||
    row.fullName ||
    row.staff?.fullName ||
    row.staff?.username ||
    "Nhân viên"
  );
};

const getStaffPhone = (row = {}) => {
  return row.staffPhone || row.staff_phone || row.phone || row.staff?.phone || "";
};

const getStatus = (row = {}) => {
  return String(row.status || "ASSIGNED").toUpperCase();
};

const isPastShiftEnd = (row = {}) => {
  const workDate = getWorkDate(row);
  const endTime = getEndTime(row);

  if (!workDate || !endTime) return false;

  const endDateTime = new Date(`${workDate}T${endTime}:00`);

  return endDateTime.getTime() < Date.now();
};

const getEffectiveStatus = (row = {}) => {
  const status = getStatus(row);

  if (status === "ASSIGNED" && isPastShiftEnd(row)) {
    return "INCOMPLETE";
  }

  return status;
};

const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || status;
};

const getStatusClassName = (status) => {
  return STATUS_STYLES[status] || "bg-gray-50 text-gray-600 border-gray-100";
};

const canEditShift = (row = {}) => {
  const status = getEffectiveStatus(row);

  return !TERMINAL_STATUSES.includes(status);
};

const canDeleteShift = (row = {}) => {
  const status = getEffectiveStatus(row);

  return !["CHECKED_IN", "CHECKED_OUT"].includes(status);
};

const canCheckIn = (row = {}) => {
  const status = getEffectiveStatus(row);

  return status === "ASSIGNED";
};

const canCheckOut = (row = {}) => {
  const status = getEffectiveStatus(row);

  return status === "CHECKED_IN";
};

const canMarkAbsent = (row = {}) => {
  const status = getEffectiveStatus(row);

  return status === "ASSIGNED" || status === "INCOMPLETE";
};

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText,
  confirmColor = "blue",
  icon: Icon = HelpCircle,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const colorMap = {
    red: {
      box: "bg-red-50",
      icon: "text-red-500",
      button: "bg-red-500 hover:bg-red-600",
    },
    amber: {
      box: "bg-amber-50",
      icon: "text-amber-500",
      button: "bg-amber-500 hover:bg-amber-600",
    },
    blue: {
      box: "bg-blue-50",
      icon: "text-blue-500",
      button: "bg-blue-500 hover:bg-blue-600",
    },
  };

  const color = colorMap[confirmColor] || colorMap.blue;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`size-14 rounded-2xl flex items-center justify-center ${color.box}`}
        >
          <Icon size={28} className={color.icon} />
        </div>

        <div className="text-center">
          <div className="font-black text-slate-900 text-base mb-1">
            {title}
          </div>

          <div className="text-sm text-gray-500 leading-relaxed">
            {message}
          </div>
        </div>

        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>

          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${color.button}`}
          >
            {confirmText || "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ShiftScheduleStoreManager() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();

  const t =
    (translations[language] || translations.vi).manager?.shiftSchedule || {};

  const franchiseId = getUserFranchiseId(user);

  const {
    schedule,
    shifts,
    loading,
    actionLoading,
    fetchSchedule,
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
    checkIn,
    checkOut,
    markAbsent,
  } = useShiftStore();

  const [selectedDate, setSelectedDate] = useState(getLocalTodayStr());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [shiftFilter, setShiftFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    type: null,
    row: null,
  });

  useEffect(() => {
    if (!franchiseId) {
      toast.error("Không tìm thấy chi nhánh của Store Manager.");
      return;
    }

    fetchShifts(franchiseId);
  }, [franchiseId, fetchShifts]);

  useEffect(() => {
    if (!selectedDate) return;

    fetchSchedule(selectedDate);
  }, [selectedDate, fetchSchedule]);

  const rowsOfSelectedDate = useMemo(() => {
    return schedule.filter((row) => getWorkDate(row) === selectedDate);
  }, [schedule, selectedDate]);

  const filteredRows = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return rowsOfSelectedDate.filter((row) => {
      const status = getEffectiveStatus(row);
      const shiftName = getShiftName(row);
      const staffName = getStaffName(row).toLowerCase();
      const staffPhone = getStaffPhone(row).toLowerCase();

      const matchKeyword =
        !keyword ||
        staffName.includes(keyword) ||
        staffPhone.includes(keyword) ||
        shiftName.toLowerCase().includes(keyword);

      const matchStatus = statusFilter === "ALL" || status === statusFilter;
      const matchShift = shiftFilter === "ALL" || shiftName === shiftFilter;

      return matchKeyword && matchStatus && matchShift;
    });
  }, [rowsOfSelectedDate, searchQuery, statusFilter, shiftFilter]);

  const shiftOptions = useMemo(() => {
    const fromConfigs = Array.isArray(shifts)
      ? shifts.map((shift) => shift.name).filter(Boolean)
      : [];

    const fromRows = rowsOfSelectedDate
      .map((row) => getShiftName(row))
      .filter(Boolean);

    return Array.from(new Set([...fromConfigs, ...fromRows]));
  }, [shifts, rowsOfSelectedDate]);

  const stats = useMemo(() => {
    return rowsOfSelectedDate.reduce(
      (acc, row) => {
        const status = getEffectiveStatus(row);

        acc.total += 1;

        if (status === "ASSIGNED") acc.assigned += 1;
        if (status === "CHECKED_IN") acc.checkedIn += 1;
        if (status === "CHECKED_OUT") acc.checkedOut += 1;
        if (status === "ABSENT") acc.absent += 1;
        if (status === "INCOMPLETE") acc.incomplete += 1;

        return acc;
      },
      {
        total: 0,
        assigned: 0,
        checkedIn: 0,
        checkedOut: 0,
        absent: 0,
        incomplete: 0,
      }
    );
  }, [rowsOfSelectedDate]);

  const openCreateModal = () => {
    setEditingShift(null);
    setIsModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingShift({
      ...row,
      id: getRowId(row),
      assignmentId: getRowId(row),
      shiftConfigId: getShiftConfigId(row),
      shiftConfigurationId: getShiftConfigId(row),
      shiftType: getShiftName(row),
      shiftName: getShiftName(row),
      startTime: getStartTime(row),
      endTime: getEndTime(row),
      staffName: getStaffName(row),
      staffPhone: getStaffPhone(row),
      workDate: getWorkDate(row),
      franchiseId,
      branch: franchiseId,
    });
    setIsModalOpen(true);
  };

  const handleSaveShift = async (payload) => {
    try {
      const finalPayload = {
        ...payload,
        franchiseId: payload.franchiseId || franchiseId,
        branch: payload.branch || franchiseId,
      };

      if (editingShift) {
        const assignmentId =
          payload.assignmentId ||
          editingShift.assignmentId ||
          editingShift.id;

        const shiftConfigId =
          payload.shiftConfigId ||
          payload.shiftConfigurationId ||
          editingShift.shiftConfigId ||
          editingShift.shiftConfigurationId;

        await updateShift(assignmentId, shiftConfigId, finalPayload);
      } else {
        await createShift(finalPayload);
      }

      await fetchSchedule(selectedDate);
      await fetchShifts(franchiseId);

      setIsModalOpen(false);
      setEditingShift(null);
    } catch (error) {
      console.error("Save shift failed:", error);
    }
  };

  const handleConfirmAction = async () => {
    const row = confirmState.row;

    if (!row) return;

    const assignmentId = getRowId(row);
    const shiftConfigId = getShiftConfigId(row);

    try {
      if (confirmState.type === "delete") {
        await deleteShift(assignmentId, shiftConfigId || null);
      }

      if (confirmState.type === "checkIn") {
        await checkIn(assignmentId);
      }

      if (confirmState.type === "checkOut") {
        await checkOut(assignmentId);
      }

      if (confirmState.type === "absent") {
        await markAbsent(assignmentId);
      }

      await fetchSchedule(selectedDate);
      setConfirmState({ open: false, type: null, row: null });
    } catch (error) {
      console.error("Shift action failed:", error);
    }
  };

  const getConfirmDialogProps = () => {
    const row = confirmState.row;
    const staffName = getStaffName(row || {});

    if (confirmState.type === "delete") {
      return {
        title: "Xóa ca làm việc?",
        message: `Bạn có chắc muốn xóa ca của ${staffName}?`,
        confirmText: "Xóa",
        confirmColor: "red",
        icon: Trash2,
      };
    }

    if (confirmState.type === "checkIn") {
      return {
        title: "Check-in ca làm?",
        message: `Xác nhận ${staffName} đã bắt đầu ca làm.`,
        confirmText: "Check-in",
        confirmColor: "blue",
        icon: UserCheck,
      };
    }

    if (confirmState.type === "checkOut") {
      return {
        title: "Check-out ca làm?",
        message: `Xác nhận ${staffName} đã kết thúc ca làm.`,
        confirmText: "Check-out",
        confirmColor: "blue",
        icon: CheckCircle,
      };
    }

    if (confirmState.type === "absent") {
      return {
        title: "Đánh dấu vắng mặt?",
        message: `Xác nhận ${staffName} vắng mặt trong ca này.`,
        confirmText: "Vắng mặt",
        confirmColor: "amber",
        icon: AlertCircle,
      };
    }

    return {
      title: "Xác nhận thao tác",
      message: "Bạn có chắc muốn thực hiện thao tác này?",
      confirmText: "Xác nhận",
      confirmColor: "blue",
      icon: HelpCircle,
    };
  };

  const confirmProps = getConfirmDialogProps();

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary">
            {t.title || "Quản lý lịch ca"}
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            {t.subtitle ||
              "Store Manager quản lý lịch làm việc của nhân viên tại chi nhánh."}
          </p>

          {franchiseId && (
            <p className="text-xs text-gray-400 mt-1">
              Chi nhánh: <span className="font-semibold">{franchiseId}</span>
            </p>
          )}
        </div>

        <button
          onClick={openCreateModal}
          disabled={!franchiseId}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#d9a13b] text-white font-bold hover:bg-[#c48f32] transition disabled:opacity-50"
        >
          <Plus size={18} />
          {t.actions?.add || "Phân ca mới"}
        </button>
      </div>

      {/* DATE NAVIGATION */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDate((date) => addDays(date, -1))}
            className="size-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="min-w-[220px]">
            <div className="text-xs font-bold text-gray-400 uppercase">
              Ngày làm việc
            </div>

            <div className="font-black text-gray-900">
              {formatDateLabel(selectedDate)}
            </div>
          </div>

          <button
            onClick={() => setSelectedDate((date) => addDays(date, 1))}
            className="size-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b]"
          />

          <button
            onClick={() => setSelectedDate(getLocalTodayStr())}
            className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200"
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Tổng ca</p>
          <p className="text-xl font-black text-primary">{stats.total}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Đã phân</p>
          <p className="text-xl font-black text-blue-600">{stats.assigned}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Check-in</p>
          <p className="text-xl font-black text-green-600">{stats.checkedIn}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Hoàn tất</p>
          <p className="text-xl font-black text-slate-700">{stats.checkedOut}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Vắng</p>
          <p className="text-xl font-black text-red-600">{stats.absent}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Thiếu</p>
          <p className="text-xl font-black text-amber-600">
            {stats.incomplete}
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo tên nhân viên, số điện thoại hoặc ca..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b]"
            />
          </div>

          <select
            value={shiftFilter}
            onChange={(event) => setShiftFilter(event.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none"
          >
            <option value="ALL">Tất cả ca</option>
            {shiftOptions.map((shiftName) => (
              <option key={shiftName} value={shiftName}>
                {shiftName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ASSIGNED">Đã phân ca</option>
            <option value="CHECKED_IN">Đã check-in</option>
            <option value="CHECKED_OUT">Đã check-out</option>
            <option value="ABSENT">Vắng mặt</option>
            <option value="INCOMPLETE">Chưa hoàn tất</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <Timer size={42} className="mx-auto mb-3 animate-spin opacity-50" />
            <p className="font-semibold">Đang tải lịch ca...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Info size={42} className="mx-auto mb-3 opacity-50" />
            <p className="font-semibold">Không có ca làm nào trong ngày này.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Nhân viên
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Ca làm
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">
                    Check-in/out
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
                {filteredRows.map((row) => {
                  const rowId = getRowId(row);
                  const status = getEffectiveStatus(row);

                  return (
                    <tr key={rowId} className="hover:bg-gray-50/80">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          {getStaffName(row)}
                        </div>

                        <div className="text-xs text-gray-400">
                          {getStaffPhone(row) || row.staffId || "Không có SĐT"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-[#d9a13b]/10 text-[#b5822d] border border-[#d9a13b]/20">
                          {getShiftName(row)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <Clock size={16} />
                          {getStartTime(row)} - {getEndTime(row)}
                        </div>

                        <div className="text-xs text-gray-400 mt-1">
                          {formatDateLabel(getWorkDate(row))}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>
                            Check-in:{" "}
                            <span className="font-semibold text-gray-700">
                              {normalizeTime(row.checkInTime) || "—"}
                            </span>
                          </div>

                          <div>
                            Check-out:{" "}
                            <span className="font-semibold text-gray-700">
                              {normalizeTime(row.checkOutTime) || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${getStatusClassName(
                            status
                          )}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {canCheckIn(row) && (
                            <button
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  type: "checkIn",
                                  row,
                                })
                              }
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                              title="Check-in"
                            >
                              <UserCheck size={16} />
                            </button>
                          )}

                          {canCheckOut(row) && (
                            <button
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  type: "checkOut",
                                  row,
                                })
                              }
                              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                              title="Check-out"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}

                          {canMarkAbsent(row) && (
                            <button
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  type: "absent",
                                  row,
                                })
                              }
                              className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                              title="Vắng mặt"
                            >
                              <AlertCircle size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(row)}
                            disabled={!canEditShift(row)}
                            className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                            title="Sửa ca"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() =>
                              setConfirmState({
                                open: true,
                                type: "delete",
                                row,
                              })
                            }
                            disabled={!canDeleteShift(row)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40"
                            title="Xóa ca"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ShiftModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingShift(null);
        }}
        onSave={handleSaveShift}
        loading={actionLoading}
        initialData={editingShift}
        isStoreManager={true}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmProps.title}
        message={confirmProps.message}
        confirmText={confirmProps.confirmText}
        confirmColor={confirmProps.confirmColor}
        icon={confirmProps.icon}
        onCancel={() => setConfirmState({ open: false, type: null, row: null })}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}