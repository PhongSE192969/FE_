import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  Calendar,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Grid3x3,
  Info,
  List,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Sun,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion as Motion, AnimatePresence } from "framer-motion";

import useShiftStore from "@/stores/shiftStore";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { ENDPOINTS } from "@/config/api";
import { useSSE } from "@/hooks/useSSE";
import {
  normalizeDate,
  normalizeTime,
  toLocalDateString,
} from "@/services/shiftService";

const STATUS_STYLES = {
  ASSIGNED: "bg-purple-50 text-purple-600 border-purple-200",
  CHECKED_IN: "bg-indigo-50 text-indigo-600 border-indigo-200",
  CHECKED_OUT: "bg-emerald-50 text-emerald-600 border-emerald-200",
  ABSENT: "bg-rose-50 text-rose-500 border-rose-200",
  INCOMPLETE: "bg-amber-50 text-amber-600 border-amber-200",
};

const SHIFT_ICONS = {
  morning: Sun,
  afternoon: Coffee,
  evening: Moon,
};

const getShiftType = (name) => {
  if (!name) return "morning";

  const value = String(name).toLowerCase();

  if (value.includes("sáng") || value.includes("morning")) return "morning";
  if (value.includes("chiều") || value.includes("afternoon")) return "afternoon";
  if (value.includes("tối") || value.includes("evening")) return "evening";

  return "morning";
};

const getDate = (row) => normalizeDate(row?.workDate || row?.work_date);
const getStart = (row) =>
  normalizeTime(row?.shiftStartTime || row?.startTime || row?.start_time);
const getEnd = (row) =>
  normalizeTime(row?.shiftEndTime || row?.endTime || row?.end_time);

const fmtTime = (row) => {
  const start = getStart(row);
  const end = getEnd(row);

  if (start && end) return `${start} - ${end}`;
  return start || end || "—";
};

const fmtDate = (dateValue, language = "vi") => {
  const value = normalizeDate(dateValue);

  if (!value) {
    return {
      full: "",
      day: "",
      month: "",
      year: "",
      short: "",
      iso: "",
      weekday: "",
      weekdayLong: "",
      monthName: "",
    };
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const locale = language === "en" ? "en-US" : language === "jp" ? "ja-JP" : "vi-VN";

  return {
    full: date.toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    short: `${date.getDate()}/${date.getMonth() + 1}`,
    iso: value,
    weekday: date.toLocaleDateString(locale, { weekday: "short" }),
    weekdayLong: date.toLocaleDateString(locale, { weekday: "long" }),
    monthName: date.toLocaleDateString(locale, { month: "long" }),
  };
};

const getLocalMonthRange = (date = new Date()) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    startDate: toLocalDateString(first),
    endDate: toLocalDateString(last),
  };
};

const getDaysInMonthGrid = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    days.push(toLocalDateString(current));
  }

  return days;
};

const getUserFranchiseId = (user) => {
  return (
    user?.franchise?.id ||
    user?.franchiseId ||
    user?.franchise_id ||
    localStorage.getItem("franchiseId") ||
    null
  );
};

const translateShift = (name, t) => {
  const type = getShiftType(name);

  return t.shifts?.[type] || name || "Ca làm việc";
};

const getStatusLabel = (status, t) => {
  return t.status?.[status] || status || "—";
};

const canCheckInNow = (shift) => {
  if (!shift || shift.status !== "ASSIGNED") return false;

  const today = toLocalDateString();
  return getDate(shift) === today;
};

const canCheckOutNow = (shift) => {
  if (!shift || shift.status !== "CHECKED_IN") return false;

  const today = toLocalDateString();
  return getDate(shift) === today;
};

