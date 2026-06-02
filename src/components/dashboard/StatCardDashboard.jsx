import { ArrowUp, ArrowDown } from 'lucide-react'

const StatCardDashboard = ({ icon: Icon, label, value, growth, color, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`size-12 rounded-xl ${bg} ${color} flex items-center justify-center`}><Icon size={22} /></div>
      <span className={`flex items-center gap-1 text-xs font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {growth >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{Math.abs(growth)}%
      </span>
    </div>
    <div className="text-2xl font-black text-primary">{value}</div>
    <div className="text-sm text-gray-500 mt-1">{label}</div>
  </div>
)

export default StatCardDashboard;
