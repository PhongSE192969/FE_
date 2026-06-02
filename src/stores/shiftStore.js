// src/stores/shiftStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import shiftService, {
  normalizeDate,
  normalizeTime,
  normalizeStaffShift,
  normalizeShiftConfig,
  toLocalDateString,
} from "@/services/shiftService";

const DEFAULT_SHIFT_NAMES = ["Ca sáng", "Ca chiều", "Ca tối"];

const getCurrentMonthRange = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: toLocalDateString(first),
    endDate: toLocalDateString(last),
  };
};

const getYearRange = (offsetBefore = 1, offsetAfter = 1) => {
  const year = new Date().getFullYear();

  return {
    startDate: `${year - offsetBefore}-01-01`,
    endDate: `${year + offsetAfter}-12-31`,
  };
};

const mergeById = (oldList = [], newList = []) => {
  const map = new Map();

  oldList.forEach((item) => {
    if (item?.id) map.set(String(item.id), item);
  });

  newList.forEach((item) => {
    if (!item?.id) return;

    const oldItem = map.get(String(item.id));

    map.set(String(item.id), {
      ...(oldItem || {}),
      ...item,
      shiftName: item.shiftName || oldItem?.shiftName,
      shiftStartTime: item.shiftStartTime || oldItem?.shiftStartTime,
      shiftEndTime: item.shiftEndTime || oldItem?.shiftEndTime,
    });
  });

  return Array.from(map.values());
};

const removeById = (list = [], id) => {
  return list.filter((item) => String(item.id) !== String(id));
};

const isTerminalStatus = (status) => {
  return ["CHECKED_OUT", "ABSENT", "INCOMPLETE"].includes(status);
};

const buildShiftConfigPayload = ({
  franchiseId,
  shiftType,
  name,
  startTime,
  endTime,
  breakMinutes,
}) => ({
  franchiseId,
  name: name || shiftType || "Ca làm việc",
  startTime: normalizeTime(startTime),
  endTime: normalizeTime(endTime),
  breakMinutes: breakMinutes ?? null,
});

const buildAssignmentPayload = ({ staffId, shiftConfigId, workDate }) => ({
  staffId,
  shiftConfigId,
  workDate: normalizeDate(workDate),
});