const StatCard = ({
  icon,
  label,
  value,
  subtext,
  onClick,
  isActive,
}) => {
  const Icon = icon;

  return (
    <Motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border-2 bg-white p-5 shadow-sm transition-all ${
        isActive
          ? "border-purple-500 ring-2 ring-purple-100"
          : "border-purple-50 hover:border-purple-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200">
          {Icon && <Icon size={20} />}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-xs font-medium text-purple-600">{label}</div>
        {subtext && (
          <div className="text-[11px] font-medium text-gray-400">{subtext}</div>
        )}
      </div>
    </Motion.div>
  );
};

const CalendarCell = ({
  date,
  shifts,
  isCurrentMonth,
  selectedDate,
  onSelect,
  lt,
}) => {
  const dayShifts = shifts.filter((shift) => getDate(shift) === date);
  const isToday = date === toLocalDateString();
  const isSelected = date === selectedDate;

  const getStatusColor = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "CHECKED_IN":
        return "border-indigo-200 bg-indigo-50";
      case "CHECKED_OUT":
        return "border-emerald-200 bg-emerald-50";
      case "ABSENT":
        return "border-rose-200 bg-rose-50";
      case "INCOMPLETE":
        return "border-amber-200 bg-amber-50";
      default:
        return "border-purple-200 bg-purple-50";
    }
  };

  return (
    <Motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={() => onSelect(date)}
      className={`min-h-[105px] cursor-pointer rounded-xl border-2 p-2 transition-all ${
        isCurrentMonth ? "bg-white" : "bg-gray-50/50"
      } ${isSelected ? "border-purple-500 ring-2 ring-purple-500" : "border-purple-100"} ${
        isToday ? "bg-gradient-to-br from-purple-50 to-indigo-50" : ""
      }`}
    >
      <div
        className={`mb-2 flex items-center justify-between text-sm font-bold ${
          isToday
            ? "text-purple-600"
            : isCurrentMonth
              ? "text-slate-700"
              : "text-gray-400"
        }`}
      >
        <span>{date.split("-")[2].replace(/^0/, "")}</span>

        {isToday && (
          <span className="rounded-full bg-purple-200 px-1.5 py-0.5 text-[8px] font-bold text-purple-700">
            {lt.todayBadge}
          </span>
        )}
      </div>

      {dayShifts.length > 0 ? (
        <div className="space-y-1">
          {dayShifts.slice(0, 2).map((shift) => {
            const type = getShiftType(shift.shiftName);
            const Icon = SHIFT_ICONS[type] || Clock;

            return (
              <div
                key={shift.id}
                className={`flex items-center gap-1 rounded-lg p-1 text-[10px] font-medium ${getStatusColor(
                  shift.status
                )}`}
              >
                <Icon size={8} />
                <span className="flex-1 truncate">{fmtTime(shift)}</span>
                <span
                  className={`h-1 w-1 rounded-full ${
                    shift.status === "CHECKED_IN"
                      ? "bg-indigo-500"
                      : shift.status === "CHECKED_OUT"
                        ? "bg-emerald-500"
                        : shift.status === "ABSENT"
                          ? "bg-rose-500"
                          : shift.status === "INCOMPLETE"
                            ? "bg-amber-500"
                            : "bg-purple-500"
                  }`}
                />
              </div>
            );
          })}

          {dayShifts.length > 2 && (
            <div className="text-center text-[8px] font-semibold text-purple-400">
              +{dayShifts.length - 2}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-[45px] items-center justify-center">
          <span className="text-[8px] text-gray-300">—</span>
        </div>
      )}
    </Motion.div>
  );
};

const RegisterShiftModal = ({
  open,
  onClose,
  selectedDate,
  setSelectedDate,
  shiftConfigs,
  actionLoading,
  onRegister,
}) => {
  const [shiftConfigId, setShiftConfigId] = useState("");

  useEffect(() => {
    if (open && shiftConfigs.length > 0 && !shiftConfigId) {
      setShiftConfigId(shiftConfigs[0].id);
    }
  }, [open, shiftConfigs, shiftConfigId]);

  if (!open) return null;

  const selectedConfig = shiftConfigs.find(
    (item) => String(item.id) === String(shiftConfigId)
  );

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <Motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 bg-purple-50/70 px-6 py-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Đăng ký ca làm
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Chọn ngày và ca làm tại chi nhánh của bạn
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-white hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-400">
                Ngày làm việc
              </label>
              <input
                type="date"
                value={selectedDate}
                min={toLocalDateString()}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-400">
                Ca muốn đăng ký
              </label>
              <select
                value={shiftConfigId}
                onChange={(event) => setShiftConfigId(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                {shiftConfigs.length === 0 ? (
                  <option value="">Chưa có cấu hình ca</option>
                ) : (
                  shiftConfigs.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} — {shift.startTime} - {shift.endTime}
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedConfig && (
              <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-800">
                <p className="font-bold">{selectedConfig.name}</p>
                <p className="mt-1 text-xs">
                  Thời gian: {selectedConfig.startTime} - {selectedConfig.endTime}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs leading-relaxed text-amber-700">
              Backend hiện tại tạo ca đăng ký trực tiếp ở trạng thái{" "}
              <b>ASSIGNED</b>. Chưa có bước chờ duyệt riêng.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={actionLoading || !shiftConfigId || shiftConfigs.length === 0}
                onClick={() => onRegister(shiftConfigId)}
                className="flex-[2] rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-purple-100 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={15} className="animate-spin" />
                    Đang đăng ký...
                  </span>
                ) : (
                  "Đăng ký ca"
                )}
              </button>
            </div>
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default function MyShift() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();

  const t = useMemo(
    () => (translations[language] || translations.vi).staff?.myShift || {},
    [language]
  );

  const lt = useMemo(
    () => ({
      todayBadge: language === "en" ? "Today" : "Hôm nay",
      tipsTitle: language === "en" ? "📋 Tips" : "📋 Mẹo nhỏ",
      tipCheckIn:
        language === "en"
          ? "Check in on time to avoid being marked late."
          : "Check-in đúng giờ để tránh bị tính muộn.",
      tipCheckOut:
        language === "en"
          ? "Check out at the end of your shift."
          : "Check-out khi kết thúc ca làm việc.",
      tipRegister:
        language === "en"
          ? "Use register shift to choose an available shift."
          : "Dùng đăng ký ca để chọn ca còn phù hợp.",
      noShift:
        language === "en" ? "No shift" : "Không có ca",
      loading:
        language === "en" ? "Loading..." : "Đang tải...",
    }),
    [language]
  );

  const {
    shifts: shiftConfigs,
    myShifts,
    loading,
    actionLoading,
    fetchShifts,
    fetchFullYearMySchedule,
    registerShift,
    checkIn,
    checkOut,
    fetchPersonalStats,
  } = useShiftStore();

  const staffId = user?.id;
  const franchiseId = getUserFranchiseId(user);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toLocalDateString());
  const [viewMode, setViewMode] = useState("month");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerDate, setRegisterDate] = useState(toLocalDateString());

  const { data: realtimeUpdate } = useSSE(ENDPOINTS.PROTECTED.SHIFTS.events);

  const monthDays = useMemo(
    () => getDaysInMonthGrid(currentMonth),
    [currentMonth]
  );

  const currentMonthRange = useMemo(
    () => getLocalMonthRange(currentMonth),
    [currentMonth]
  );

  const shiftsInCurrentMonth = useMemo(() => {
    const start = currentMonthRange.startDate;
    const end = currentMonthRange.endDate;

    return myShifts.filter((shift) => {
      const date = getDate(shift);
      return date >= start && date <= end;
    });
  }, [myShifts, currentMonthRange]);

  const selectedDateShifts = useMemo(() => {
    return myShifts
      .filter((shift) => getDate(shift) === selectedDate)
      .sort((a, b) => getStart(a).localeCompare(getStart(b)));
  }, [myShifts, selectedDate]);

  const filteredListShifts = useMemo(() => {
    const list = [...myShifts].sort((a, b) => {
      const dateA = new Date(getDate(a)).getTime();
      const dateB = new Date(getDate(b)).getTime();

      if (dateB !== dateA) return dateB - dateA;
      return getStart(a).localeCompare(getStart(b));
    });

    if (filterStatus === "ALL") return list;

    if (filterStatus === "COMPLETED") {
      return list.filter((shift) =>
        ["CHECKED_OUT", "COMPLETED", "INCOMPLETE"].includes(
          String(shift.status || "").toUpperCase()
        )
      );
    }

    return list.filter(
      (shift) => String(shift.status || "").toUpperCase() === filterStatus
    );
  }, [myShifts, filterStatus]);

  const currentShift = useMemo(() => {
    const now = new Date();
    const today = toLocalDateString();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    return (
      myShifts.find((shift) => {
        return (
          getDate(shift) === today &&
          getStart(shift) <= currentTime &&
          getEnd(shift) >= currentTime
        );
      }) || null
    );
  }, [myShifts]);

  const nextShift = useMemo(() => {
    const now = new Date();
    const today = toLocalDateString();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    return (
      myShifts
        .filter((shift) => {
          return (
            getDate(shift) === today &&
            getStart(shift) > currentTime &&
            !["ABSENT", "CHECKED_OUT", "INCOMPLETE"].includes(shift.status)
          );
        })
        .sort((a, b) => getStart(a).localeCompare(getStart(b)))[0] || null
    );
  }, [myShifts]);

  const currentFmtDate = useMemo(
    () => fmtDate(selectedDate, language),
    [selectedDate, language]
  );

  const currentViewMonthName = useMemo(() => {
    const locale = language === "en" ? "en-US" : language === "jp" ? "ja-JP" : "vi-VN";
    return currentMonth.toLocaleDateString(locale, { month: "long" });
  }, [currentMonth, language]);

  const personalStats = useMemo(() => {
    const total = stats?.totalShifts ?? myShifts.length;
    const completed =
      stats?.totalCompleted ??
      myShifts.filter((shift) => shift.status === "CHECKED_OUT").length;
    const absent =
      stats?.totalAbsent ??
      myShifts.filter((shift) => shift.status === "ABSENT").length;

    return {
      total,
      completed,
      absent,
    };
  }, [stats, myShifts]);

  const loadInitialData = useCallback(async () => {
    if (!staffId) return;

    try {
      if (franchiseId) {
        await fetchShifts(franchiseId);
      }

      await fetchFullYearMySchedule(staffId);

      setStatsLoading(true);
      const personal = await fetchPersonalStats(staffId);
      setStats(personal);
    } finally {
      setStatsLoading(false);
    }
  }, [staffId, franchiseId, fetchShifts, fetchFullYearMySchedule, fetchPersonalStats]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!realtimeUpdate || !staffId) return;

    const eventStaffId =
      realtimeUpdate?.staffId ||
      realtimeUpdate?.data?.staffId ||
      realtimeUpdate?.data?.staff_id;

    if (eventStaffId && String(eventStaffId) !== String(staffId)) {
      return;
    }

    loadInitialData();
  }, [realtimeUpdate, staffId, loadInitialData]);

  const isCurrentMonth = useCallback(
    (dateStr) => {
      const [year, month] = dateStr.split("-").map(Number);

      return (
        year === currentMonth.getFullYear() &&
        month === currentMonth.getMonth() + 1
      );
    },
    [currentMonth]
  );

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    const today = toLocalDateString();

    setSelectedDate(today);
    setCurrentMonth(new Date());
    setViewMode("month");
    toast.success("Đã chuyển đến hôm nay");
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);

    const [year, month] = date.split("-").map(Number);

    if (
      year !== currentMonth.getFullYear() ||
      month !== currentMonth.getMonth() + 1
    ) {
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  };

  const handleCheckIn = async (assignmentId) => {
    try {
      await checkIn(assignmentId);

      const personal = await fetchPersonalStats(staffId);
      setStats(personal);
    } catch {
      // store đã toast
    }
  };

  const handleCheckOut = async (assignmentId) => {
    try {
      await checkOut(assignmentId);

      const personal = await fetchPersonalStats(staffId);
      setStats(personal);
    } catch {
      // store đã toast
    }
  };

  const handleRegisterShift = async (shiftConfigId) => {
    if (!staffId) {
      toast.error("Không tìm thấy thông tin nhân viên");
      return;
    }

    if (!franchiseId) {
      toast.error("Không tìm thấy chi nhánh của nhân viên");
      return;
    }

    const alreadyHasShift = myShifts.some((shift) => {
      return getDate(shift) === registerDate;
    });

    if (alreadyHasShift) {
      toast.error("Bạn đã có ca trong ngày này");
      return;
    }

    try {
      await registerShift({
        staffId,
        shiftConfigId,
        workDate: registerDate,
      });

      setRegisterModalOpen(false);
      await fetchFullYearMySchedule(staffId);
    } catch {
      // store đã toast
    }
  };

  const openRegisterModal = () => {
    setRegisterDate(selectedDate >= toLocalDateString() ? selectedDate : toLocalDateString());
    setRegisterModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      {/* HEADER */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="px-6 py-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black">
                {t.title || "Lịch làm việc"}
              </h1>
              <p className="mt-1 text-sm text-purple-100">
                Xem lịch cá nhân, check-in/check-out và đăng ký ca làm
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {loading && (
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5">
                  <RefreshCw size={14} className="animate-spin" />
                  <span className="text-xs">{lt.loading}</span>
                </div>
              )}

              <button
                type="button"
                onClick={openRegisterModal}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-purple-700 shadow-sm transition hover:bg-purple-50"
              >
                <Plus size={16} />
                Đăng ký ca
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-1 text-xs text-purple-200">
                {t.quickInfo?.currentShift || "Ca hiện tại"}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Sun size={16} />
                <span className="truncate">
                  {currentShift
                    ? `${translateShift(currentShift.shiftName, t)} (${fmtTime(
                        currentShift
                      )})`
                    : lt.noShift}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-1 text-xs text-purple-200">
                {t.quickInfo?.status || "Trạng thái"}
              </div>
              <div className="flex items-center gap-2 font-bold">
                <span
                  className={`h-2 w-2 rounded-full ${
                    currentShift ? "bg-emerald-400" : "bg-gray-400"
                  }`}
                />
                <span>
                  {currentShift
                    ? getStatusLabel(currentShift.status, t)
                    : t.quickInfo?.outOfShift || "Ngoài ca"}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-1 text-xs text-purple-200">
                {t.quickInfo?.nextShift || "Ca tiếp theo"}
              </div>
              <div className="truncate text-sm font-bold">
                {nextShift
                  ? `${translateShift(nextShift.shiftName, t)} (${fmtTime(nextShift)})`
                  : lt.noShift}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      {!statsLoading && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={Clock}
            label={t.stats?.totalShifts || "Tổng ca"}
            value={personalStats.total}
            subtext="Tổng số ca đã được phân công/đăng ký"
            isActive={filterStatus === "ALL"}
            onClick={() => {
              setFilterStatus("ALL");
              setViewMode("list");
            }}
          />

          <StatCard
            icon={Award}
            label={t.stats?.completed || "Đã hoàn thành"}
            value={personalStats.completed}
            subtext="Ca đã check-out"
            isActive={filterStatus === "COMPLETED"}
            onClick={() => {
              setFilterStatus("COMPLETED");
              setViewMode("list");
            }}
          />

          <StatCard
            icon={AlertCircle}
            label={t.stats?.absent || "Vắng mặt"}
            value={personalStats.absent}
            subtext="Ca bị đánh dấu vắng"
            isActive={filterStatus === "ABSENT"}
            onClick={() => {
              setFilterStatus("ABSENT");
              setViewMode("list");
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-4 lg:col-span-2">
          {/* VIEW CONTROL */}
          <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                {viewMode === "month" && (
                  <>
                    <button
                      onClick={prevMonth}
                      disabled={loading}
                      className="rounded-xl p-2 text-purple-600 transition hover:bg-purple-50 disabled:opacity-50"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <h3 className="text-lg font-black text-purple-900">
                      Tháng {currentViewMonthName}, {currentMonth.getFullYear()}
                    </h3>

                    <button
                      onClick={nextMonth}
                      disabled={loading}
                      className="rounded-xl p-2 text-purple-600 transition hover:bg-purple-50 disabled:opacity-50"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {viewMode === "list" && (
                  <h3 className="text-lg font-black text-purple-900">
                    Danh sách ca làm
                  </h3>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={goToToday}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {t.controls?.today || "Hôm nay"}
                </button>

                <div className="flex rounded-xl border border-slate-200/50 bg-slate-100 p-1">
                  <button
                    onClick={() => setViewMode("month")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      viewMode === "month"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Grid3x3 size={14} />
                    {t.controls?.monthView || "Lịch tháng"}
                  </button>

                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      viewMode === "list"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <List size={14} />
                    {t.controls?.listView || "Danh sách"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CALENDAR / LIST */}
          <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
            {loading && myShifts.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-14 text-sm text-gray-400">
                <Loader2 size={18} className="animate-spin text-purple-500" />
                Đang tải lịch làm việc...
              </div>
            ) : viewMode === "month" ? (
              <div className="p-4">
                <div className="mb-2 grid grid-cols-7 gap-1 border-b border-purple-50 py-2 text-center text-xs font-bold text-purple-400">
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((date) => (
                    <CalendarCell
                      key={date}
                      date={date}
                      shifts={shiftsInCurrentMonth}
                      isCurrentMonth={isCurrentMonth(date)}
                      selectedDate={selectedDate}
                      onSelect={handleSelectDate}
                      lt={lt}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-black text-slate-800">
                    <List size={20} className="text-purple-600" />
                    Danh sách ca làm việc
                  </h3>

                  {filterStatus !== "ALL" && (
                    <button
                      onClick={() => setFilterStatus("ALL")}
                      className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>

                {filteredListShifts.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarDays
                      size={48}
                      className="mx-auto mb-3 text-slate-300"
                      strokeWidth={1.5}
                    />
                    <p className="font-bold text-slate-400">
                      Chưa có ca làm việc nào
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredListShifts.map((shift) => {
                      const type = getShiftType(shift.shiftName);
                      const Icon = SHIFT_ICONS[type] || Clock;
                      const dateInfo = fmtDate(getDate(shift), language);

                      return (
                        <Motion.div
                          key={shift.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => handleSelectDate(getDate(shift))}
                          className="cursor-pointer rounded-xl border border-purple-100 bg-purple-50/30 p-4 transition hover:bg-purple-50"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                                STATUS_STYLES[shift.status] ||
                                "bg-purple-100 text-purple-600"
                              }`}
                            >
                              <Icon size={20} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-3">
                                <span className="font-bold text-slate-900">
                                  {translateShift(shift.shiftName, t)}
                                </span>
                                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-600">
                                  {dateInfo.weekday}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <CalendarDays size={12} />
                                  {dateInfo.full}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {fmtTime(shift)}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-bold ${
                                STATUS_STYLES[shift.status] ||
                                "bg-purple-100 text-purple-600 border-purple-200"
                              }`}
                            >
                              {getStatusLabel(shift.status, t)}
                            </span>
                          </div>
                        </Motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-5 text-white shadow-lg">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <CalendarDays size={24} />
              </div>

              <div>
                <div className="text-sm text-purple-100">
                  {currentFmtDate.weekdayLong}
                </div>
                <div className="text-2xl font-black">{currentFmtDate.full}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-purple-100">
              <Clock size={14} />
              <span>{selectedDateShifts.length} ca trực</span>
              {selectedDate === toLocalDateString() && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  Hôm nay
                </span>
              )}
            </div>
          </div>

          <div className="min-h-[300px] rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black text-purple-900">
                {selectedDate === toLocalDateString()
                  ? "Ca trực hôm nay"
                  : `Ca trực ngày ${currentFmtDate.day}`}
              </h3>

              <span className="rounded-lg bg-purple-100 px-2 py-1 text-xs font-bold text-purple-600">
                {selectedDateShifts.length} ca
              </span>
            </div>

            <AnimatePresence mode="wait">
              {selectedDateShifts.length === 0 ? (
                <Motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="py-8 text-center"
                >
                  <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100">
                    <Calendar size={24} className="text-purple-400" />
                  </div>

                  <p className="font-medium text-purple-600">
                    {selectedDate === toLocalDateString()
                      ? "Hôm nay bạn chưa có ca"
                      : "Ngày này chưa có ca"}
                  </p>

                  <button
                    onClick={openRegisterModal}
                    className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white transition hover:bg-purple-700"
                  >
                    Đăng ký ca ngày này
                  </button>
                </Motion.div>
              ) : (
                <Motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {selectedDateShifts.map((shift) => {
                    const type = getShiftType(shift.shiftName);
                    const Icon = SHIFT_ICONS[type] || Clock;

                    return (
                      <Motion.div
                        key={shift.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`rounded-xl border-2 p-4 transition-all ${
                          STATUS_STYLES[shift.status] ||
                          "border-purple-100 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                              STATUS_STYLES[shift.status] ||
                              "bg-purple-100 text-purple-600"
                            }`}
                          >
                            <Icon size={24} />
                          </div>

                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <h4 className="font-black text-slate-900">
                                {translateShift(shift.shiftName, t)}
                              </h4>

                              <span
                                className={`rounded-lg px-2 py-1 text-xs font-bold ${
                                  STATUS_STYLES[shift.status]
                                }`}
                              >
                                {getStatusLabel(shift.status, t)}
                              </span>
                            </div>

                            <div className="mb-3 space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={14} />
                                <span className="font-medium">
                                  {fmtTime(shift)}
                                </span>
                              </div>

                              {shift.checkInTime && (
                                <div className="flex items-center gap-2 text-emerald-600">
                                  <LogIn size={14} />
                                  <span className="text-xs">
                                    Check-in: {shift.checkInTime}
                                  </span>
                                </div>
                              )}

                              {shift.checkOutTime && (
                                <div className="flex items-center gap-2 text-rose-600">
                                  <LogOut size={14} />
                                  <span className="text-xs">
                                    Check-out: {shift.checkOutTime}
                                  </span>
                                </div>
                              )}

                              {shift.note && (
                                <div className="flex items-center gap-2 text-amber-600">
                                  <Info size={14} />
                                  <span className="text-xs">{shift.note}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {canCheckInNow(shift) && (
                                <button
                                  onClick={() => handleCheckIn(shift.id)}
                                  disabled={actionLoading}
                                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-2 text-xs font-bold text-white shadow-md shadow-purple-200 transition hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50"
                                >
                                  <LogIn size={14} />
                                  Check-in
                                </button>
                              )}

                              {canCheckOutNow(shift) && (
                                <button
                                  onClick={() => handleCheckOut(shift.id)}
                                  disabled={actionLoading}
                                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
                                >
                                  <LogOut size={14} />
                                  Check-out
                                </button>
                              )}

                              {!canCheckInNow(shift) && !canCheckOutNow(shift) && (
                                <div className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-400">
                                  <CheckCircle size={14} />
                                  Không có thao tác
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Motion.div>
                    );
                  })}
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-5">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-md">
                <Info size={18} />
              </div>

              <div>
                <h4 className="mb-2 text-sm font-black text-purple-900">
                  {lt.tipsTitle}
                </h4>

                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2 text-purple-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    <span>{lt.tipCheckIn}</span>
                  </li>
                  <li className="flex items-center gap-2 text-purple-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    <span>{lt.tipCheckOut}</span>
                  </li>
                  <li className="flex items-center gap-2 text-purple-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    <span>{lt.tipRegister}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RegisterShiftModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        selectedDate={registerDate}
        setSelectedDate={setRegisterDate}
        shiftConfigs={shiftConfigs.filter((item) => item.status !== false)}
        actionLoading={actionLoading}
        onRegister={handleRegisterShift}
      />
    </div>
  );
}