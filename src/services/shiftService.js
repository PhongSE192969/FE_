// src/services/shiftService.js
import { shiftApi } from "@/config/api";

const pad2 = (value) => String(value).padStart(2, "0");

export const toLocalDateString = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);

  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const normalizeDate = (value) => {
  if (!value) return "";

  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  return String(value).slice(0, 10);
};

export const normalizeTime = (value) => {
  if (!value) return "";

  if (Array.isArray(value)) {
    const [hour, minute] = value;
    return `${pad2(hour)}:${pad2(minute)}`;
  }

  return String(value).slice(0, 5);
};

export const normalizeShiftConfig = (item = {}) => {
  return {
    ...item,
    id: item.id,
    franchiseId: item.franchiseId,
    name: item.name || item.shiftName || "Ca làm việc",
    startTime: normalizeTime(item.startTime),
    endTime: normalizeTime(item.endTime),
    breakMinutes: item.breakMinutes ?? null,
    status: item.status ?? true,
  };
};

export const normalizeStaffShift = (item = {}) => {
  return {
    ...item,
    id: item.id,
    assignmentId: item.id,

    staffId: item.staffId,
    shiftConfigId: item.shiftConfigId,

    workDate: normalizeDate(item.workDate),

    checkInTime: normalizeTime(item.checkInTime),
    checkOutTime: normalizeTime(item.checkOutTime),

    status: item.status || "ASSIGNED",
    lateMinutes: Number(item.lateMinutes || 0),
    note: item.note || "",

    shiftName: item.shiftName || item.name || "Ca làm việc",
    shiftStartTime: normalizeTime(item.shiftStartTime || item.startTime),
    shiftEndTime: normalizeTime(item.shiftEndTime || item.endTime),
  };
};

export const extractArray = (response) => {
  const data = response?.data?.data || response?.data || response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

export const getDatesBetween = (startDate, endDate) => {
  const result = [];

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return result;
  }

  const current = new Date(start);

  while (current <= end) {
    result.push(toLocalDateString(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
};

export const shiftService = {
  async getShiftConfigsByFranchise(franchiseId) {
    if (!franchiseId) return [];

    const response = await shiftApi.getByFranchise(franchiseId);
    return extractArray(response).map(normalizeShiftConfig);
  },

  async createShiftConfig(payload) {
    const response = await shiftApi.createConfig({
      franchiseId: payload.franchiseId,
      name: payload.name,
      startTime: payload.startTime,
      endTime: payload.endTime,
      breakMinutes: payload.breakMinutes ?? null,
    });

    return normalizeShiftConfig(response?.data?.data || response?.data || response);
  },

  async updateShiftConfig(shiftConfigId, payload) {
    const response = await shiftApi.updateConfig(shiftConfigId, {
      franchiseId: payload.franchiseId,
      name: payload.name,
      startTime: payload.startTime,
      endTime: payload.endTime,
      breakMinutes: payload.breakMinutes ?? null,
    });

    return normalizeShiftConfig(response?.data?.data || response?.data || response);
  },

  async deleteShiftConfig(shiftConfigId) {
    return shiftApi.deleteConfig(shiftConfigId);
  },

  async assignShift(payload) {
    const response = await shiftApi.assign({
      staffId: payload.staffId,
      shiftConfigId: payload.shiftConfigId,
      workDate: normalizeDate(payload.workDate),
    });

    return normalizeStaffShift(response?.data?.data || response?.data || response);
  },

  async updateAssignment(assignmentId, payload) {
    const response = await shiftApi.updateAssignment(assignmentId, {
      staffId: payload.staffId,
      shiftConfigId: payload.shiftConfigId,
      workDate: normalizeDate(payload.workDate),
    });

    return normalizeStaffShift(response?.data?.data || response?.data || response);
  },

  async getScheduleByDate(date, staffId = null) {
    const response = await shiftApi.getSchedule(normalizeDate(date), staffId);
    return extractArray(response).map(normalizeStaffShift);
  },

  async getScheduleRange(staffId, startDate, endDate) {
    const dates = getDatesBetween(startDate, endDate);

    if (dates.length === 0) return [];

    const results = await Promise.all(
      dates.map((date) =>
        this.getScheduleByDate(date, staffId).catch((error) => {
          console.error("Load shift date failed:", date, error);
          return [];
        })
      )
    );

    return results.flat();
  },

  async getFranchiseScheduleRange(startDate, endDate) {
    const dates = getDatesBetween(startDate, endDate);

    if (dates.length === 0) return [];

    const results = await Promise.all(
      dates.map((date) =>
        this.getScheduleByDate(date, null).catch((error) => {
          console.error("Load franchise shift date failed:", date, error);
          return [];
        })
      )
    );

    return results.flat();
  },

  async checkIn(assignmentId) {
    const response = await shiftApi.checkIn(assignmentId);
    return normalizeStaffShift(response?.data?.data || response?.data || response);
  },

  async checkOut(assignmentId) {
    const response = await shiftApi.checkOut(assignmentId);
    return normalizeStaffShift(response?.data?.data || response?.data || response);
  },

  async markAbsent(assignmentId) {
    const response = await shiftApi.markAbsent(assignmentId);
    return normalizeStaffShift(response?.data?.data || response?.data || response);
  },

  async getStatsByDate(date) {
    const response = await shiftApi.getStatsByDate(normalizeDate(date));
    return response?.data?.data || response?.data || response;
  },

  async getPersonalStats(staffId) {
    if (!staffId) return null;

    const response = await shiftApi.getPersonalStats(staffId);
    return response?.data?.data || response?.data || response;
  },

  async getIncompleteShifts(date) {
    const response = await shiftApi.getIncompleteShifts(normalizeDate(date));
    return extractArray(response).map(normalizeStaffShift);
  },

  async getAttendanceSummary(date) {
    const response = await shiftApi.getAttendanceSummary(normalizeDate(date));
    return response?.data?.data || response?.data || response;
  },
};

export default shiftService;