import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  RefreshCw, 
  MapPin, 
  Clock, 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Archive, 
  Calculator, 
  Send, 
  CheckCircle2 
} from "lucide-react";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { storeRequestApi } from "@/config/api";
import PermissionFormModal from "./PermissionFormModal";

const RestockRequestModal = ({ 
  isOpen, 
  onClose, 
  user, 
  branchName, 
  franchiseId,
  initialItem = null // Dùng khi bấm "Adjust Distribution" từ 1 dòng cụ thể
}) => {
  const language = useLanguageStore((state) => state.language);
  const currentTranslations = translations[language] || translations.vi;
  const tRequest = currentTranslations.admin?.storeRequestManagement?.sendRequest || {};

  const [requestItems, setRequestItems] = useState([]);
  const [requestNotes, setRequestNotes] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Sub-modal state (PermissionFormModal)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  const currentDate = useMemo(() => 
    new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US'),
    [language]
  );

  // Khởi tạo data khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        // Nếu có initialItem (từ nút Adjust), chỉ hiển thị item đó
        setRequestItems([{
          productId: initialItem.id,
          productCode: initialItem.sku,
          productName: initialItem.name,
          quantity: initialItem.quantity || 1,
          unit: initialItem.unit,
          price: 0,
          totalPrice: 0
        }]);
      } else {
        // Mở mới hoàn toàn
        setRequestItems([]);
      }
      setRequestNotes("");
      setRequestSuccess(false);
    }
  }, [isOpen, initialItem]);

  if (!isOpen) return null;

  const handleSendRequest = async () => {
    const validItems = requestItems.filter(i => i.productName?.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      alert(tRequest.errorNoItems || 'Please add at least one item.');
      return;
    }

    try {
      setRequestSubmitting(true);
      await storeRequestApi.create({
        createdBy: user?.id,
        createdByName: user?.fullName,
        franchiseId: franchiseId,
        items: validItems.map(item => ({
          productId: item.productId || null,
          productCode: item.productCode || '',
          productName: item.productName || '',
          size: item.size || '',
          color: item.color || '',
          quantity: item.quantity,
          price: item.price || 0,
          totalPrice: item.totalPrice || (item.price || 0) * item.quantity,
          imageUrl: item.imageUrl || '',
          category: item.category || '',
          productType: item.productType || '',
          unit: item.unit || '',
        })),
        notes: requestNotes,
        totalAmount: validItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
      });

      setRequestSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('❌ Error creating request:', err);
      alert(err?.response?.data?.message || tRequest.errorFailed || 'Failed to send request.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleSaveItem = (data, isEditMode) => {
    const updatedItems = [...requestItems];
    if (isEditMode && editingItemIndex !== null) {
      updatedItems[editingItemIndex] = data;
    } else {
      updatedItems.push(data);
    }
    setRequestItems(updatedItems);
    setIsItemModalOpen(false);
  };

  return (
    <div key={language} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 h-fit max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-[#d9a13b]/10 text-[#d9a13b] flex items-center justify-center">
              <RefreshCw size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                {tRequest.title || "Send Restock Request"}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                {tRequest.subtitle || "Create restock request for branch"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="size-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all hover:rotate-90"
          >
            <X size={20}/>
          </button>
        </div>

        {requestSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4"><CheckCircle2 size={32}/></div>
            <h4 className="text-lg font-black text-slate-900">{tRequest.successTitle || "Request Sent!"}</h4>
            <p className="text-sm text-gray-500 mt-1">{tRequest.successMessage || "Your request has been submitted."}</p>
          </div>
        ) : (
          <>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex text-[10px] font-black text-gray-400 uppercase tracking-widest items-center gap-2 px-1">
                    <MapPin size={12}/> {tRequest.branch || "Branch"}
                  </label>
                  <div className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black text-slate-800 shadow-inner flex items-center gap-2">
                     <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                     {branchName || "Your Branch"}
                  </div>
                </div>
                
                <div className="space-y-2">
                    <label className="flex text-[10px] font-black text-gray-400 uppercase tracking-widest items-center gap-2 px-1">
                        <Clock size={12}/> {tRequest.dateCreatedLabel || "DATE CREATED"}
                    </label>
                    <div className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-slate-400">
                        {currentDate}
                    </div>
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                    <label className="flex text-[10px] font-black text-gray-400 uppercase tracking-widest items-center gap-2">
                        <Package size={12}/> {tRequest.items || "Requested Items"}
                    </label>
                    <button
                        onClick={() => { setEditingItemIndex(null); setIsItemModalOpen(true); }}
                        className="px-3 py-1 bg-[#d9a13b]/10 text-[#d9a13b] rounded-lg text-[10px] font-black uppercase hover:bg-[#d9a13b]/20 transition-colors flex items-center gap-1.5"
                    >
                        <Plus size={14} /> {tRequest.addItem || "Add Item"}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {requestItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm group hover:border-[#d9a13b]/30 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center group-hover:bg-[#d9a13b]/10 group-hover:text-[#d9a13b] transition-all overflow-hidden border border-gray-100">
                                {item.imageUrl ? <img src={item.imageUrl} alt="" className="size-full object-cover" /> : <Package size={24} />}
                            </div>
                            <div className="space-y-0.5 text-left">
                                <div className="text-sm font-black text-slate-900 group-hover:text-[#d9a13b] transition-colors">{item.productName}</div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-400 font-bold tracking-tight">
                                    <span className="px-1.5 py-0.5 bg-gray-100 rounded-md italic">{item.productCode || tRequest.defaultSku}</span>
                                    <span>{item.quantity} {item.unit} {item.size && <span>· {item.size}</span>} {item.color && <span>· {item.color}</span>}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingItemIndex(idx); setIsItemModalOpen(true); }} className="size-8 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-all flex items-center justify-center"><Edit2 size={14}/></button>
                            <button onClick={() => setRequestItems(requestItems.filter((_, i) => i !== idx))} className="size-8 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"><Trash2 size={14}/></button>
                        </div>
                    </div>
                    ))}

                    {requestItems.length === 0 && (
                        <div className="py-14 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-200">
                            <Archive size={40} strokeWidth={1} />
                            <p className="text-xs font-bold uppercase tracking-widest mt-3">{tRequest.noItemsAdded}</p>
                        </div>
                    )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2 pt-2">
                <label className="flex text-[10px] font-black text-gray-400 uppercase tracking-widest items-center gap-2 px-1">
                    <Calculator size={12}/> {tRequest.notes || "Note"}
                </label>
                <textarea 
                  value={requestNotes} 
                  onChange={(e) => setRequestNotes(e.target.value)} 
                  placeholder={tRequest.notesPlaceholder} 
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-[1.5rem] text-sm focus:outline-none focus:border-[#d9a13b] transition-all h-28 resize-none shadow-inner" 
                />
              </div>

              {/* Summary */}
              <div className="px-6 py-5 bg-gradient-to-br from-[#d9a13b]/5 to-[#d9a13b]/10 rounded-3xl border border-[#d9a13b]/20 flex justify-between items-center shadow-inner mt-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#d9a13b]/60 uppercase tracking-widest">{tRequest.totalValueLabel}</span>
                    <span className="text-[11px] text-[#d9a13b] font-bold italic">{requestItems.length} {tRequest.itemsCountSuffix}</span>
                </div>
                <span className="text-2xl font-black text-[#d9a13b] tracking-tighter">
                    {requestItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toLocaleString()} <span className="text-xs font-bold leading-none">đ</span>
                </span>
              </div>
            </div>

            <div className="p-8 bg-gray-50 flex gap-4 border-t border-gray-100">
              <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-100 transition-all" disabled={requestSubmitting}>{tRequest.cancel}</button>
              <button onClick={handleSendRequest} disabled={requestSubmitting || requestItems.length === 0} className="flex-[2] px-4 py-3 bg-[#d9a13b] hover:bg-[#c48f32] text-white rounded-2xl text-sm font-black shadow-lg shadow-yellow-900/10 flex items-center justify-center gap-2 tracking-wider">
                {requestSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                {requestSubmitting ? tRequest.sending : tRequest.send}
              </button>
            </div>
          </>
        )}
      </div>

      <PermissionFormModal 
        isOpen={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        initialData={editingItemIndex !== null ? requestItems[editingItemIndex] : null} 
        onSubmit={handleSaveItem} 
      />
    </div>
  );
};

export default RestockRequestModal;
