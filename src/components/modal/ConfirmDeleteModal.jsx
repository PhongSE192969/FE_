// fe/src/components/shift/ConfirmDeleteModal.jsx
import { motion } from 'framer-motion';
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

export default function ConfirmDeleteModal({ shiftName, onConfirm, onClose, loading }) {
    const { language } = useLanguageStore();
    const t = (translations[language] || translations.vi).modals?.confirmDelete || {};

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{t.title || "Xác nhận xóa"}</h2>
                <p className="text-sm text-gray-600 mb-5">
                    {t.message?.before || "Bạn có chắc muốn xóa ca "}<span className="font-semibold">"{shiftName}"</span>{t.message?.after || "? Hành động này không thể hoàn tác."}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {t.actions?.cancel || "Hủy"}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {loading ? (t.actions?.deleting || 'Đang xóa...') : (t.actions?.delete || 'Xóa')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}