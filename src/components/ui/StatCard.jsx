import { ArrowDown, ArrowUp } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, growth, subtext, color, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`size-12 rounded-xl ${bg} ${color} flex items-center justify-center`}>
        <Icon size={22} />
      </div>
      {growth !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {growth >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {Math.abs(growth)}%
        </span>
      )}
    </div>
    <div className="text-2xl font-black text-slate-900">{value}</div>
    <div className="text-sm text-gray-500 mt-1">{label}</div>
    {subtext && <div className="mt-4 text-[11px] text-gray-400 font-semibold">{subtext}</div>}
  </div>
);

export default StatCard;