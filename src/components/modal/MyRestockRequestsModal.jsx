import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  RefreshCw, 
  ClipboardList, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Eye,
  Archive,
  Calendar,
  Package,
  ArrowLeft,
  History
} from 'lucide-react';
import { useLanguageStore } from '@/stores';
import { translations } from '@/locales';
import { storeRequestApi } from '@/config/api';

const MyRestockRequestsModal = ({ isOpen, onClose, user }) => {
  const { language } = useLanguageStore();
  const currentTranslations = useMemo(() => translations[language] || translations.vi, [language]);
  const t = useMemo(() => currentTranslations.admin?.storeRequestManagement || {}, [currentTranslations]);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const STATUS_CONFIG = {
    PENDING: { label: t.statusPending || 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, dotColor: 'bg-amber-400' },
    APPROVED: { label: t.statusApproved || 'Approved', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2, dotColor: 'bg-green-400' },
    REJECTED: { label: t.statusRejected || 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, dotColor: 'bg-red-400' },
  };

  const fetchMyRequests = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await storeRequestApi.getMyRequests(user.id);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error fetching my requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchMyRequests();
    }
  }, [isOpen, user?.id, fetchMyRequests]);

  const filteredRequests = useMemo(() => {
    const filtered = requests.filter(r => {
      const keyword = searchTerm.toLowerCase();
      const matchesSearch = (r.requestCode || '').toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return filtered.sort((a, b) => new Date(b.requestDate || b.createdAt) - new Date(a.requestDate || a.createdAt));
  }, [requests, searchTerm, statusFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount);
  };

  const parseRequestData = (requestData) => {
    if (!requestData) return null;
    try {
      return typeof requestData === 'string' ? JSON.parse(requestData) : requestData;
    } catch { return null; }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 h-fit max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className={`size-12 rounded-2xl ${selectedRequest ? 'bg-blue-50 text-blue-600' : 'bg-[#d9a13b]/10 text-[#d9a13b]'} flex items-center justify-center transition-colors duration-300`}>
              {selectedRequest ? <ClipboardList size={24} /> : <History size={24} />}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                {selectedRequest ? (selectedRequest.requestCode || `#${selectedRequest.id}`) : t.viewMyRequests}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                {selectedRequest ? t.detail?.title : t.viewMyRequestsSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {selectedRequest && (
               <button 
                 onClick={() => setSelectedRequest(null)}
                 className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-600 text-[10px] font-black uppercase rounded-xl hover:bg-gray-50 transition-all active:scale-95"
               >
                 <ArrowLeft size={14}/> {t.back || 'Back'}
               </button>
             )}
             <button 
               onClick={onClose} 
               className="size-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all hover:rotate-90"
             >
               <X size={20}/>
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {selectedRequest ? (
            // DETAIL VIEW
            <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-3xl space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                          <span className="flex items-center gap-2"><Calendar size={14}/> {t.detail?.requestDate || 'Request Date'}</span>
                          <span className={`px-2 py-0.5 rounded-full border ${STATUS_CONFIG[selectedRequest.status]?.color}`}>
                            {STATUS_CONFIG[selectedRequest.status]?.label}
                          </span>
                       </div>
                       <div className="text-sm font-black text-slate-800 px-1">
                          {formatDate(selectedRequest.requestDate || selectedRequest.createdAt)}
                       </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
                       <div className="relative z-10 space-y-4">
                          <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                             <Package size={14}/> {t.detail?.totalAmount || 'Total Amount'}
                          </h4>
                          <div className="text-3xl font-black text-[#d9a13b]">
                             {formatCurrency(selectedRequest.totalAmount || 0)}
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-amber-50/30 border border-amber-100/50 p-6 rounded-[2rem] h-full flex flex-col">
                       <h4 className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <ClipboardList size={14}/> {t.detail?.notes || 'Your Notes'}
                       </h4>
                       <div className="flex-1 text-sm text-slate-700 italic font-medium leading-relaxed">
                          {selectedRequest.notes ? `"${selectedRequest.notes}"` : 'No notes provided.'}
                       </div>
                    </div>
                  </div>
               </div>

               {/* Admin Feedback Section */}
               {(selectedRequest.reviewedAt || selectedRequest.adminNotes) && (
                 <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-start gap-5">
                    <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${selectedRequest.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                       {selectedRequest.status === 'APPROVED' ? <CheckCircle2 size={24}/> : <XCircle size={24}/>}
                    </div>
                    <div className="space-y-2 flex-1">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             Admin Feedback
                          </h4>
                          <span className="text-[10px] font-bold text-slate-300">
                             {formatDate(selectedRequest.reviewedAt)}
                          </span>
                       </div>
                       <div className="text-sm font-bold text-slate-800">
                          {selectedRequest.status === 'APPROVED' ? 'Your request has been approved.' : 'Your request was rejected.'}
                       </div>
                       {selectedRequest.adminNotes && (
                         <div className="text-sm text-slate-600 italic bg-white p-4 rounded-2xl border border-slate-100 mt-2 shadow-inner">
                            "{selectedRequest.adminNotes}"
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {/* Items Table */}
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                     <Package size={14}/> {t.detail?.requestedItems || 'Requested Items'}
                  </h4>
                  <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm bg-white">
                     <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                           <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase italic">Product</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-center italic font-mono">Qty</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right italic">Subtotal</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {parseRequestData(selectedRequest.items)?.map((item, idx) => (
                             <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     {item.imageUrl && <img src={item.imageUrl} className="size-10 rounded-xl object-cover border border-gray-100" alt=""/>}
                                     <div>
                                        <div className="text-sm font-black text-slate-800">{item.productName}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                          {item.productCode} {item.size && `· ${item.size}`} {item.color && `· ${item.color}`}
                                        </div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-center">
                                  <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">x{item.quantity}</span>
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <div className="text-sm font-black text-slate-900">{formatCurrency(item.totalPrice || (item.price * item.quantity))}</div>
                               </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          ) : (
            // LIST VIEW
            <div className="p-8 space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by request code..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a13b]/20 focus:border-[#d9a13b] transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 focus:outline-none appearance-none cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <button 
                    onClick={fetchMyRequests}
                    className="size-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#d9a13b] hover:border-[#d9a13b]/30 shadow-sm transition-all active:scale-95"
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">REQUEST</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">STATUS</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">TOTAL</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        [...Array(3)].map((_, i) => (
                           <tr key={i} className="animate-pulse">
                              <td colSpan="5" className="px-6 py-6 h-16 bg-gray-50/50"></td>
                           </tr>
                        ))
                      ) : filteredRequests.length > 0 ? (
                        filteredRequests.map((req) => (
                          <tr key={req.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-3">
                                  <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#d9a13b]/10 group-hover:text-[#d9a13b] transition-all"><ClipboardList size={18}/></div>
                                  <span className="text-sm font-black text-slate-900 uppercase">{req.requestCode || `#${req.id}`}</span>
                               </div>
                            </td>
                            <td className="px-6 py-5 text-xs text-gray-500 font-medium">
                               {formatDate(req.requestDate || req.createdAt)}
                            </td>
                            <td className="px-6 py-5">
                               <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border shadow-sm ${STATUS_CONFIG[req.status]?.color}`}>
                                  <span className={`size-1.5 rounded-full ${STATUS_CONFIG[req.status]?.dotColor} ${req.status === 'PENDING' ? 'animate-pulse' : ''}`}/>
                                  {STATUS_CONFIG[req.status]?.label}
                               </span>
                            </td>
                            <td className="px-6 py-5 text-right font-black text-sm text-slate-700">
                               {formatCurrency(req.totalAmount)}
                            </td>
                            <td className="px-6 py-5 text-center">
                               <button 
                                 onClick={() => setSelectedRequest(req)}
                                 className="size-8 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center m-auto shadow-sm active:scale-95"
                               >
                                  <Eye size={16}/>
                               </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-20 text-center">
                             <div className="flex flex-col items-center justify-center text-gray-300">
                                <Archive size={48} strokeWidth={1}/>
                                <p className="text-xs font-black uppercase tracking-[0.2em] mt-4">No requests found</p>
                             </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100">
           <button 
             onClick={onClose}
             className="w-full py-4 bg-white border border-gray-200 text-slate-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all shadow-sm active:scale-95"
           >
              {t.detail?.close || 'Close Window'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default MyRestockRequestsModal;
