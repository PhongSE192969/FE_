import { Check } from "lucide-react";

const FilterItem = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer group mb-2 last:mb-0">
    <div className="relative flex items-center justify-center">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer appearance-none w-5 h-5 border-2 rounded-lg checked:bg-purple-600 transition-all" />
      <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100" />
    </div>
    <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600 transition-colors">{label}</span>
  </label>
);

export default FilterItem;