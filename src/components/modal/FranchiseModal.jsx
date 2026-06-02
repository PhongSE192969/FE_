import React, { useState } from "react";
import { X, MapPin, Calendar, User, CheckCircle, Slash, Edit3, Phone, Mail, AlertCircle } from "lucide-react";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import MapPickerModal from "./MapPickerModal";

const extractAddressFromMapsUrl = async (url) => {
  try {
    let lat, lng;
    // Format 1: ?q=lat,lng
    const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    // Format 2: @lat,lng,z
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);

    if (qMatch) {
      lat = qMatch[1];
      lng = qMatch[2];
    } else if (atMatch) {
      lat = atMatch[1];
      lng = atMatch[2];
    }

    if (lat && lng) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
      );
      const data = await res.json();
      return data?.display_name || "";
    }
  } catch {
    // silently ignore
  }
  return "";
};

const validatePhone = (v) => /^(0|\+84)\d{9,10}$/.test(v.replace(/[-.\s]/g, ""));
const validateEmail = (v) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v.trim());

const FranchiseModal = ({
  isOpen,
  onClose,
  mode = "view",
  initialData = null,
  allFranchises = [],
  onSubmit,
  loading = false,
  onEdit,
}) => {
  const { language } = useLanguageStore();
  const t          = (translations[language] || translations.vi).modals || {};
  const tFranchise = t.franchiseForm || {};
  const tDetail    = t.franchiseDetail || {};

  const [name,          setName]          = useState(initialData?.name          || "");
  const [address,       setAddress]       = useState(initialData?.address       || "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialData?.googleMapsUrl || "");
  const [phone,         setPhone]         = useState(initialData?.phone         || "");
  const [email,         setEmail]         = useState(initialData?.email         || "");
  const [at]                              = useState(initialData?.at            || "");
  const [errors, setErrors] = useState({});
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Clear form when opening for a new create or setting initial data for edit
  React.useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setAddress(initialData?.address || "");
      setGoogleMapsUrl(initialData?.googleMapsUrl || "");
      setPhone(initialData?.phone || "");
      setEmail(initialData?.email || "");
      setErrors({});
      setIsMapPickerOpen(false);
    }
  }, [isOpen, initialData]);

  // Automatically fetch address when googleMapsUrl changes and contains coordinates
  React.useEffect(() => {
    if (!googleMapsUrl || !isOpen) return;
    
    const timeoutId = setTimeout(async () => {
      const resolved = await extractAddressFromMapsUrl(googleMapsUrl);
      if (resolved) {
        setAddress((prevAddress) => {
          if (prevAddress !== resolved) {
            setErrors(p => ({ ...p, address: "" }));
            return resolved;
          }
          return prevAddress;
        });
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timeoutId);
  }, [googleMapsUrl, isOpen]);

  if (!isOpen) return null;

  const handleLocationConfirm = async (url) => {
    setGoogleMapsUrl(url);
    setIsMapPickerOpen(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = tFranchise.form?.nameRequired || "Franchise name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = tFranchise.form?.nameTooShort || "Name must be at least 2 characters";
    } else {
      // Check for duplicate name (including DELETED ones)
      const duplicate = allFranchises.find(f => 
        f.name?.toLowerCase().trim() === name.toLowerCase().trim() && 
        f.id !== initialData?.id
      );
      if (duplicate) {
        newErrors.name = tFranchise.form?.duplicateName || "This franchise name already exists (even if deleted)";
      }
    }
    if (!address.trim()) {
      newErrors.address = tFranchise.form?.addressRequired || "Location address is required";
    }
    if (!phone.trim()) {
      newErrors.phone = tFranchise.form?.phoneRequired || "Phone number is required";
    } else if (!validatePhone(phone)) {
      newErrors.phone = tFranchise.form?.phoneInvalid || "Phone must start with 0 or +84 and have 10-11 digits";
    }
    if (!email.trim()) {
      newErrors.email = tFranchise.form?.emailRequired || "Email address is required";
    } else if (!validateEmail(email)) {
      newErrors.email = tFranchise.form?.emailInvalid || "Email must have @ and a domain (e.g. example@mail.com)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;
    
    // Automatically set opened date to current date for new creations
    const openedVal = mode === "create" ? new Date().toISOString().split("T")[0] : initialData?.opened || null;
    
    onSubmit({ name, address, googleMapsUrl, phone, email, opened: openedVal, at: at || null });
  };

  const handleSwitchToEdit = () => { if (onEdit) onEdit(initialData); };

  const FieldError = ({ field }) =>
    errors[field] ? (
      <p className="flex items-center gap-1 text-[11px] text-red-500 font-semibold mt-1">
        <AlertCircle size={11} />{errors[field]}
      </p>
    ) : null;

  const openGoogleMaps = () => {
    let url;
    if (googleMapsUrl && googleMapsUrl.trim()) {
      url = googleMapsUrl.trim();
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
    } else if (address && address.trim()) {
      const encodedAddress = encodeURIComponent(address);
      url = `https://www.google.com/maps/search/${encodedAddress}`;
    } else {
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const renderViewMode = () => (
    <div className="p-6 grid grid-cols-1 gap-6">
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-2xl bg-[#d9a13b]/10 text-[#d9a13b] flex items-center justify-center shrink-0">
          <User size={24} />
        </div>
        <div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
            {tFranchise.form?.name || "Franchise Name"}
          </div>
          <div className="text-lg font-black text-slate-900">{name}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
            {tFranchise.form?.address || "Address"}
          </div>
          <div 
            onClick={openGoogleMaps}
            className="text-sm text-slate-700 flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-[#d9a13b]/5 hover:border-[#d9a13b]/30 transition-all group"
            title="Open in Google Maps"
          >
            <MapPin size={16} className="text-[#d9a13b] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <span className="font-medium group-hover:text-[#d9a13b] transition-colors">{address || "-"}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
            {tFranchise.form?.status || "Status"}
          </div>
          <div className="flex items-center h-full">
            {initialData?.status === "ACTIVE" ? (
              <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-xl font-bold text-xs ring-1 ring-green-600/20">
                <CheckCircle size={14} /> {tDetail.form?.statusActive || "Active"}
              </span>
            ) : initialData?.status === "INACTIVE" ? (
              <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1.5 rounded-xl font-bold text-xs ring-1 ring-red-600/20">
                <Slash size={14} /> {tDetail.form?.statusInactive || "Inactive"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl font-bold text-xs ring-1 ring-amber-600/20">
                <CheckCircle size={14} /> {tDetail.form?.statusNew || "New Franchises"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
            {tDetail.form?.phone || "Contact Phone"}
          </div>
          <div className="text-sm text-slate-700 flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <Phone size={16} className="text-blue-500 shrink-0" />
            <span className="font-medium">{phone || (tDetail.form?.noPhone || "No phone added")}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
            {tDetail.form?.email || "Contact Email"}
          </div>
          <div className="text-sm text-slate-700 flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <Mail size={16} className="text-red-400 shrink-0" />
            <span className="font-medium">{email || (tDetail.form?.noEmail || "No email added")}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
          {tDetail.form?.createdAt || "Created At"}
        </div>
        <div className="text-sm text-slate-700 flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <Calendar size={16} className="text-gray-400 shrink-0" />
          <span className="font-medium">
            {initialData?.createdAt || initialData?.joinedDate || initialData?.openedAt
              ? new Date(initialData.createdAt || initialData.joinedDate || initialData.openedAt)
                  .toLocaleString(language === "vi" ? "vi-VN" : "en-US")
              : "-"}
          </span>
        </div>
      </div>
    </div>
  );

  const renderFormMode = () => (
    <div className="p-6 space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
          {tFranchise.form?.name || "Franchise Name"} <span className="text-red-400">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
          type="text"
          maxLength={100}
          placeholder={tFranchise.form?.namePlaceholder || "e.g. District 7 Branch"}
          className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-[#d9a13b] focus:ring-4 focus:ring-[#d9a13b]/5 transition-all outline-none ${errors.name ? "border-red-400 bg-red-50/30" : "border-gray-200"}`}
        />
        <p className="text-[10px] text-gray-400 italic mt-0.5 px-1">
          {tFranchise.form?.nameHint || "At least 2 characters"}
        </p>
        <FieldError field="name" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
          {tFranchise.form?.address || "Location Address"} <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={address}
            onChange={(e) => { setAddress(e.target.value); setErrors(p => ({ ...p, address: "" })); }}
            type="text"
            placeholder={tFranchise.form?.addressPlaceholder || "Full street address, city"}
            className={`w-full pl-11 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-[#d9a13b] focus:ring-4 focus:ring-[#d9a13b]/5 transition-all outline-none ${errors.address ? "border-red-400 bg-red-50/30" : "border-gray-200"}`}
          />
        </div>
        <FieldError field="address" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {tFranchise.form?.googleMapsUrl || "Google Maps URL"}
          </label>
          <button
            type="button"
            onClick={() => setIsMapPickerOpen(true)}
            className="text-[#d9a13b] hover:text-[#c48f32] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg transition-all border border-amber-100 hover:border-amber-200"
          >
            <MapPin size={10} strokeWidth={3} />{tFranchise.form?.chooseOnMap || "Choose on Map"}
          </button>
        </div>
        <input
          value={googleMapsUrl}
          onChange={(e) => setGoogleMapsUrl(e.target.value)}
          onBlur={(e) => {
            // Trim on blur, the useEffect will handle the extraction natively
            setGoogleMapsUrl(e.target.value.trim());
          }}
          type="text"
          placeholder={tFranchise.form?.googleMapsPlaceholder || "https://www.google.com/maps?q=..."}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:border-[#d9a13b] transition-all outline-none italic"
        />
        <p className="text-[10px] text-gray-400 italic">
          {tFranchise.form?.googleMapsNote || "Paste a Google Maps URL or choose on map — address fills automatically."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {tFranchise.form?.phone || "Phone Number"} <span className="text-red-400">*</span>
          </label>
          <input
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d+\s-]/g, ""); // Allow digits, plus, spaces, dashes
              setPhone(val);
              setErrors(p => ({ ...p, phone: "" }));
            }}
            type="text"
            maxLength={15}
            placeholder={tFranchise.form?.phonePlaceholder || "e.g. 090 123 4567"}
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-[#d9a13b] transition-all outline-none ${errors.phone ? "border-red-400 bg-red-50/30" : "border-gray-200"}`}
          />
          <p className="text-[10px] text-gray-400 italic mt-0.5 px-1">
            {tFranchise.form?.phoneHint || "Start with 0 or +84, 10-11 digits"}
          </p>
          <FieldError field="phone" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {tFranchise.form?.email || "Email Address"} <span className="text-red-400">*</span>
          </label>
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
            type="email"
            maxLength={100}
            placeholder={tFranchise.form?.emailPlaceholder || "manager@branch.com"}
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-[#d9a13b] transition-all outline-none ${errors.email ? "border-red-400 bg-red-50/30" : "border-gray-200"}`}
          />
          <p className="text-[10px] text-gray-400 italic mt-0.5 px-1">
            {tFranchise.form?.emailHint || "Format: example@mail.com"}
          </p>
          <FieldError field="email" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onConfirm={handleLocationConfirm}
      />

      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d9a13b]/30 to-transparent" />
          <div>
            <h3 className="font-black text-slate-900 text-xl tracking-tight">
              {mode === "view"
                ? (tDetail.title || "Franchise Information")
                : mode === "create"
                ? (tFranchise.title?.create || "Register New Partner")
                : (tFranchise.title?.edit || "Edit Branch Profile")}
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {mode === "view"
                ? (tDetail.subtitle || "Master Database Record")
                : (tFranchise.subtitle || "Unified Management System")}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all active:scale-90">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
          {mode === "view" ? renderViewMode() : renderFormMode()}
        </div>

        <div className="p-8 bg-gray-50/50 flex gap-4 border-t border-gray-100 backdrop-blur-md">
          {mode === "view" ? (
            <>
              {onEdit && (
                <button onClick={handleSwitchToEdit} className="flex-1 px-6 py-3.5 bg-white border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 rounded-2xl text-sm font-black text-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
                  <Edit3 size={18} /> {tDetail.actions?.edit || "Edit"}
                </button>
              )}
              <button onClick={onClose} className="flex-1 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-slate-900/20 active:scale-95">
                {tDetail.actions?.close || "Close"}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 px-6 py-3.5 bg-white border-2 border-slate-100 hover:border-red-100 hover:text-red-500 rounded-2xl text-sm font-black text-slate-500 transition-all active:scale-95">
                {tFranchise.actions?.cancel || "Cancel"}
              </button>
              <button onClick={handleSubmit} disabled={loading} className="flex-[2] px-6 py-3.5 bg-[#d9a13b] hover:bg-[#c48f32] text-white rounded-2xl text-sm font-black shadow-xl shadow-yellow-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2">
                {loading ? (
                  <div className="size-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <CheckCircle size={18} strokeWidth={3} />
                )}
                <span>
                  {loading
                    ? (mode === "create" ? (tFranchise.actions?.creating || "Processing...") : (tFranchise.actions?.saving || "Saving..."))
                    : mode === "create"
                    ? (tFranchise.actions?.create || "Confirm Registration")
                    : (tFranchise.actions?.save || "Save Changes")}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FranchiseModal;