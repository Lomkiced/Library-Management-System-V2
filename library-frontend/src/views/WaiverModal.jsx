import { useState } from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

export default function WaiverModal({ isOpen, onClose, onConfirm, loading }) {
    const [reason, setReason] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="bg-gray-100 dark:bg-slate-700/50 p-6 flex justify-between items-start border-b border-gray-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <AlertTriangle size={20} className="text-amber-500" /> Waive Fine
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            This action cannot be undone easily.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Reason for Waiver <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Medical emergency, School event participation..."
                        className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none mb-6 text-sm"
                    ></textarea>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !reason.trim()}
                            className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition flex items-center gap-2 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processing..." : <><CheckCircle size={18} /> Confirm Waiver</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