const useShiftStore = create((set, get) => ({
  // Data chính
  schedule: [],
  shifts: [],
  myShifts: [],

  // Loading
  loading: false,
  actionLoading: false,
  configLoading: false,
  error: null,

  // UI state
  currentDate: toLocalDateString(),
  selectedFranchiseId: null,

  searchQuery: "",
  statusFilter: "all",
  typeFilter: "all",
  page: 1,
  pageSize: 10,

  // =========================
  // Helpers
  // =========================
  setCurrentDate: (date) => {
    set({
      currentDate: normalizeDate(date) || toLocalDateString(),
    });
  },

  setSelectedFranchiseId: (franchiseId) => {
    set({
      selectedFranchiseId: franchiseId || null,
    });
  },

  clearSchedule: () => {
    set({
      schedule: [],
      myShifts: [],
      error: null,
    });
  },

  resetAll: () => {
    set({
      schedule: [],
      shifts: [],
      myShifts: [],
      loading: false,
      actionLoading: false,
      configLoading: false,
      error: null,
      currentDate: toLocalDateString(),
      searchQuery: "",
      statusFilter: "all",
      typeFilter: "all",
      page: 1,
    });
  },

  // =========================
  // SHIFT CONFIGURATION
  // =========================
  fetchShifts: async (franchiseId) => {
    if (!franchiseId) {
      set({
        shifts: [],
        configLoading: false,
      });
      return [];
    }

    set({
      configLoading: true,
      error: null,
      selectedFranchiseId: franchiseId,
    });

    try {
      const data = await shiftService.getShiftConfigsByFranchise(franchiseId);
      const normalized = Array.isArray(data) ? data.map(normalizeShiftConfig) : [];

      set({
        shifts: normalized,
        configLoading: false,
      });

      return normalized;
    } catch (error) {
      console.error("❌ fetchShifts:", error);

      set({
        shifts: [],
        configLoading: false,
        error: error?.message || "Không thể tải danh sách ca",
      });

      toast.error(error?.message || "Không thể tải danh sách ca");
      return [];
    }
  },

  createShiftConfig: async (payload) => {
    set({
      actionLoading: true,
      error: null,
    });

    try {
      const created = await shiftService.createShiftConfig(
        buildShiftConfigPayload(payload)
      );

      set((state) => ({
        shifts: [created, ...state.shifts],
        actionLoading: false,
      }));

      toast.success("Tạo cấu hình ca thành công");
      return created;
    } catch (error) {
      console.error("❌ createShiftConfig:", error);

      set({
        actionLoading: false,
        error: error?.message || "Tạo cấu hình ca thất bại",
      });

      toast.error(error?.message || "Tạo cấu hình ca thất bại");
      throw error;
    }
  },

  updateShiftConfig: async (shiftConfigId, payload) => {
    if (!shiftConfigId) return null;

    set({
      actionLoading: true,
      error: null,
    });

    try {
      const updated = await shiftService.updateShiftConfig(
        shiftConfigId,
        buildShiftConfigPayload(payload)
      );

      set((state) => ({
        shifts: state.shifts.map((shift) =>
          String(shift.id) === String(shiftConfigId) ? updated : shift
        ),
        schedule: state.schedule.map((item) =>
          String(item.shiftConfigId) === String(shiftConfigId)
            ? {
                ...item,
                shiftName: updated.name,
                shiftStartTime: updated.startTime,
                shiftEndTime: updated.endTime,
              }
            : item
        ),
        myShifts: state.myShifts.map((item) =>
          String(item.shiftConfigId) === String(shiftConfigId)
            ? {
                ...item,
                shiftName: updated.name,
                shiftStartTime: updated.startTime,
                shiftEndTime: updated.endTime,
              }
            : item
        ),
        actionLoading: false,
      }));

      toast.success("Cập nhật cấu hình ca thành công");
      return updated;
    } catch (error) {
      console.error("❌ updateShiftConfig:", error);

      set({
        actionLoading: false,
        error: error?.message || "Cập nhật cấu hình ca thất bại",
      });

      toast.error(error?.message || "Cập nhật cấu hình ca thất bại");
      throw error;
    }
  },

  deleteShiftConfig: async (shiftConfigId) => {
    if (!shiftConfigId) return false;

    set({
      actionLoading: true,
      error: null,
    });

    try {
      await shiftService.deleteShiftConfig(shiftConfigId);

      set((state) => ({
        shifts: state.shifts.filter(
          (shift) => String(shift.id) !== String(shiftConfigId)
        ),
        schedule: state.schedule.filter(
          (item) => String(item.shiftConfigId) !== String(shiftConfigId)
        ),
        myShifts: state.myShifts.filter(
          (item) => String(item.shiftConfigId) !== String(shiftConfigId)
        ),
        actionLoading: false,
      }));

      toast.success("Xóa ca thành công");
      return true;
    } catch (error) {
      console.error("❌ deleteShiftConfig:", error);

      set({
        actionLoading: false,
        error: error?.message || "Xóa ca thất bại",
      });

      toast.error(error?.message || "Xóa ca thất bại");
      throw error;
    }
  },

  // =========================
  // SCHEDULE
  // =========================
  fetchSchedule: async (date, staffId = null) => {
    const targetDate = normalizeDate(date) || get().currentDate;

    set({
      loading: true,
      error: null,
      currentDate: targetDate,
    });

    try {
      const rows = await shiftService.getScheduleByDate(targetDate, staffId);
      const normalized = rows.map(normalizeStaffShift);

      set((state) => ({
        schedule: mergeById(state.schedule, normalized),
        loading: false,
      }));

      return normalized;
    } catch (error) {
      console.error("❌ fetchSchedule:", error);

      set({
        loading: false,
        error: error?.message || "Không thể tải lịch ca",
      });

      toast.error(error?.message || "Không thể tải lịch ca");
      return [];
    }
  },

  fetchScheduleRange: async (staffId, startDate, endDate) => {
    const safeStart = normalizeDate(startDate);
    const safeEnd = normalizeDate(endDate);

    if (!safeStart || !safeEnd) return [];

    set({
      loading: true,
      error: null,
    });

    try {
      const rows = await shiftService.getScheduleRange(staffId, safeStart, safeEnd);
      const normalized = rows.map(normalizeStaffShift);

      set((state) => ({
        schedule: mergeById(state.schedule, normalized),
        myShifts: staffId ? mergeById(state.myShifts, normalized) : state.myShifts,
        loading: false,
      }));

      return normalized;
    } catch (error) {
      console.error("❌ fetchScheduleRange:", error);

      set({
        loading: false,
        error: error?.message || "Không thể tải lịch theo khoảng ngày",
      });

      toast.error(error?.message || "Không thể tải lịch theo khoảng ngày");
      return [];
    }
  },

  fetchMyScheduleRange: async (staffId, startDate, endDate) => {
    if (!staffId) return [];

    const safeStart = normalizeDate(startDate);
    const safeEnd = normalizeDate(endDate);

    if (!safeStart || !safeEnd) return [];

    set({
      loading: true,
      error: null,
    });

    try {
      const rows = await shiftService.getScheduleRange(staffId, safeStart, safeEnd);
      const normalized = rows.map(normalizeStaffShift);

      set((state) => ({
        myShifts: mergeById(state.myShifts, normalized),
        schedule: mergeById(state.schedule, normalized),
        loading: false,
      }));

      return normalized;
    } catch (error) {
      console.error("❌ fetchMyScheduleRange:", error);

      set({
        loading: false,
        error: error?.message || "Không thể tải lịch cá nhân",
      });

      toast.error(error?.message || "Không thể tải lịch cá nhân");
      return [];
    }
  },

  fetchCurrentMonthSchedule: async (staffId = null) => {
    const { startDate, endDate } = getCurrentMonthRange();

    return staffId
      ? get().fetchMyScheduleRange(staffId, startDate, endDate)
      : get().fetchScheduleRange(null, startDate, endDate);
  },

  fetchFullYearMySchedule: async (staffId) => {
    const { startDate, endDate } = getYearRange(1, 1);

    return get().fetchMyScheduleRange(staffId, startDate, endDate);
  },

  // =========================
  // ASSIGN / REGISTER SHIFT
  // =========================
  assignShift: async (payload) => {
    set({
      actionLoading: true,
      error: null,
    });

    try {
      const created = await shiftService.assignShift(buildAssignmentPayload(payload));

      const shiftConfig = get().shifts.find(
        (item) => String(item.id) === String(created.shiftConfigId)
      );

      const enriched = {
        ...created,
        shiftName: created.shiftName || shiftConfig?.name,
        shiftStartTime: created.shiftStartTime || shiftConfig?.startTime,
        shiftEndTime: created.shiftEndTime || shiftConfig?.endTime,
      };

      set((state) => ({
        schedule: mergeById(state.schedule, [enriched]),
        myShifts:
          payload.staffId && String(payload.staffId) === String(payload.currentUserId)
            ? mergeById(state.myShifts, [enriched])
            : state.myShifts,
        actionLoading: false,
      }));

      toast.success("Phân ca thành công");
      return enriched;
    } catch (error) {
      console.error("❌ assignShift:", error);

      set({
        actionLoading: false,
        error: error?.message || "Phân ca thất bại",
      });

      toast.error(error?.message || "Phân ca thất bại");
      throw error;
    }
  },

  registerShift: async ({ staffId, shiftConfigId, workDate }) => {
    if (!staffId || !shiftConfigId || !workDate) {
      toast.error("Thiếu thông tin đăng ký ca");
      return null;
    }

    set({
      actionLoading: true,
      error: null,
    });

    try {
      const created = await shiftService.assignShift({
        staffId,
        shiftConfigId,
        workDate,
      });

      const shiftConfig = get().shifts.find(
        (item) => String(item.id) === String(created.shiftConfigId)
      );

      const enriched = {
        ...created,
        shiftName: created.shiftName || shiftConfig?.name,
        shiftStartTime: created.shiftStartTime || shiftConfig?.startTime,
        shiftEndTime: created.shiftEndTime || shiftConfig?.endTime,
      };

      set((state) => ({
        myShifts: mergeById(state.myShifts, [enriched]),
        schedule: mergeById(state.schedule, [enriched]),
        actionLoading: false,
      }));

      toast.success("Đăng ký ca thành công");
      return enriched;
    } catch (error) {
      console.error("❌ registerShift:", error);

      set({
        actionLoading: false,
        error: error?.message || "Đăng ký ca thất bại",
      });

      toast.error(error?.message || "Đăng ký ca thất bại");
      throw error;
    }
  },

  updateAssignment: async (assignmentId, payload) => {
    if (!assignmentId) return null;

    set({
      actionLoading: true,
      error: null,
    });

    try {
      const updated = await shiftService.updateAssignment(
        assignmentId,
        buildAssignmentPayload(payload)
      );

      const shiftConfig = get().shifts.find(
        (item) => String(item.id) === String(updated.shiftConfigId)
      );

      const enriched = {
        ...updated,
        shiftName: updated.shiftName || shiftConfig?.name,
        shiftStartTime: updated.shiftStartTime || shiftConfig?.startTime,
        shiftEndTime: updated.shiftEndTime || shiftConfig?.endTime,
      };

      set((state) => ({
        schedule: mergeById(state.schedule, [enriched]),
        myShifts: mergeById(state.myShifts, [enriched]),
        actionLoading: false,
      }));

      toast.success("Cập nhật phân ca thành công");
      return enriched;
    } catch (error) {
      console.error("❌ updateAssignment:", error);

      set({
        actionLoading: false,
        error: error?.message || "Cập nhật phân ca thất bại",
      });

      toast.error(error?.message || "Cập nhật phân ca thất bại");
      throw error;
    }
  },

  createShift: async ({
    shiftType,
    startTime,
    endTime,
    breakMinutes,
    staffId,
    workDate,
    franchiseId,
    staffName,
    staffPhone,
  }) => {
    set({
      actionLoading: true,
      error: null,
    });

    try {
      const shiftConfig = await shiftService.createShiftConfig({
        franchiseId,
        name: shiftType,
        startTime,
        endTime,
        breakMinutes: breakMinutes ?? null,
      });

      const assignment = await shiftService.assignShift({
        staffId,
        shiftConfigId: shiftConfig.id,
        workDate,
      });

      const enriched = {
        ...assignment,
        staffName,
        staffPhone,
        shiftName: shiftConfig.name,
        shiftStartTime: shiftConfig.startTime,
        shiftEndTime: shiftConfig.endTime,
      };

      set((state) => ({
        shifts: [shiftConfig, ...state.shifts],
        schedule: mergeById(state.schedule, [enriched]),
        myShifts: mergeById(state.myShifts, [enriched]),
        actionLoading: false,
      }));

      toast.success("Tạo và phân ca thành công");
      return enriched;
    } catch (error) {
      console.error("❌ createShift:", error);

      set({
        actionLoading: false,
        error: error?.message || "Tạo ca thất bại",
      });

      toast.error(error?.message || "Tạo ca thất bại");
      throw error;
    }
  },

  updateShift: async (
    assignmentId,
    shiftConfigId,
    {
      shiftType,
      startTime,
      endTime,
      breakMinutes,
      staffId,
      workDate,
      franchiseId,
      staffName,
      staffPhone,
    }
  ) => {
    set({
      actionLoading: true,
      error: null,
    });

    try {
      const updatedConfig = await shiftService.updateShiftConfig(shiftConfigId, {
        franchiseId,
        name: shiftType,
        startTime,
        endTime,
        breakMinutes: breakMinutes ?? null,
      });

      const updatedAssignment = await shiftService.updateAssignment(assignmentId, {
        staffId,
        shiftConfigId,
        workDate,
      });

      const enriched = {
        ...updatedAssignment,
        staffName,
        staffPhone,
        shiftName: updatedConfig.name,
        shiftStartTime: updatedConfig.startTime,
        shiftEndTime: updatedConfig.endTime,
      };

      set((state) => ({
        shifts: state.shifts.map((shift) =>
          String(shift.id) === String(shiftConfigId) ? updatedConfig : shift
        ),
        schedule: mergeById(state.schedule, [enriched]),
        myShifts: mergeById(state.myShifts, [enriched]),
        actionLoading: false,
      }));

      toast.success("Cập nhật ca thành công");
      return enriched;
    } catch (error) {
      console.error("❌ updateShift:", error);

      set({
        actionLoading: false,
        error: error?.message || "Cập nhật ca thất bại",
      });

      toast.error(error?.message || "Cập nhật ca thất bại");
      throw error;
    }
  },

  deleteShift: async (assignmentId, shiftConfigId) => {
    set({
      actionLoading: true,
      error: null,
    });

    try {
      if (shiftConfigId) {
        await shiftService.deleteShiftConfig(shiftConfigId);
      }

      set((state) => ({
        shifts: shiftConfigId
          ? state.shifts.filter(
              (shift) => String(shift.id) !== String(shiftConfigId)
            )
          : state.shifts,
        schedule: assignmentId
          ? removeById(state.schedule, assignmentId)
          : state.schedule.filter(
              (item) => String(item.shiftConfigId) !== String(shiftConfigId)
            ),
        myShifts: assignmentId
          ? removeById(state.myShifts, assignmentId)
          : state.myShifts.filter(
              (item) => String(item.shiftConfigId) !== String(shiftConfigId)
            ),
        actionLoading: false,
      }));

      toast.success("Xóa ca thành công");
      return true;
    } catch (error) {
      console.error("❌ deleteShift:", error);

      set({
        actionLoading: false,
        error: error?.message || "Xóa ca thất bại",
      });

      toast.error(error?.message || "Xóa ca thất bại");
      throw error;
    }
  },

  // =========================
  // ATTENDANCE
  // =========================
  checkIn: async (assignmentId) => {
    if (!assignmentId) return null;

    set({
      actionLoading: true,
      error: null,
    });

    try {
      const updated = await shiftService.checkIn(assignmentId);

      set((state) => ({
        schedule: mergeById(state.schedule, [updated]),
        myShifts: mergeById(state.myShifts, [updated]),
        actionLoading: false,
      }));

      toast.success("Check-in thành công");
      return updated;
    } catch (error) {
      console.error("❌ checkIn:", error);

      set({
        actionLoading: false,
        error: error?.message || "Check-in thất bại",
      });

      toast.error(error?.message || "Check-in thất bại");
      throw error;
    }
  },

  checkOut: async (assignmentId) => {
    if (!assignmentId) return null;

    set({
      actionLoading: true,
      error: null,
    });

    try {
      const updated = await shiftService.checkOut(assignmentId);

      set((state) => ({
        schedule: mergeById(state.schedule, [updated]),
        myShifts: mergeById(state.myShifts, [updated]),
        actionLoading: false,
      }));

      if (updated.status === "INCOMPLETE") {
        toast.error("Ca bị đánh dấu quên check-out");
      } else {
        toast.success("Check-out thành công");
      }

      return updated;
    } catch (error) {
      console.error("❌ checkOut:", error);

      set({
        actionLoading: false,
        error: error?.message || "Check-out thất bại",
      });

      toast.error(error?.message || "Check-out thất bại");
      throw error;
    }
  },

  markAbsent: async (assignmentId) => {
    if (!assignmentId) return null;

    set({
      actionLoading: true,
      error: null,
    });

    try {
      const updated = await shiftService.markAbsent(assignmentId);

      set((state) => ({
        schedule: mergeById(state.schedule, [updated]),
        myShifts: mergeById(state.myShifts, [updated]),
        actionLoading: false,
      }));

      toast.success("Đã đánh dấu vắng mặt");
      return updated;
    } catch (error) {
      console.error("❌ markAbsent:", error);

      set({
        actionLoading: false,
        error: error?.message || "Đánh dấu vắng mặt thất bại",
      });

      toast.error(error?.message || "Đánh dấu vắng mặt thất bại");
      throw error;
    }
  },

  // =========================
  // STATS
  // =========================
  fetchStatsByDate: async (date) => {
    try {
      return await shiftService.getStatsByDate(date);
    } catch (error) {
      console.error("❌ fetchStatsByDate:", error);
      toast.error("Không thể tải thống kê ca");
      return null;
    }
  },

  fetchPersonalStats: async (staffId) => {
    try {
      return await shiftService.getPersonalStats(staffId);
    } catch (error) {
      console.error("❌ fetchPersonalStats:", error);
      toast.error("Không thể tải thống kê cá nhân");
      return null;
    }
  },

  fetchIncompleteShifts: async (date) => {
    try {
      return await shiftService.getIncompleteShifts(date);
    } catch (error) {
      console.error("❌ fetchIncompleteShifts:", error);
      toast.error("Không thể tải ca thiếu check-out");
      return [];
    }
  },

  fetchAttendanceSummary: async (date) => {
    try {
      return await shiftService.getAttendanceSummary(date);
    } catch (error) {
      console.error("❌ fetchAttendanceSummary:", error);
      toast.error("Không thể tải tổng hợp chấm công");
      return null;
    }
  },

  // =========================
  // FILTERS
  // =========================
  setSearchQuery: (value) => {
    set({
      searchQuery: value,
      page: 1,
    });
  },

  setStatusFilter: (value) => {
    set({
      statusFilter: value,
      page: 1,
    });
  },

  setTypeFilter: (value) => {
    set({
      typeFilter: value,
      page: 1,
    });
  },

  setPage: (page) => {
    set({
      page,
    });
  },

  setPageSize: (pageSize) => {
    set({
      pageSize,
      page: 1,
    });
  },

  resetFilters: () => {
    set({
      searchQuery: "",
      statusFilter: "all",
      typeFilter: "all",
      page: 1,
    });
  },

  getFilteredShifts: () => {
    const { schedule, searchQuery, statusFilter, typeFilter } = get();
    const keyword = String(searchQuery || "").toLowerCase();

    return schedule.filter((row) => {
      const staffText = String(
        row.staffName || row.staffId || row.staff?.fullName || ""
      ).toLowerCase();

      const shiftText = String(row.shiftName || "").toLowerCase();
      const statusText = String(row.status || "").toLowerCase();

      const matchSearch =
        !keyword ||
        staffText.includes(keyword) ||
        shiftText.includes(keyword) ||
        statusText.includes(keyword);

      const matchStatus =
        statusFilter === "all" ||
        statusFilter === "All" ||
        String(row.status) === String(statusFilter);

      const matchType =
        typeFilter === "all" ||
        typeFilter === "All" ||
        String(row.shiftName) === String(typeFilter);

      return matchSearch && matchStatus && matchType;
    });
  },

  getPaginatedShifts: () => {
    const filtered = get().getFilteredShifts();
    const { page, pageSize } = get();

    const safePage = Math.max(1, Number(page || 1));
    const safeSize = Math.max(1, Number(pageSize || 10));
    const start = (safePage - 1) * safeSize;

    return {
      data: filtered.slice(start, start + safeSize),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / safeSize) || 1,
    };
  },

  getTodayMyShifts: (staffId) => {
    const today = toLocalDateString();

    return get().myShifts.filter((item) => {
      return (
        String(item.staffId) === String(staffId) &&
        normalizeDate(item.workDate) === today
      );
    });
  },

  getAvailableShiftConfigs: () => {
    return get().shifts.filter((shift) => {
      return shift.status !== false && DEFAULT_SHIFT_NAMES.includes(shift.name);
    });
  },

  canCheckIn: (shift) => {
    if (!shift) return false;

    return shift.status === "ASSIGNED" && !isTerminalStatus(shift.status);
  },

  canCheckOut: (shift) => {
    if (!shift) return false;

    return shift.status === "CHECKED_IN";
  },
}));

export default useShiftStore;