import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Timer,
  Trash2,
  UserCheck,
  XCircle,
  LogIn,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";

import useShiftStore from "@/stores/shiftStore";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { ENDPOINTS } from "@/config/api";
import { useSSE } from "@/hooks/useSSE";
import ShiftModal from "@/components/modal/ShiftModal";
import {
  normalizeDate,
  normalizeTime,
  toLocalDateString,
} from "@/services/shiftService";
import { GetStaffByFranchise, SearchUsers } from "@/services/userService";

const STATUS_LABELS_FALLBACK = {
  ASSIGNED: "Đã phân công",
  CHECKED_IN: "Đang làm việc",
  CHECKED_OUT: "Đã kết thúc",
  ABSENT: "Vắng mặt",
  INCOMPLETE: "Quên check-out",
};

const STATUS_STYLES = {
  ASSIGNED: "bg-slate-100 text-slate-700 border-slate-200",
  CHECKED_IN: "bg-blue-50 text-blue-700 border-blue-200",
  CHECKED_OUT: "bg-green-50 text-green-700 border-green-200",
  ABSENT: "bg-red-50 text-red-600 border-red-200",
  INCOMPLETE: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_ICON = {
  ASSIGNED: Timer,
  CHECKED_IN: UserCheck,
  CHECKED_OUT: CheckCircle2,
  ABSENT: XCircle,
  INCOMPLETE: AlertCircle,
};

const SHIFT_OPTIONS = [
  { value: "All", label: "Tất cả ca" },
  { value: "Ca sáng", label: "Ca sáng" },
  { value: "Ca chiều", label: "Ca chiều" },
  { value: "Ca tối", label: "Ca tối" },
];

const STATUS_OPTIONS = [
  { value: "All", label: "Tất cả trạng thái" },
  { value: "ASSIGNED", label: "Đã phân công" },
  { value: "CHECKED_IN", label: "Đang làm việc" },
  { value: "CHECKED_OUT", label: "Đã kết thúc" },
  { value: "ABSENT", label: "Vắng mặt" },
  { value: "INCOMPLETE", label: "Quên check-out" },
];

const getUserFranchiseId = (user) => {
  return (
    user?.franchise?.id ||
    user?.franchiseId ||
    user?.franchise_id ||
    localStorage.getItem("franchiseId") ||
    null
  );
};

const extractList = (response) => {
  const data = response?.data?.data || response?.data || response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const normalizeStaff = (staff, franchiseId) => {
  return {
    id: staff.id,
    name: staff.fullName || staff.username || staff.email || staff.id,
    phone: staff.phone || staff.phoneNumber || "",
    email: staff.email || "",
    role: staff.role?.name || staff.roleName || staff.role || "STAFF",
    franchiseId:
      staff.franchiseId || staff.franchise?.id || staff.branch || franchiseId,
    raw: staff,
  };
};

const fetchStaffByFranchise = async (franchiseId) => {
  if (!franchiseId) return [];

  try {
    if (typeof GetStaffByFranchise === "function") {
      const response = await GetStaffByFranchise({
        franchiseId,
        page: 0,
        size: 200,
      });

      const list = extractList(response);

      if (list.length > 0) {
        return list
          .filter((item) => item.status !== "INACTIVE")
          .map((item) => normalizeStaff(item, franchiseId));
      }
    }
  } catch (error) {
    console.warn("GetStaffByFranchise failed, fallback SearchUsers:", error);
  }

  try {
    const response = await SearchUsers({
      role: "STAFF",
      status: "ACTIVE",
      page: 0,
      size: 200,
    });

    const list = extractList(response);

    return list
      .filter((item) => {
        const itemFranchiseId = item.franchiseId || item.franchise?.id;

        return (
          item.status !== "INACTIVE" &&
          (!itemFranchiseId || String(itemFranchiseId) === String(franchiseId))
        );
      })
      .map((item) => normalizeStaff(item, franchiseId));
  } catch (error) {
    console.error("Fetch staff by franchise failed:", error);
    return [];
  }
};

const getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);

  d.setDate(diff);

  return toLocalDateString(d);
};

