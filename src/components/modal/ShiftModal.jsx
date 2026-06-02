import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CalendarDays,
  Clock,
  MapPin,
  User,
  CheckCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { useLanguageStore } from "@/stores";
import { useAuthStore } from "@/stores/authStore";
import { translations } from "@/locales";
import { SearchUsers, GetStaffByFranchise } from "@/services/userService";
import { normalizeDate, normalizeTime, toLocalDateString } from "@/services/shiftService";

const SHIFT_CONFIGS = [
  {
    value: "Ca sáng",
    startTime: "07:00",
    endTime: "11:00",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    value: "Ca chiều",
    startTime: "13:00",
    endTime: "17:00",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    value: "Ca tối",
    startTime: "18:00",
    endTime: "22:00",
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
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

const getDisplayName = (user) => {
  return user?.fullName || user?.username || user?.email || "Nhân viên";
};

const extractList = (response) => {
  const data = response?.data?.data || response?.data || response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const normalizeStaff = (staff, fallbackBranchId) => {
  return {
    id: staff.id,
    name: staff.fullName || staff.username || staff.email || staff.id,
    role: staff.role?.name || staff.roleName || staff.role || "STAFF",
    phone: staff.phone || staff.phoneNumber || "",
    email: staff.email || "",
    branch:
      staff.franchiseId ||
      staff.franchise?.id ||
      staff.branch ||
      fallbackBranchId ||
      null,
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
        size: 100,
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
      size: 100,
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
    console.error("Error fetching staff by franchise:", error);
    return [];
  }
};

const findShiftConfigByNameAndTime = (shiftConfigs, form) => {
  if (!Array.isArray(shiftConfigs)) return null;

  return shiftConfigs.find((item) => {
    return (
      String(item.name || item.shiftName) === String(form.shiftType) &&
      normalizeTime(item.startTime || item.shiftStartTime) === normalizeTime(form.startTime) &&
      normalizeTime(item.endTime || item.shiftEndTime) === normalizeTime(form.endTime)
    );
  });
};

export default function ShiftModal({
  isOpen,
  onClose,
  onSave,
  loading = false,
  initialData = null,
  isStoreManager = false,
  mode = "assign",
  shiftConfigs = [],
}) {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();

  const t =
    (translations[language] || translations.vi).manager?.shiftSchedule?.modal ||
    {};

  const isEdit = Boolean(initialData);
  const isStaffSelfRegister = !isStoreManager || mode === "register";

  const franchiseId = getUserFranchiseId(user);

  const configLabels = {
    "Ca sáng":
      (translations[language] || translations.vi).manager?.shiftSchedule?.filters
        ?.morning || "Ca sáng",
    "Ca chiều":
      (translations[language] || translations.vi).manager?.shiftSchedule?.filters
        ?.afternoon || "Ca chiều",
    "Ca tối":
      (translations[language] || translations.vi).manager?.shiftSchedule?.filters
        ?.evening || "Ca tối",
  };

  const defaultShift = SHIFT_CONFIGS[0];

  const [form, setForm] = useState({
    shiftType: defaultShift.value,
    startTime: defaultShift.startTime,
    endTime: defaultShift.endTime,
    breakMinutes: "",
    branch: franchiseId || "",
    staffId: isStaffSelfRegister ? user?.id || "" : "",
    staffName: isStaffSelfRegister ? getDisplayName(user) : "",
    staffPhone: isStaffSelfRegister ? user?.phone || "" : "",
    workDate: toLocalDateString(),
    shiftConfigId: "",
  });

  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const availableShiftConfigs = useMemo(() => {
    return (shiftConfigs || []).filter((item) => item.status !== false);
  }, [shiftConfigs]);

  const selectedStaff = useMemo(() => {
    if (isStaffSelfRegister) {
      return {
        id: user?.id,
        name: getDisplayName(user),
        phone: user?.phone || "",
        role: user?.role?.name || user?.roleName || "STAFF",
      };
    }

    return staffList.find((item) => String(item.id) === String(form.staffId));
  }, [isStaffSelfRegister, user, staffList, form.staffId]);

  const setField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    if (!isOpen) return;

    const normalizedInitialDate = normalizeDate(
      initialData?.workDate || initialData?.date
    );

    const normalizedInitialStart = normalizeTime(
      initialData?.shiftStartTime || initialData?.startTime
    );

    const normalizedInitialEnd = normalizeTime(
      initialData?.shiftEndTime || initialData?.endTime
    );

    const matchedConfig = initialData?.shiftConfigId
      ? availableShiftConfigs.find(
          (item) => String(item.id) === String(initialData.shiftConfigId)
        )
      : null;

    if (isEdit && initialData) {
      setForm({
        shiftType:
          initialData.shiftType ||
          initialData.shiftName ||
          matchedConfig?.name ||
          defaultShift.value,
        startTime:
          normalizedInitialStart ||
          normalizeTime(matchedConfig?.startTime) ||
          defaultShift.startTime,
        endTime:
          normalizedInitialEnd ||
          normalizeTime(matchedConfig?.endTime) ||
          defaultShift.endTime,
        breakMinutes:
          initialData.breakMinutes ?? matchedConfig?.breakMinutes ?? "",
        branch:
          initialData.branch ||
          initialData.franchiseId ||
          matchedConfig?.franchiseId ||
          franchiseId ||
          "",
        staffId: isStaffSelfRegister
          ? user?.id || ""
          : initialData.staffId
            ? String(initialData.staffId)
            : "",
        staffName: isStaffSelfRegister
          ? getDisplayName(user)
          : initialData.staffName || "",
        staffPhone: isStaffSelfRegister
          ? user?.phone || ""
          : initialData.staffPhone || "",
        workDate: normalizedInitialDate || toLocalDateString(),
        shiftConfigId: initialData.shiftConfigId || matchedConfig?.id || "",
      });
    } else {
      const firstConfig = availableShiftConfigs[0];

      setForm({
        shiftType: firstConfig?.name || defaultShift.value,
        startTime: normalizeTime(firstConfig?.startTime) || defaultShift.startTime,
        endTime: normalizeTime(firstConfig?.endTime) || defaultShift.endTime,
        breakMinutes: firstConfig?.breakMinutes ?? "",
        branch: franchiseId || firstConfig?.franchiseId || "",
        staffId: isStaffSelfRegister ? user?.id || "" : "",
        staffName: isStaffSelfRegister ? getDisplayName(user) : "",
        staffPhone: isStaffSelfRegister ? user?.phone || "" : "",
        workDate: toLocalDateString(),
        shiftConfigId: firstConfig?.id || "",
      });
    }
  }, [
    isOpen,
    isEdit,
    initialData,
    franchiseId,
    user,
    isStaffSelfRegister,
    availableShiftConfigs,
  ]);

  useEffect(() => {
    if (!isOpen || isStaffSelfRegister || !form.branch) return;

    let cancelled = false;

    const run = async () => {
      setLoadingStaff(true);
      setStaffList([]);

      try {
        const staff = await fetchStaffByFranchise(form.branch);

        if (!cancelled) {
          setStaffList(staff);

          if (form.staffId) {
            const currentStaff = staff.find(
              (item) => String(item.id) === String(form.staffId)
            );

            if (currentStaff) {
              setForm((prev) => ({
                ...prev,
                staffName: currentStaff.name,
                staffPhone: currentStaff.phone,
              }));
            }
          }
        }
      } catch {
        if (!cancelled) {
          toast.error(t.warnings?.noStaff || "Không thể tải nhân viên");
        }
      } finally {
        if (!cancelled) {
          setLoadingStaff(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [isOpen, isStaffSelfRegister, form.branch]);

  const handleShiftConfigSelect = (shiftConfigId) => {
    const selected = availableShiftConfigs.find(
      (item) => String(item.id) === String(shiftConfigId)
    );

    if (!selected) {
      setForm((prev) => ({
        ...prev,
        shiftConfigId: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      shiftConfigId: selected.id,
      shiftType: selected.name || prev.shiftType,
      startTime: normalizeTime(selected.startTime) || prev.startTime,
      endTime: normalizeTime(selected.endTime) || prev.endTime,
      breakMinutes: selected.breakMinutes ?? "",
      branch: selected.franchiseId || prev.branch,
    }));
  };

  const handleShiftTypeChange = (type) => {
    const preset = SHIFT_CONFIGS.find((item) => item.value === type);

    const nextStart = preset?.startTime || form.startTime;
    const nextEnd = preset?.endTime || form.endTime;

    const matchedConfig = availableShiftConfigs.find((item) => {
      return (
        String(item.name) === String(type) &&
        normalizeTime(item.startTime) === normalizeTime(nextStart) &&
        normalizeTime(item.endTime) === normalizeTime(nextEnd)
      );
    });

    setForm((prev) => ({
      ...prev,
      shiftType: type,
      startTime: nextStart,
      endTime: nextEnd,
      shiftConfigId: matchedConfig?.id || "",
      breakMinutes: matchedConfig?.breakMinutes ?? prev.breakMinutes,
    }));
  };

  const handleStaffSelect = (staffId) => {
    const staff = staffList.find((item) => String(item.id) === String(staffId));

    if (!staff) {
      setForm((prev) => ({
        ...prev,
        staffId: "",
        staffName: "",
        staffPhone: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      staffId: staff.id,
      staffName: staff.name,
      staffPhone: staff.phone,
    }));
  };

  const validateForm = () => {
    if (!franchiseId && !form.branch) {
      toast.error("Không tìm thấy chi nhánh");
      return false;
    }

    if (!form.workDate) {
      toast.error(t.warnings?.selectDate || "Vui lòng chọn ngày làm việc");
      return false;
    }

    if (normalizeDate(form.workDate) < toLocalDateString()) {
      toast.error("Không thể chọn ngày trong quá khứ");
      return false;
    }

    if (!form.staffId) {
      toast.error(t.warnings?.selectStaff || "Vui lòng chọn nhân viên");
      return false;
    }

    if (!form.shiftType) {
      toast.error("Vui lòng chọn loại ca");
      return false;
    }

    if (!form.startTime || !form.endTime) {
      toast.error("Vui lòng nhập giờ bắt đầu và kết thúc");
      return false;
    }

    const [startHour, startMinute] = normalizeTime(form.startTime)
      .split(":")
      .map(Number);
    const [endHour, endMinute] = normalizeTime(form.endTime)
      .split(":")
      .map(Number);

    if (startHour * 60 + startMinute >= endHour * 60 + endMinute) {
      toast.error(
        t.warnings?.invalidTime || "Giờ kết thúc phải lớn hơn giờ bắt đầu"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const matchedConfig =
      form.shiftConfigId
        ? availableShiftConfigs.find(
            (item) => String(item.id) === String(form.shiftConfigId)
          )
        : findShiftConfigByNameAndTime(availableShiftConfigs, form);

    const payload = {
      // assignment fields
      assignmentId: initialData?.assignmentId || initialData?.id || null,
      staffId: form.staffId,
      staffName: form.staffName || selectedStaff?.name || "",
      staffPhone: form.staffPhone || selectedStaff?.phone || "",
      workDate: normalizeDate(form.workDate),

      // shift config fields
      shiftConfigId: matchedConfig?.id || form.shiftConfigId || null,
      franchiseId: form.branch || franchiseId,
      branch: form.branch || franchiseId,
      shiftType: form.shiftType,
      name: form.shiftType,
      startTime: normalizeTime(form.startTime),
      endTime: normalizeTime(form.endTime),
      breakMinutes:
        form.breakMinutes === "" || form.breakMinutes === null
          ? null
          : Number(form.breakMinutes),

      // guide parent logic
      shouldCreateConfigFirst: !matchedConfig && !form.shiftConfigId,
      isEdit,
      isStaffSelfRegister,
    };

    onSave(payload);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#d9a13b]/10 text-[#d9a13b]">
                  <CalendarDays size={18} />
                </div>

                <div>
                  <h3 className="font-black text-slate-900">
                    {isEdit
                      ? t.titleEdit || "Cập nhật phân ca"
                      : isStaffSelfRegister
                        ? "Đăng ký ca làm"
                        : t.titleAdd || "Phân công ca làm việc"}
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-400">
                    {isStaffSelfRegister
                      ? "Nhân viên tự chọn ca làm phù hợp"
                      : "Store Manager phân công ca cho nhân viên"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[78vh] space-y-4 overflow-y-auto p-6"
            >
              {/* Ngày làm */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400">
                  <CalendarDays size={12} />
                  {t.fields?.date || "Ngày làm việc"}
                </label>

                <input
                  type="date"
                  required
                  min={toLocalDateString()}
                  value={form.workDate}
                  onChange={(event) => setField("workDate", event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#d9a13b] focus:ring-2 focus:ring-[#d9a13b]/10"
                />
              </div>

              {/* Chi nhánh */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400">
                  <MapPin size={12} />
                  {t.fields?.branch || "Chi nhánh"}
                </label>

                <input
                  value={form.branch || "Chưa có chi nhánh"}
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm text-gray-500"
                />
              </div>

              {/* Chọn cấu hình ca có sẵn */}
              {availableShiftConfigs.length > 0 && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400">
                    <Clock size={12} />
                    Ca có sẵn trong chi nhánh
                  </label>

                  <select
                    value={form.shiftConfigId || ""}
                    onChange={(event) =>
                      handleShiftConfigSelect(event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#d9a13b]"
                  >
                    <option value="">— Tạo ca mới theo thông tin bên dưới —</option>

                    {availableShiftConfigs.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} — {normalizeTime(shift.startTime)} -{" "}
                        {normalizeTime(shift.endTime)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Loại ca nhanh */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Clock size={12} />
                  {t.fields?.type || "Loại ca"}
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {SHIFT_CONFIGS.map((cfg) => (
                    <button
                      key={cfg.value}
                      type="button"
                      onClick={() => handleShiftTypeChange(cfg.value)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-all ${
                        form.shiftType === cfg.value
                          ? `${cfg.color} ring-2 ring-[#d9a13b]/30`
                          : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {configLabels[cfg.value] || cfg.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tên ca */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Clock size={12} />
                  Tên ca
                </label>

                <input
                  type="text"
                  required
                  value={form.shiftType}
                  onChange={(event) => setField("shiftType", event.target.value)}
                  placeholder="Ví dụ: Ca sáng"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#d9a13b]"
                />
              </div>

              {/* Thời gian */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Clock size={12} />
                  {t.fields?.time || "Thời gian"}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="time"
                      required
                      value={form.startTime}
                      onChange={(event) => {
                        setForm((prev) => ({
                          ...prev,
                          startTime: event.target.value,
                          shiftConfigId: "",
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#d9a13b]"
                    />
                    <p className="mt-1 px-1 text-[10px] text-gray-400">
                      {t.fields?.startTime || "Giờ bắt đầu"}
                    </p>
                  </div>

                  <div>
                    <input
                      type="time"
                      required
                      value={form.endTime}
                      onChange={(event) => {
                        setForm((prev) => ({
                          ...prev,
                          endTime: event.target.value,
                          shiftConfigId: "",
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#d9a13b]"
                    />
                    <p className="mt-1 px-1 text-[10px] text-gray-400">
                      {t.fields?.endTime || "Giờ kết thúc"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Break minutes */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Clock size={12} />
                  Thời gian nghỉ giữa ca
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.breakMinutes}
                  onChange={(event) =>
                    setField("breakMinutes", event.target.value)
                  }
                  placeholder="Có thể bỏ trống"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#d9a13b]"
                />
              </div>

              {/* Nhân viên */}
              {!isStaffSelfRegister ? (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400">
                    <User size={12} />
                    {t.fields?.staff || "Nhân viên"}
                  </label>

                  <select
                    required
                    disabled={loadingStaff}
                    value={form.staffId}
                    onChange={(event) => handleStaffSelect(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#d9a13b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {loadingStaff
                        ? t.placeholders?.loading || "Đang tải..."
                        : t.placeholders?.selectStaff || "— Chọn nhân viên —"}
                    </option>

                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} — {staff.role}
                      </option>
                    ))}
                  </select>

                  {!loadingStaff && staffList.length === 0 && form.branch && (
                    <p className="text-xs text-amber-600">
                      {t.warnings?.noStaff ||
                        "Không có nhân viên ở chi nhánh này."}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400">
                    <User size={12} />
                    Nhân viên đăng ký
                  </label>

                  <input
                    value={getDisplayName(user)}
                    disabled
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm text-gray-500"
                  />
                </div>
              )}

              {/* Preview staff */}
              {selectedStaff && (
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-black text-green-700">
                    {(selectedStaff.name || "N").charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-green-800">
                      {selectedStaff.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {selectedStaff.phone || selectedStaff.email || "Chưa có liên hệ"}
                    </p>
                  </div>

                  <CheckCircle size={16} className="shrink-0 text-green-500" />
                </div>
              )}

              {/* Note */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs leading-relaxed text-blue-700">
                  {isStaffSelfRegister
                    ? "Lưu ý: Backend hiện tại chưa có trạng thái chờ duyệt. Khi đăng ký, ca sẽ được tạo trực tiếp ở trạng thái ASSIGNED."
                    : "Store Manager có thể chọn ca có sẵn hoặc tạo ca mới rồi phân công cho nhân viên."}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {t.actions?.cancel || "Hủy"}
                </button>

                <button
                  type="submit"
                  disabled={loading || loadingStaff}
                  className="flex-[2] rounded-xl bg-[#d9a13b] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#c48f32] active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      {t.actions?.processing || "Đang xử lý..."}
                    </span>
                  ) : isEdit ? (
                    t.actions?.update || "Cập nhật"
                  ) : isStaffSelfRegister ? (
                    "Đăng ký ca"
                  ) : (
                    t.actions?.confirm || "Phân công ca"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}