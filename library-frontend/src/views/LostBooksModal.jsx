import { useEffect, useState } from "react";
import axiosClient, { ASSET_URL } from "../axios-client";
import { useToast } from "../components/ui/Toast";
import { X, RefreshCw, AlertCircle, BookOpen, CheckCircle } from "lucide-react";

export default function LostBooksModal({ onClose, onSuccess }) {
    const toast = useToast();
    const [lostBooks, setLostBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState(null);
    const [payingId, setPayingId] = useState(null);

    useEffect(() => {
        fetchLostBooks();
    }, []);

    const fetchLostBooks = () => {
        setLoading(true);
        axiosClient.get('/books/lost')
            .then(({ data }) => {
                setLostBooks(data);
                setLoading(false);
            })
            .catch((err) => {
                setLoading(false);
                toast.error("Failed to load lost books.");
            });
    };

    const handleRestore = (assetId) => {
        setRestoringId(assetId);
        axiosClient.post(`/books/assets/${assetId}/restore`)
            .then(() => {
                toast.success("Book has been restored to inventory.");
                fetchLostBooks();
                if (onSuccess) onSuccess();
                setRestoringId(null);
            })
            .catch((err) => {
                const message = err.response?.data?.message || "Failed to restore book.";
                if (err.response?.data?.error === 'unpaid_fine') {
                    toast.error(message); // Already specific
                } else {
                    toast.error(message);
                }
                setRestoringId(null);
            });
    };

    const handlePay = (transactionId) => {
        setPayingId(transactionId);
        axiosClient.post(`/transactions/${transactionId}/pay`)
            .then(() => {
                toast.success("Fine paid successfully. You can now restore the book.");
                fetchLostBooks(); // Refresh to update status
                setPayingId(null);
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Failed to pay fine.");
                setPayingId(null);
            });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-amber-600 p-6 text-white flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <AlertCircle size={24} /> Lost Books Management
                        </h2>
                        <p className="text-amber-100 mt-1">Found a lost book? Restore it to the inventory here.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                        </div>
                    ) : lostBooks.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                            <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="text-lg">No books currently marked as lost.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lostBooks.map((asset) => {
                                // Extract simplified variables using the new latest_transaction relationship
                                const latestTx = asset.latest_transaction;
                                const borrower = latestTx?.user;
                                const penaltyAmount = latestTx ? parseFloat(latestTx.penalty_amount) : 0;
                                // Strict check: Payment status must be 'paid' or 'waived'
                                const isPaid = latestTx && (latestTx.payment_status === 'paid' || latestTx.payment_status === 'waived');
                                const hasUnpaidFine = latestTx && penaltyAmount > 0 && !isPaid;
                                const noFine = !latestTx || penaltyAmount <= 0;

                                // Can restore ONLY if fine is paid OR if there's no fine to pay
                                const canRestore = isPaid || noFine;

                                return (
                                    <div key={asset.id} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600 flex justify-between items-start group hover:border-amber-200 dark:hover:border-amber-700 transition-colors">
                                        <div className="flex gap-4">
                                            {/* Book Cover */}
                                            <div className="w-16 h-24 bg-gray-200 dark:bg-slate-600 rounded-md flex-shrink-0 overflow-hidden shadow-sm">
                                                {asset.book_title?.image_path ? (
                                                    <img src={`${ASSET_URL}/${asset.book_title.image_path}`} className="w-full h-full object-cover" alt="Cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <BookOpen size={20} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Book & Borrower Details */}
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-800 dark:text-white line-clamp-1">{asset.book_title?.title}</h4>
                                                <div className="text-sm text-gray-500 dark:text-slate-400 space-y-1 mt-1">
                                                    <p>Code: <span className="font-mono text-amber-600 dark:text-amber-400">{asset.asset_code}</span></p>
                                                    <p>Lost since: {new Date(asset.updated_at).toLocaleDateString()}</p>

                                                    {borrower && (
                                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-600">
                                                            <p className="font-medium text-gray-700 dark:text-slate-300">Lost by:</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="font-bold text-amber-700 dark:text-amber-500">{borrower.name}</span>
                                                                <span className="text-xs bg-gray-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-slate-300 font-mono">
                                                                    {borrower.student_id}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-0.5">{borrower.course}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Panel */}
                                        <div className="flex flex-col items-end gap-3 min-w-[140px]">
                                            {/* Status Badges */}
                                            {hasUnpaidFine && (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded border border-red-200 dark:border-red-800">
                                                        Unpaid: ₱{parseFloat(latestTx.penalty_amount).toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] text-red-400 mt-1 max-w-[120px] text-right leading-tight">
                                                        * Settle in Payment Mgt
                                                    </span>
                                                </div>
                                            )}
                                            {isPaid && (
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                                    <CheckCircle size={12} /> PAID
                                                </span>
                                            )}
                                            {noFine && (
                                                <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                                                    ⚠️ Needs Fine
                                                </span>
                                            )}

                                            {/* RESTORE BUTTON - ONLY enabled when fine is PAID */}
                                            <button
                                                onClick={() => handleRestore(asset.id)}
                                                disabled={restoringId === asset.id || !canRestore}
                                                className={`w-full px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${canRestore
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow active:scale-95'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-600'
                                                    }`}
                                                title={canRestore ? "Restore to inventory" : "Action Blocked: Please pay the fine in Payment Management/Outstanding Fines first."}
                                            >
                                                {restoringId === asset.id ? (
                                                    "Restoring..."
                                                ) : (
                                                    <>
                                                        <RefreshCw size={14} /> Restore
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex justify-end shrink-0">
                    <button onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-bold transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
