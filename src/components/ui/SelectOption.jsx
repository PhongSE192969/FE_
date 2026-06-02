// import { ChevronRight } from "lucide-react";

// const SelectOption = ({
//   value,
//   onChange,
//   options = [],
//   icon: Icon,
//   placeholder,
//   label,
//   className = "",
// }) => {
//   return (
//     <div className={`space-y-1.5 ${className}`}>
//       {label && (
//         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
//           {label}
//         </label>
//       )}
//       <div className="relative">
//         {Icon && (
//           <Icon
//             className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//             size={16}
//           />
//         )}
//         <select
//           className={`${Icon ? "pl-9" : "pl-4"} pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 focus:outline-none focus:border-[#d9a13b] appearance-none cursor-pointer hover:bg-gray-100 transition-colors w-full`}
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//         >
//           {placeholder && <option value="All">{placeholder}</option>}
//           {options.map((opt, index) => (
//             // Thêm thuộc tính key vào thẻ option như sau:
//             <option key={opt?.value || opt?.id} value={opt?.value || opt?.id}>
//               {opt?.name || opt?.label}
//             </option>
//           ))}
//         </select>
//         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
//           <ChevronRight size={14} className="rotate-90" />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SelectOption;

import { ChevronRight } from "lucide-react";

const SelectOption = ({ 
  value, 
  onChange, 
  options = [], 
  icon: Icon, 
  placeholder, 
  label,
  className = "" 
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
        <select
          className={`${Icon ? 'pl-9' : 'pl-4'} pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 focus:outline-none focus:border-[#d9a13b] appearance-none cursor-pointer hover:bg-gray-100 transition-colors w-full`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {placeholder && <option value="All">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt?.value || opt?.id} value={opt?.value || opt?.id}>
              { opt?.name || opt?.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <ChevronRight size={14} className="rotate-90" />
        </div>
      </div>
    </div>
  );
};

export default SelectOption;