import { useState, useEffect } from "react";
import { getProvinces, getDistricts, getWards } from "../../utils/mockData";
import { useLanguageStore } from "../../stores";
import { translations } from "../../locales";
import MapGeoApiFyModal from "@/components/modal/MapGeoApiFyModal.jsx";
import iconGeoApi from "/geoapify.png";
import {
  normalizeVietnamese,
  normalizeProvince,
  normalizeDistrict,
  normalizeWard,
} from "@/utils/helpers.js";

const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const getSelectedName = (list, code) => {
  const item = safeArray(list).find((x) => String(x.code) === String(code));
  return item?.name || "";
};

const findBestMatch = (list, rawName, normalizeFn = normalizeVietnamese) => {
  if (!rawName || !Array.isArray(list) || list.length === 0) return null;

  const key = normalizeFn(rawName);

  return (
    list.find((item) => normalizeFn(item.name) === key) ||
    list.find((item) => {
      const normalized = normalizeFn(item.name);
      return normalized.includes(key) || key.includes(normalized);
    }) ||
    null
  );
};

const extractGeoProvince = (geo = {}) => {
  return (
    geo.province ||
    geo.state ||
    geo.city ||
    geo.county ||
    geo.region ||
    ""
  );
};

const extractGeoDistrict = (geo = {}) => {
  return geo.district || geo.county || geo.city_district || geo.city || "";
};

const extractGeoWard = (geo = {}) => {
  return geo.ward || geo.suburb || geo.quarter || geo.neighbourhood || "";
};

