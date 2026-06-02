import React, { useState, useEffect, useRef } from "react";
import { X, Check, Search, MapPin, Loader2, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";

// Fix for leaflet default icon issue in React
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
};

// Hook to make the map fly smoothly to a new searched location
const MapFlyTo = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const MapPickerModal = ({ isOpen, onClose, onConfirm }) => {
  const [position, setPosition] = useState({ lat: 10.762622, lng: 106.660172 });
  const [mapCenter, setMapCenter] = useState({ lat: 10.762622, lng: 106.660172 });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (position) {
      const url = `https://www.google.com/maps?q=${position.lat},${position.lng}`;
      onConfirm(url);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowDropdown(true);
    
    try {
      // Using OpenStreetMap's Nominatim API for free geocoding
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    setPosition({ lat, lng: lon });
    setMapCenter({ lat, lng: lon });
    setSearchQuery(result.display_name);
    setShowDropdown(false);
  };

  const handleCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setPosition({ lat, lng: lon });
          setMapCenter({ lat, lng: lon });
          
          // Reverse geocode to get the address name
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=vi`)
            .then(res => res.json())
            .then(data => {
              if (data && data.display_name) {
                setSearchQuery(data.display_name);
              }
            })
            .catch(console.error)
            .finally(() => setIsLocating(false));
        },
        (err) => {
          console.error("Geolocation failed", err);
          alert("Lỗi khi lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt và thử lại.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Trình duyệt của bạn không hỗ trợ định vị (Geolocation).");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[85vh] border border-gray-100/50 relative">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-20">
          <div>
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Select Precise Location</h3>
            <p className="text-gray-500 text-sm mt-0.5">Drop a pin exactly where the franchise is located</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 w-full bg-slate-50 relative flex flex-col">
          
          {/* Floating Search Bar */}
          <div className="absolute top-5 inset-x-0 mx-auto w-full max-w-xl px-4 z-[400]" ref={dropdownRef}>
            <form 
              onSubmit={handleSearch}
              className="flex items-center bg-white/95 backdrop-blur-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-1.5 transition-all focus-within:shadow-[0_8px_30px_rgb(217,161,59,0.2)] focus-within:border-[#d9a13b]"
            >
              <div className="pl-3 pr-2 text-gray-400">
                <Search size={20} />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length === 0) setShowDropdown(false);
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                placeholder="Search for an address, landmark, or city..."
                className="flex-1 py-2.5 px-2 bg-transparent border-none text-slate-800 text-[15px] font-medium placeholder-gray-400 outline-none"
              />
              <button 
                type="button"
                onClick={handleCurrentLocation}
                disabled={isLocating}
                title="Use Current Location"
                className="p-2.5 mr-1 text-slate-400 hover:text-[#d9a13b] hover:bg-[#d9a13b]/10 rounded-xl transition-colors shrink-0 disabled:opacity-50"
              >
                {isLocating ? <Loader2 size={18} className="animate-spin text-[#d9a13b]" /> : <Navigation size={18} />}
              </button>
              <button 
                type="submit" 
                disabled={isSearching || !searchQuery.trim()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0"
              >
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
              </button>
            </form>

            {/* Dropdown Results */}
            <AnimatePresence>
              {showDropdown && (searchResults.length > 0 || isSearching) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-[40vh] overflow-y-auto z-[500]"
                >
                  {isSearching ? (
                    <div className="p-8 flex flex-col items-center justify-center text-gray-400 space-y-3">
                      <Loader2 size={28} className="animate-spin text-[#d9a13b]" />
                      <p className="text-sm font-medium">Finding optimal match...</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((result, idx) => (
                        <button
                          key={result.place_id || idx}
                          onClick={() => selectSearchResult(result)}
                          className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="mt-0.5 rounded-full p-1.5 bg-gray-100 text-gray-500 shrink-0">
                            <MapPin size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{result.display_name.split(",")[0]}</p>
                            <p className="text-[13px] text-gray-500 line-clamp-1 mt-0.5">{result.display_name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Map Layer */}
          <div className="flex-1 relative bg-blue-50/50">
            <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} style={{ height: "100%", width: "100%", zIndex: 10 }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
              <MapFlyTo center={mapCenter} />
            </MapContainer>
            
            {/* Contextual instruction pill */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/90 text-white backdrop-blur-md px-5 py-2.5 rounded-full shadow-2xl border border-white/10 pointer-events-none flex items-center gap-2">
              <MapPin size={16} className="text-[#d9a13b]" />
              <p className="text-[13px] font-medium tracking-wide">Touch map to pin exact location</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:px-8 bg-white flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 gap-4 z-20">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selected Coordinates</span>
            <span className="text-sm font-bold text-slate-900 bg-gray-100 px-3 py-1 rounded-lg mt-1 inline-block w-max font-mono">
              {position ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : "No location pinned"}
            </span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-6 py-3 bg-[#d9a13b] hover:bg-[#c48f32] active:bg-[#a67a28] text-white rounded-xl text-sm font-bold shadow-[0_8px_20px_rgb(217,161,59,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} strokeWidth={3} /> Confirmed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPickerModal;
