const FilterSection = ({ title, children }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
    <h3 className="text-xs font-black uppercase text-gray-400 mb-4">{title}</h3>
    {children}
  </div>
);

export default FilterSection;