export default function ShippingInfo({ shipping, setShipping }) {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).customer?.shippingInfo || {};

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await getProvinces();
        setProvinces(safeArray(data));
      } catch (error) {
        console.error("Load provinces failed:", error);
        setProvinces([]);
      }
    };

    loadProvinces();
  }, []);

  const handleProvinceChange = async (event) => {
    const code = event.target.value;
    const province = provinces.find((p) => String(p.code) === String(code));

    setSelectedProvince(code);
    setSelectedDistrict("");
    setSelectedWard("");
    setDistricts([]);
    setWards([]);

    setShipping((prev) => ({
      ...prev,
      province: province?.name || "",
      district: "",
      ward: "",
      isFromMap: false,
    }));

    if (!code) return;

    try {
      const data = await getDistricts(code);
      setDistricts(safeArray(data));
    } catch (error) {
      console.error("Load districts failed:", error);
      setDistricts([]);
    }
  };

  const handleDistrictChange = async (event) => {
    const code = event.target.value;
    const district = districts.find((d) => String(d.code) === String(code));

    setSelectedDistrict(code);
    setSelectedWard("");
    setWards([]);

    setShipping((prev) => ({
      ...prev,
      district: district?.name || "",
      ward: "",
      isFromMap: false,
    }));

    if (!code) return;

    try {
      const data = await getWards(code);
      setWards(safeArray(data));
    } catch (error) {
      console.error("Load wards failed:", error);
      setWards([]);
    }
  };

  const handleWardChange = (event) => {
    const code = event.target.value;
    const ward = wards.find((w) => String(w.code) === String(code));

    setSelectedWard(code);

    setShipping((prev) => ({
      ...prev,
      ward: ward?.name || "",
      isFromMap: false,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setShipping((prev) => ({
      ...prev,
      [name]: value,
      isFromMap: false,
    }));
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&lang=vi&apiKey=be404ab39aa94ae2bd00133e5add65a3`
      );

      const data = await response.json();

      if (!data.features?.length) return null;

      const props = data.features[0].properties || {};

      return {
        fullAddress: props.formatted || "",
        ward:
          props.suburb ||
          props.quarter ||
          props.neighbourhood ||
          props.village ||
          "",
        district:
          props.district ||
          props.city_district ||
          props.county ||
          props.city ||
          "",
        province:
          props.state ||
          props.city ||
          props.county ||
          "",
      };
    } catch (error) {
      console.error("Reverse geocode error:", error);
      return null;
    }
  };

  const applyMapLocationToForm = async (location) => {
    const { lat, lng } = location || {};

    if (!lat || !lng) {
      alert("Không lấy được tọa độ từ bản đồ.");
      return;
    }

    const geoFromApi = await reverseGeocode(lat, lng);

    const geo = {
      fullAddress:
        geoFromApi?.fullAddress ||
        location?.fullAddress ||
        location?.address ||
        "",
      province:
        extractGeoProvince(geoFromApi) ||
        extractGeoProvince(location) ||
        shipping.province ||
        getSelectedName(provinces, selectedProvince),
      district:
        extractGeoDistrict(geoFromApi) ||
        extractGeoDistrict(location) ||
        shipping.district ||
        getSelectedName(districts, selectedDistrict),
      ward:
        extractGeoWard(geoFromApi) ||
        extractGeoWard(location) ||
        shipping.ward ||
        getSelectedName(wards, selectedWard),
    };

    console.log("Geo:", geo);

    let finalProvinceName = geo.province || "";
    let finalDistrictName = geo.district || "";
    let finalWardName = geo.ward || "";

    let finalProvinceCode = selectedProvince;
    let finalDistrictCode = selectedDistrict;
    let finalWardCode = selectedWard;

    const matchedProvince = findBestMatch(
      provinces,
      finalProvinceName,
      normalizeProvince
    );

    if (matchedProvince) {
      finalProvinceCode = matchedProvince.code;
      finalProvinceName = matchedProvince.name;

      setSelectedProvince(matchedProvince.code);

      try {
        const districtsData = await getDistricts(matchedProvince.code);
        const safeDistricts = safeArray(districtsData);

        setDistricts(safeDistricts);

        const matchedDistrict = findBestMatch(
          safeDistricts,
          finalDistrictName,
          normalizeDistrict
        );

        if (matchedDistrict) {
          finalDistrictCode = matchedDistrict.code;
          finalDistrictName = matchedDistrict.name;

          setSelectedDistrict(matchedDistrict.code);

          try {
            const wardsData = await getWards(matchedDistrict.code);
            const safeWards = safeArray(wardsData);

            setWards(safeWards);

            const matchedWard = findBestMatch(
              safeWards,
              finalWardName,
              normalizeWard
            );

            if (matchedWard) {
              finalWardCode = matchedWard.code;
              finalWardName = matchedWard.name;
              setSelectedWard(matchedWard.code);
            } else {
              setSelectedWard("");
            }
          } catch (error) {
            console.error("Load wards after map failed:", error);
            setWards([]);
          }
        } else {
          setSelectedDistrict("");
          setSelectedWard("");
          setWards([]);
        }
      } catch (error) {
        console.error("Load districts after map failed:", error);
        setDistricts([]);
        setWards([]);
      }
    }

    const fallbackProvince =
      finalProvinceName || shipping.province || getSelectedName(provinces, selectedProvince);
    const fallbackDistrict =
      finalDistrictName || shipping.district || getSelectedName(districts, selectedDistrict);
    const fallbackWard =
      finalWardName || shipping.ward || getSelectedName(wards, selectedWard);

    setShipping((prev) => ({
      ...prev,
      lat,
      lng,
      address: geo.fullAddress || prev.address || "",
      province: fallbackProvince,
      district: fallbackDistrict,
      ward: fallbackWard,
      isFromMap: true,
    }));

    setIsMapOpen(false);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const finalProvince = shipping.province || getSelectedName(provinces, selectedProvince);
  const finalDistrict = shipping.district || getSelectedName(districts, selectedDistrict);
  const finalWard = shipping.ward || getSelectedName(wards, selectedWard);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        {/* HEADER */}
        <h2 className="font-semibold text-gray-700 mb-5">
          {t.title || "DELIVERY INFORMATION"}
        </h2>

        {/* MAP BUTTON */}
        <div className="flex gap-4 mb-5">
          <button
            type="button"
            onClick={() => {
              console.log("CLICK MAP BUTTON");
              setIsMapOpen(true);
            }}
            className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg border hover:border-orange-400 transition"
            title="Chọn vị trí trên bản đồ"
          >
            <img src={iconGeoApi} alt="Geoapify" className="w-8 h-8 object-contain" />
          </button>
        </div>

        {/* DELIVERY */}
        <div className="space-y-4">
          {/* NAME + PHONE */}
          <div className="grid grid-cols-2 gap-4">
            <input
              required
              name="name"
              value={shipping.name || ""}
              onChange={handleChange}
              placeholder={t.delivery?.name || "Receiver Name"}
              className="border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
            />

            <input
              required
              name="phone"
              value={shipping.phone || ""}
              onChange={handleChange}
              placeholder={t.delivery?.phone || "Receiver Phone Number"}
              className="border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
            />
          </div>

          {/* LOCATION */}
          <div className="grid grid-cols-3 gap-4">
            <select
              value={selectedProvince}
              required
              className="border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-orange-500"
              onChange={handleProvinceChange}
            >
              <option value="">
                {finalProvince || t.delivery?.province || "Province / City"}
              </option>

              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>

            <select
              required
              disabled={!selectedProvince && districts.length === 0}
              value={selectedDistrict}
              className="border border-gray-300 px-3 py-2.5 rounded-lg text-sm disabled:bg-gray-100"
              onChange={handleDistrictChange}
            >
              <option value="">
                {finalDistrict || t.delivery?.district || "District"}
              </option>

              {districts.map((district) => (
                <option key={district.code} value={district.code}>
                  {district.name}
                </option>
              ))}
            </select>

            <select
              required
              disabled={!selectedDistrict && wards.length === 0}
              value={selectedWard}
              className="border border-gray-300 px-3 py-2.5 rounded-lg text-sm disabled:bg-gray-100"
              onChange={handleWardChange}
            >
              <option value="">
                {finalWard || t.delivery?.ward || "Ward"}
              </option>

              {wards.map((ward) => (
                <option key={ward.code} value={ward.code}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          {/* ADDRESS */}
          <input
            name="address"
            value={shipping.address || ""}
            onChange={handleChange}
            placeholder={t.delivery?.address || "House Number / Street Name"}
            className="border border-gray-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
          />

          {shipping.distance > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              <p>📍 Distance: {Number(shipping.distance).toFixed(2)} km</p>
              <p>
                🚚 Shipping Fee:{" "}
                {Number(shipping.fee || 0).toLocaleString("vi-VN")} VND
              </p>
            </div>
          )}
        </div>

        {/* NOTE */}
        <textarea
          name="note"
          value={shipping.note || ""}
          onChange={handleChange}
          placeholder={t.notes || "Other Notes"}
          className="border border-gray-300 px-3 py-2.5 rounded-lg w-full mt-5 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
        />
      </div>

      {isMapOpen && (
        <MapGeoApiFyModal
          onClose={() => setIsMapOpen(false)}
          onSelectLocation={applyMapLocationToForm}
        />
      )}
    </>
  );
}