const addDays = (dateString, days) => {
  const d = new Date(`${dateString}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
};

const getMonthRange = (dateString) => {
  const [year, month] = normalizeDate(dateString).split("-").map(Number);

  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);

  return {
    startDate: toLocalDateString(first),
    endDate: toLocalDateString(last),
  };
};

const getDate = (row) => normalizeDate(row?.workDate || row?.work_date);
const getStart = (row) =>
  normalizeTime(row?.shiftStartTime || row?.startTime || row?.start_time);
const getEnd = (row) =>
  normalizeTime(row?.shiftEndTime || row?.endTime || row?.end_time);
const getShiftName = (row) => row?.shiftName || row?.shift_name || row?.name || "—";

const fmtDate = (dateString) => {
  const value = normalizeDate(dateString);

  if (!value) return "—";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtTime = (row) => {
  const start = getStart(row);
  const end = getEnd(row);

  if (start && end) return `${start} - ${end}`;
  return start || end || "—";
};

const fmtDuration = (row) => {
  const start = getStart(row);
  const end = getEnd(row);

  if (!start || !end) return "";

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const diff = eh * 60 + em - (sh * 60 + sm);
  const mins = diff > 0 ? diff : diff + 1440;

  if (mins % 60) return `${Math.floor(mins / 60)}h${mins % 60}m`;
  return `${Math.floor(mins / 60)} giờ`;
};

const getStatusLabel = (status, t) => {
  return t.status?.[status] || STATUS_LABELS_FALLBACK[status] || status || "—";
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  bg,
  onClick,
  active,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${
        active ? "border-[#d9a13b] ring-2 ring-[#d9a13b]/20" : "border-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}
        >
          <Icon size={20} />
        </div>

        <div>
          <div className="text-2xl font-black text-slate-900">{value}</div>
          <div className="text-xs font-medium text-gray-500">{label}</div>
        </div>
      </div>

      {subtext && (
        <div className="mt-3 text-[11px] font-semibold text-gray-400">
          {subtext}
        </div>
      )}
    </button>
  );
};

export default function ShiftSchedule() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const t =
    (translations[language] || translations.vi).manager?.shiftSchedule || {};

  const franchiseId = getUserFranchiseId(user);

  const {
    schedule,
    shifts,
    loading,
    actionLoading,
    configLoading,
    fetchShifts,
    fetchSchedule,
    fetchScheduleRange,
    createShift,
    assignShift,
    updateShift,
    updateAssignment,
    deleteShift,
    checkIn,
    checkOut,
    markAbsent,
  } = useShiftStore();

  const [selectedDate, setSelectedDate] = useState(toLocalDateString());
  const [viewMode, setViewMode] = useState("day");
  const [weekStart, setWeekStart] = useState(getStartOfWeek());
  const [monthDate, setMonthDate] = useState(toLocalDateString());

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [statFilter, setStatFilter] = useState("All");

  const [staffList, setStaffList] = useState([]);
  const [staffMap, setStaffMap] = useState({});
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);

  const [processingId, setProcessingId] = useState(null);

  const abortRef = useRef(false);

  const { data: realtimeData } = useSSE(ENDPOINTS.PROTECTED.SHIFTS.events);

  const loadStaff = useCallback(async () => {
    if (!franchiseId) return;

    setLoadingStaff(true);

    try {
      const list = await fetchStaffByFranchise(franchiseId);
      const map = {};

      list.forEach((staff) => {
        map[staff.id] = staff;
      });

      setStaffList(list);
      setStaffMap(map);
    } catch (error) {
      console.error("Load staff failed:", error);
      toast.error("Không tải được danh sách nhân viên");
    } finally {
      setLoadingStaff(false);
    }
  }, [franchiseId]);

  const loadShiftConfigs = useCallback(async () => {
    if (!franchiseId) return;
    await fetchShifts(franchiseId);
  }, [franchiseId, fetchShifts]);

  const loadSchedule = useCallback(async () => {
    if (!franchiseId) return;

    if (viewMode === "day") {
      await fetchSchedule(selectedDate);
      return;
    }

    if (viewMode === "week") {
      await fetchScheduleRange(null, weekStart, addDays(weekStart, 6));
      return;
    }

    const range = getMonthRange(monthDate);
    await fetchScheduleRange(null, range.startDate, range.endDate);
  }, [
    franchiseId,
    viewMode,
    selectedDate,
    weekStart,
    monthDate,
    fetchSchedule,
    fetchScheduleRange,
  ]);

  useEffect(() => {
    abortRef.current = false;

    const run = async () => {
      await Promise.all([loadStaff(), loadShiftConfigs()]);
      if (!abortRef.current) {
        await loadSchedule();
      }
    };

    run();

    return () => {
      abortRef.current = true;
    };
  }, [loadStaff, loadShiftConfigs, loadSchedule]);

  useEffect(() => {
    if (!realtimeData) return;

    const eventType = realtimeData?.type;

    if (
      [
        "SHIFT_CREATED",
        "SHIFT_UPDATED",
        "SHIFT_DELETED",
        "ASSIGN_SHIFT",
        "UPDATE_ASSIGNMENT",
        "CHECK_IN",
        "CHECK_OUT",
        "ATTENDANCE_UPDATED",
        "MARK_ABSENT",
      ].includes(eventType)
    ) {
      loadSchedule();
      loadShiftConfigs();
    }
  }, [realtimeData, loadSchedule, loadShiftConfigs]);

  const staffIdsInBranch = useMemo(() => {
    return new Set(staffList.map((staff) => String(staff.id)));
  }, [staffList]);

  const visibleSchedule = useMemo(() => {
    return schedule.filter((row) => {
      if (staffIdsInBranch.size === 0) return true;
      return staffIdsInBranch.has(String(row.staffId));
    });
  }, [schedule, staffIdsInBranch]);

  const scheduleByView = useMemo(() => {
    if (viewMode === "day") {
      return visibleSchedule.filter((row) => getDate(row) === selectedDate);
    }

    if (viewMode === "week") {
      const start = weekStart;
      const end = addDays(weekStart, 6);

      return visibleSchedule.filter((row) => {
        const date = getDate(row);
        return date >= start && date <= end;
      });
    }

    const range = getMonthRange(monthDate);

    return visibleSchedule.filter((row) => {
      const date = getDate(row);
      return date >= range.startDate && date <= range.endDate;
    });
  }, [visibleSchedule, viewMode, selectedDate, weekStart, monthDate]);

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return scheduleByView
      .filter((row) => {
        const staff = staffMap[row.staffId];
        const staffName = String(
          staff?.name || row.staffName || row.staffId || ""
        ).toLowerCase();

        const shiftName = getShiftName(row);
        const status = row.status;

        const matchSearch =
          !keyword ||
          staffName.includes(keyword) ||
          String(shiftName).toLowerCase().includes(keyword) ||
          String(row.staffId || "").toLowerCase().includes(keyword);

        const matchType = typeFilter === "All" || shiftName === typeFilter;
        const matchStatus = statusFilter === "All" || status === statusFilter;

        return matchSearch && matchType && matchStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(`${getDate(a)}T${getStart(a) || "00:00"}:00`);
        const dateB = new Date(`${getDate(b)}T${getStart(b) || "00:00"}:00`);

        return dateA - dateB;
      });
  }, [scheduleByView, searchTerm, typeFilter, statusFilter, staffMap]);

  const stats = useMemo(() => {
    return {
      total: scheduleByView.length,
      assigned: scheduleByView.filter((row) => row.status === "ASSIGNED").length,
      checkedIn: scheduleByView.filter((row) => row.status === "CHECKED_IN")
        .length,
      checkedOut: scheduleByView.filter((row) => row.status === "CHECKED_OUT")
        .length,
      absent: scheduleByView.filter((row) => row.status === "ABSENT").length,
      incomplete: scheduleByView.filter((row) => row.status === "INCOMPLETE")
        .length,
    };
  }, [scheduleByView]);

  const weekRangeText = useMemo(() => {
    const start = new Date(`${weekStart}T00:00:00`);
    const end = new Date(`${addDays(weekStart, 6)}T00:00:00`);

    return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString(
      "vi-VN"
    )}`;
  }, [weekStart]);

  const monthText = useMemo(() => {
    const [year, month] = monthDate.split("-").map(Number);
    const date = new Date(year, month - 1, 1);

    return date.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  }, [monthDate]);

  const handleStatFilter = (filter) => {
    setStatFilter(filter);

    if (filter === "All" || filter === "total") {
      setStatusFilter("All");
      return;
    }

    setStatusFilter(filter);
  };

  const openCreateModal = () => {
    setEditingShift(null);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    const staff = staffMap[row.staffId];

    setEditingShift({
      ...row,
      assignmentId: row.id,
      staffName: staff?.name || row.staffName || "",
      staffPhone: staff?.phone || row.staffPhone || "",
      branch: franchiseId,
      franchiseId,
      shiftType: getShiftName(row),
      startTime: getStart(row),
      endTime: getEnd(row),
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingShift(null);
  };

  const handleSaveShift = async (payload) => {
    try {
      if (payload.isEdit && payload.assignmentId) {
        if (payload.shouldCreateConfigFirst || !payload.shiftConfigId) {
          toast.error("Không thể sửa nếu thiếu mã cấu hình ca");
          return;
        }

        await updateShift(payload.assignmentId, payload.shiftConfigId, {
          shiftType: payload.shiftType,
          startTime: payload.startTime,
          endTime: payload.endTime,
          breakMinutes: payload.breakMinutes,
          staffId: payload.staffId,
          workDate: payload.workDate,
          franchiseId: payload.franchiseId,
          staffName: payload.staffName,
          staffPhone: payload.staffPhone,
        });

        closeModal();
        await loadSchedule();
        return;
      }

      if (payload.shouldCreateConfigFirst || !payload.shiftConfigId) {
        await createShift({
          shiftType: payload.shiftType,
          startTime: payload.startTime,
          endTime: payload.endTime,
          breakMinutes: payload.breakMinutes,
          staffId: payload.staffId,
          workDate: payload.workDate,
          franchiseId: payload.franchiseId,
          staffName: payload.staffName,
          staffPhone: payload.staffPhone,
        });

        closeModal();
        await loadSchedule();
        await loadShiftConfigs();
        return;
      }

      await assignShift({
        staffId: payload.staffId,
        shiftConfigId: payload.shiftConfigId,
        workDate: payload.workDate,
        currentUserId: user?.id,
      });

      closeModal();
      await loadSchedule();
    } catch {
      // store đã toast
    }
  };

  const handleMarkAbsent = async (row) => {
    if (!row?.id || processingId) return;

    const ok = window.confirm("Bạn có chắc muốn đánh dấu nhân viên này vắng mặt?");
    if (!ok) return;

    try {
      setProcessingId(row.id);
      await markAbsent(row.id);
      await loadSchedule();
    } catch {
      // store đã toast
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckIn = async (row) => {
    if (!row?.id || processingId) return;

    try {
      setProcessingId(row.id);
      await checkIn(row.id);
      await loadSchedule();
    } catch {
      // store đã toast
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckOut = async (row) => {
    if (!row?.id || processingId) return;

    try {
      setProcessingId(row.id);
      await checkOut(row.id);
      await loadSchedule();
    } catch {
      // store đã toast
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (row) => {
    if (!row?.id || processingId) return;

    const ok = window.confirm(
      "Xóa ca này sẽ xóa cấu hình ca nếu đang dùng chung. Bạn có chắc muốn tiếp tục?"
    );

    if (!ok) return;

    try {
      setProcessingId(row.id);
      await deleteShift(row.id, row.shiftConfigId);
      await loadSchedule();
      await loadShiftConfigs();
    } catch {
      // store đã toast
    } finally {
      setProcessingId(null);
    }
  };

  const goPrevWeek = () => {
    setWeekStart((prev) => addDays(prev, -7));
  };

  const goNextWeek = () => {
    setWeekStart((prev) => addDays(prev, 7));
  };

  const goPrevMonth = () => {
    const [year, month] = monthDate.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    setMonthDate(toLocalDateString(date));
  };

  const goNextMonth = () => {
    const [year, month] = monthDate.split("-").map(Number);
    const date = new Date(year, month, 1);
    setMonthDate(toLocalDateString(date));
  };

  const isBusy = loading || configLoading || loadingStaff;

  return (
    <div className="space-y-5 pb-10">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {t.title || "Lịch phân ca"}
          </h2>
          <p className="mt-0.5 text-sm italic text-gray-500">
            {t.subtitle ||
              "Quản lý lịch làm việc, phân công ca và theo dõi chấm công"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadSchedule}
            disabled={isBusy}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={isBusy ? "animate-spin" : ""} />
            Làm mới
          </button>

          <button
            onClick={openCreateModal}
            disabled={!franchiseId}
            className="flex items-center gap-2 rounded-xl bg-[#d9a13b] px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-[#c48f32] disabled:opacity-60"
          >
            <Plus size={16} />
            Phân công ca
          </button>
        </div>
      </div>

      {!franchiseId && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Không tìm thấy chi nhánh của Store Manager. Vui lòng kiểm tra user.franchiseId.
        </div>
      )}

      {/* VIEW CONTROLS */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["day", t.tabs?.day || "Ngày"],
              ["week", t.tabs?.week || "Tuần"],
              ["month", t.tabs?.month || "Tháng"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  viewMode === mode
                    ? "bg-[#d9a13b] text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewMode === "day" && (
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#d9a13b]"
              />
            )}

            {viewMode === "week" && (
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5">
                <button
                  onClick={goPrevWeek}
                  className="rounded-lg p-1 hover:bg-gray-100"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="min-w-[200px] px-2 text-center text-sm font-bold text-gray-700">
                  {weekRangeText}
                </span>

                <button
                  onClick={goNextWeek}
                  className="rounded-lg p-1 hover:bg-gray-100"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {viewMode === "month" && (
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5">
                <button
                  onClick={goPrevMonth}
                  className="rounded-lg p-1 hover:bg-gray-100"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="min-w-[160px] px-2 text-center text-sm font-bold text-gray-700">
                  {monthText}
                </span>

                <button
                  onClick={goNextMonth}
                  className="rounded-lg p-1 hover:bg-gray-100"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard
          icon={Clock}
          label={t.stats?.total || "Tổng ca"}
          value={stats.total}
          subtext="Tất cả ca trong phạm vi đang xem"
          color="text-blue-600"
          bg="bg-blue-50"
          active={statFilter === "total" || statFilter === "All"}
          onClick={() => handleStatFilter("total")}
        />

        <StatCard
          icon={Timer}
          label={t.stats?.assigned || "Đã phân công"}
          value={stats.assigned}
          subtext="Chờ nhân viên check-in"
          color="text-purple-600"
          bg="bg-purple-50"
          active={statFilter === "ASSIGNED"}
          onClick={() => handleStatFilter("ASSIGNED")}
        />

        <StatCard
          icon={UserCheck}
          label={t.stats?.checkedIn || "Đang làm"}
          value={stats.checkedIn}
          subtext="Nhân viên đã check-in"
          color="text-green-600"
          bg="bg-green-50"
          active={statFilter === "CHECKED_IN"}
          onClick={() => handleStatFilter("CHECKED_IN")}
        />

        <StatCard
          icon={CheckCircle2}
          label="Hoàn tất"
          value={stats.checkedOut}
          subtext="Đã check-out"
          color="text-emerald-600"
          bg="bg-emerald-50"
          active={statFilter === "CHECKED_OUT"}
          onClick={() => handleStatFilter("CHECKED_OUT")}
        />

        <StatCard
          icon={AlertCircle}
          label={t.stats?.absent || "Vắng / thiếu"}
          value={stats.absent + stats.incomplete}
          subtext="Vắng mặt hoặc quên check-out"
          color="text-red-600"
          bg="bg-red-50"
          active={statFilter === "ABSENT"}
          onClick={() => handleStatFilter("ABSENT")}
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />

            <input
              type="text"
              placeholder={t.filters?.placeholder || "Tìm theo tên nhân viên, mã nhân viên, ca..."}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#d9a13b]/20"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-600 outline-none"
            >
              {SHIFT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t.filters?.[option.value] || option.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setStatFilter("All");
              }}
              className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-600 outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t.status?.[option.value] || option.label}
                </option>
              ))}
            </select>

            {statusFilter !== "All" && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("All");
                  setStatFilter("All");
                }}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr_1.6fr] border-b border-gray-100 bg-gray-50/80">
          {[
            "Nhân viên",
            "Loại ca",
            "Ngày trực",
            "Thời gian",
            "Trạng thái",
            "Thao tác",
          ].map((label) => (
            <div
              key={label}
              className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-gray-400"
            >
              {label}
            </div>
          ))}
        </div>

        {isBusy ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-gray-400">
            <Loader2 size={18} className="animate-spin text-[#d9a13b]" />
            Đang tải dữ liệu phân ca...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-14 text-sm italic text-gray-400">
            Không tìm thấy ca trực nào.
          </div>
        ) : (
          filtered.map((row, index) => {
            const staff = staffMap[row.staffId];
            const status = row.status || "ASSIGNED";
            const StatusIcon = STATUS_ICON[status] || Clock;

            const canManagerCheckIn = status === "ASSIGNED" && getDate(row) === toLocalDateString();
            const canManagerCheckOut = status === "CHECKED_IN" && getDate(row) === toLocalDateString();
            const canMarkAbsent = status === "ASSIGNED";
            const canEdit = !["CHECKED_OUT", "INCOMPLETE", "ABSENT"].includes(status);

            return (
              <div
                key={`${row.id}-${row.staffId}-${row.workDate}-${index}`}
                className={`grid grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr_1.6fr] items-center transition-colors hover:bg-gray-50/60 ${
                  index < filtered.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                {/* Staff */}
                <div className="min-w-0 px-4 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-xs font-black text-slate-600">
                      {(staff?.name || row.staffName || "?").charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-800">
                        {staff?.name || row.staffName || String(row.staffId).slice(0, 8)}
                      </div>

                      <div className="truncate text-[10px] text-gray-400">
                        {staff?.phone || row.staffPhone || row.staffId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shift */}
                <div className="px-4 py-4">
                  <span className="whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    {getShiftName(row)}
                  </span>
                </div>

                {/* Date */}
                <div className="px-4 py-4">
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                    {fmtDate(getDate(row))}
                  </span>
                </div>

                {/* Time */}
                <div className="px-4 py-4">
                  <div className="whitespace-nowrap text-sm font-bold text-slate-900">
                    {fmtTime(row)}
                  </div>

                  <div className="mt-0.5 text-[10px] text-gray-400">
                    {fmtDuration(row)}
                    {row.lateMinutes > 0 && (
                      <span className="ml-1.5 font-semibold text-red-400">
                        · trễ {row.lateMinutes}p
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="px-4 py-4">
                  <span
                    className={`inline-flex w-full min-w-max items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      STATUS_STYLES[status] || STATUS_STYLES.ASSIGNED
                    }`}
                  >
                    <StatusIcon size={13} />
                    {getStatusLabel(status, t)}
                  </span>
                </div>

                {/* Actions */}
                <div className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {canEdit && (
                      <button
                        type="button"
                        disabled={processingId === row.id || actionLoading}
                        onClick={() => openEditModal(row)}
                        className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                        title="Sửa phân ca"
                      >
                        <Edit size={15} />
                      </button>
                    )}

                    {canManagerCheckIn && (
                      <button
                        type="button"
                        disabled={processingId === row.id || actionLoading}
                        onClick={() => handleCheckIn(row)}
                        className="rounded-lg border border-indigo-100 bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
                        title="Check-in"
                      >
                        <LogIn size={15} />
                      </button>
                    )}

                    {canManagerCheckOut && (
                      <button
                        type="button"
                        disabled={processingId === row.id || actionLoading}
                        onClick={() => handleCheckOut(row)}
                        className="rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                        title="Check-out"
                      >
                        <LogOut size={15} />
                      </button>
                    )}

                    {canMarkAbsent && (
                      <button
                        type="button"
                        disabled={processingId === row.id || actionLoading}
                        onClick={() => handleMarkAbsent(row)}
                        className="rounded-lg border border-red-100 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        title="Đánh dấu vắng"
                      >
                        <XCircle size={15} />
                      </button>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        disabled={processingId === row.id || actionLoading}
                        onClick={() => handleDelete(row)}
                        className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
                        title="Xóa ca"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ShiftModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={handleSaveShift}
        loading={actionLoading}
        initialData={editingShift}
        isStoreManager={true}
        mode="assign"
        shiftConfigs={shifts}
      />
    </div>
  );
}