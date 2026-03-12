import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, CreditCard, Receipt, XCircle } from 'lucide-react';
import axiosClient from '../axios-client';
import { useToast } from '../components/ui/Toast';
import WaiverModal from './WaiverModal';

export default function FineSettlementModal({ isOpen, onClose, studentId, studentName, onPaymentSuccess }) {
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [waivingId, setWaivingId] = useState(null);
    const toast = useToast();

    useEffect(() => {
        if (isOpen && studentId) {
            fetchFines();
        }
    }, [isOpen, studentId]);

    const fetchFines = () => {
        setLoading(true);
        axiosClient.get(`/students/${studentId}/fines`)
            .then(({ data }) => {
                setFines(data);
                setLoading(false);
            })
            .catch(() => {
                toast.error("Failed to load fines.");
                setLoading(false);
            });
    };

    const handlePay = (transactionId, amount) => {
        axiosClient.post(`/transactions/${transactionId}/pay`)
            .then(() => {
                toast.success(`Payment of ₱${amount} recorded.`);
                fetchFines(); // Refresh list
                if (onPaymentSuccess) onPaymentSuccess();
            })
            .catch(() => {
                toast.error("Process failed.");
            });
    };

    const handleWaiveClick = (transactionId) => {
        setWaivingId(transactionId);
    };

    const confirmWaive = (reason) => {
        axiosClient.post(`/transactions/${waivingId}/waive`, { reason })
            .then(() => {
                toast.success("Fine waived successfully.");
                setWaivingId(null);
                fetchFines();
                if (onPaymentSuccess) onPaymentSuccess();
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Failed to waive fine.");
                setWaivingId(null);
            });
    };

    if (!isOpen) return null;

    const totalDue = fines.reduce((sum, f) => sum + parseFloat(f.penalty_amount), 0);

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">

                    {/* Header */}
                    <div className="bg-red-600 p-6 text-white flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Receipt size={24} /> Outstanding Fines
                            </h2>
                            <p className="text-red-100 mt-1">Settlement for {studentName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="py-8 text-center text-gray-500">Loading records...</div>
                        ) : fines.length === 0 ? (
                            <div className="py-12 text-center flex flex-col items-center text-gray-400">
                                <CheckCircle size={48} className="text-green-500 mb-3" />
                                <p className="text-lg font-bold text-gray-600 dark:text-gray-300">No Pending Fines</p>
                                <p className="text-sm">Student is cleared.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Summary Card */}
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-xl flex justify-between items-center">
                                    <span className="font-bold text-red-800 dark:text-red-300">Total Payable</span>
                                    <span className="text-2xl font-black text-red-600 dark:text-red-400">₱{totalDue.toFixed(2)}</span>
                                </div>

                                {/* List */}
                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                                    {fines.map(fine => (
                                        <div key={fine.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-600 hover:border-red-200 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-slate-600 text-xs font-mono rounded text-gray-600 dark:text-gray-300">{fine.book_asset?.asset_code}</span>
                                                    {fine.book_asset?.status === 'lost' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 rounded">LOST</span>}
                                                </div>
                                                <h4 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1">{fine.book_asset?.book_title?.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Due: {new Date(fine.due_date).toLocaleDateString()}</p>
                                            </div>

                                            <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
                                                <span className="font-bold text-red-600 dark:text-red-400 text-lg mr-2">₱{parseFloat(fine.penalty_amount).toFixed(2)}</span>

                                                <button
                                                    onClick={() => handleWaiveClick(fine.id)}
                                                    className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                                                    title="Waive Fine"
                                                >
                                                    <XCircle size={18} />
                                                </button>

                                                <button
                                                    onClick={() => handlePay(fine.id, fine.penalty_amount)}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors shadow-md shadow-red-200"
                                                >
                                                    <CreditCard size={14} /> Pay
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            <WaiverModal
                isOpen={!!waivingId}
                onClose={() => setWaivingId(null)}
                onConfirm={confirmWaive}
            />
        </>
    );
}
