import { useState } from "react";
import axiosClient from "../axios-client";
import { X, DollarSign, CheckCircle, XCircle } from "lucide-react";
import WaiverModal from "./WaiverModal"; // Import WaiverModal

export default function PaymentModal({ transaction, isLostBook = false, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showWaiver, setShowWaiver] = useState(false);

    const handleMarkAsPaid = () => {
        setLoading(true);
        setError(null);

        axiosClient.post(`/transactions/${transaction.id}/pay`)
            .then(({ data }) => {
                setLoading(false);
                onSuccess(data.message);
                onClose();
            })
            .catch(err => {
                setLoading(false);
                setError(err.response?.data?.message || "Failed to process payment");
            });
    };

    const handleWaiveClick = () => {
        setShowWaiver(true);
    };

    const confirmWaive = (reason) => {
        setLoading(true);
        setError(null);

        axiosClient.post(`/transactions/${transaction.id}/waive`, { reason })
            .then(({ data }) => {
                setLoading(false);
                setShowWaiver(false);
                onSuccess(data.message); // "Fine waived successfully"
                onClose();
            })
            .catch(err => {
                setLoading(false);
                setShowWaiver(false);
                setError(err.response?.data?.message || "Failed to waive fine");
            });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                    {/* Header */}
                    <div className={`p-4 text-white ${isLostBook ? 'bg-gradient-to-r from-red-600 to-rose-600' : 'bg-gradient-to-r from-yellow-500 to-orange-500'}`}>
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <DollarSign size={24} /> {isLostBook ? 'Lost Book - Replacement Fee' : 'Late Return - Payment Due'}
                            </h2>
                            <button onClick={onClose} className="hover:bg-white/20 rounded p-1 transition">
                                <X size={20} />
                            </button>
                        </div>
                    </div>


                    {/* Content */}
                    <div className="p-6">
                        {/* Transaction Details */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Student</p>
                                    <p className="font-bold">{transaction.user?.name || "Unknown"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Student ID</p>
                                    <p className="font-mono">{transaction.user?.student_id || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Book</p>
                                    <p className="font-bold">{transaction.book_asset?.book_title?.title || "Unknown"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Asset Code</p>
                                    <p className="font-mono text-xs">{transaction.book_asset?.asset_code || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Due Date</p>
                                    <p className="text-red-600">{new Date(transaction.due_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Returned</p>
                                    <p>{new Date(transaction.returned_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Penalty Amount */}
                        <div className={`text-center py-4 border-2 border-dashed rounded-lg mb-4 ${isLostBook ? 'border-red-400 bg-red-50' : 'border-yellow-400 bg-yellow-50'}`}>
                            <p className="text-gray-600 text-sm">{isLostBook ? 'Replacement Fee' : 'Amount Due'}</p>
                            <p className={`text-4xl font-bold ${isLostBook ? 'text-red-600' : 'text-yellow-600'}`}>
                                ₱{parseFloat(transaction.penalty_amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {isLostBook ? 'Book replacement price' : `Rate: ₱${parseFloat(transaction.fine_per_day || 5).toFixed(2)} per day late`}
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleMarkAsPaid}
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <CheckCircle size={18} />
                                {loading ? "Processing..." : "Mark as Paid"}
                            </button>
                            <button
                                onClick={handleWaiveClick}
                                disabled={loading}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <XCircle size={18} />
                                Waive Fine
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center mt-4">
                            Click "Mark as Paid" after receiving payment from the student.
                        </p>
                    </div>
                </div>
            </div>

            {/* Waiver Modal - Rendered outside to ensure visibility if z-Index issues arise, though standard stacking usually works */}
            <WaiverModal
                isOpen={showWaiver}
                onClose={() => setShowWaiver(false)}
                onConfirm={confirmWaive}
                loading={loading}
            />
        </>
    );
}
