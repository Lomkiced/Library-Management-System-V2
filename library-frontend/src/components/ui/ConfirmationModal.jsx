import { AlertTriangle, CheckCircle, X } from "lucide-react";

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    loading = false,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = false
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="bg-gray-100 dark:bg-slate-700/50 p-6 flex justify-between items-start border-b border-gray-200 dark:border-slate-700">
                    <div>
                        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                            <AlertTriangle size={20} className={isDanger ? 'text-red-500' : 'text-amber-500'} />
                            {title}
                        </h2>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed">
                        {message}
                    </p>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`px-5 py-2.5 rounded-xl text-white font-bold transition flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                                ${isDanger
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                                    : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30'
                                }`}
                        >
                            {loading ? "Processing..." : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
