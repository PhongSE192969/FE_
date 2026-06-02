const InputTextField = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  icon: Icon,
  className = "",
  ...props 
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d9a13b] transition-all`}
          {...props}
        />
      </div>
    </div>
  );
};

export default InputTextField;