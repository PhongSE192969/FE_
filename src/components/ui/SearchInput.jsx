import { SearchIcon } from "lucide-react";
import { useLanguageStore } from '@/stores';
import { translations } from '@/locales';

const SearchInput = ({ value, onChange, placeholder, className = "" }) => {
  const { language } = useLanguageStore();
  const t = translations[language]?.ui?.searchInput || translations.vi.ui.searchInput;
  const finalPlaceholder = placeholder || t.placeholder;
  return (
    <div className={`relative flex-1 ${className}`}>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="text"
        placeholder={finalPlaceholder}
        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a13b]/20 focus:border-[#d9a13b] transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
