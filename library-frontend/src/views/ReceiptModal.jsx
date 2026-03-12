import { X, Printer, BookOpen, User, Barcode, Calendar, Building2, MapPin } from 'lucide-react';
import { useLibrarySettings } from "../context/LibrarySettingsContext";

export default function ReceiptModal({ type, data, onClose }) {
    const { libraryName, settings } = useLibrarySettings();

    const handlePrint = () => {
        window.print();
    };

    const currentDate = new Date().toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Get image URL
    const getImageUrl = () => {
        const imagePath = data.imagePath || data.image_path || data.coverImage;
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
        return `${baseUrl}/${imagePath}`;
    };

    const imageUrl = getImageUrl();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

                {/* Header - Hidden in print */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white print:hidden">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <BookOpen size={22} />
                            </div>
                            <h3 className="text-xl font-bold">Transaction Receipt</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Receipt Content */}
                <div className="p-6" id="receipt-content">
                    {/* Receipt Header */}
                    <div className="text-center border-b-2 border-dashed pb-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">📚 {libraryName?.toUpperCase() || 'LIBRARY'}</h2>
                        <p className="text-sm text-gray-500">Library Management System</p>
                        <p className="text-xs text-gray-400 mt-2">{currentDate}</p>
                    </div>

                    {/* Transaction Type Badge */}
                    <div className="text-center mb-5">
                        <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-bold ${type === 'borrow'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                            {type === 'borrow' ? '📖 BOOK BORROWED' : '↩️ BOOK RETURNED'}
                        </span>
                    </div>

                    {/* Book Info with Cover */}
                    <div className="flex gap-4 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {/* Book Cover */}
                        <div className="w-16 h-22 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-sm">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={data.bookTitle}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen size={24} className="text-gray-400" />
                                </div>
                            )}
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 line-clamp-2">{data.bookTitle}</h4>
                            {data.author && (
                                <p className="text-sm text-gray-500">{data.author}</p>
                            )}
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                                <Barcode size={12} />
                                {data.assetCode}
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-3 border-b-2 border-dashed pb-4 mb-4">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-600">
                                <User size={16} />
                                Student:
                            </span>
                            <span className="font-bold text-gray-800">{data.studentName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Student ID:</span>
                            <span className="font-mono text-gray-800">{data.studentId}</span>
                        </div>

                        {data.course && (
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Course:</span>
                                <span className="text-gray-800">{data.course}</span>
                            </div>
                        )}

                        {type === 'borrow' && data.dueDate && (
                            <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg -mx-1 border border-yellow-200">
                                <span className="flex items-center gap-2 text-yellow-700 font-bold">
                                    <Calendar size={16} />
                                    Due Date:
                                </span>
                                <span className="font-bold text-yellow-700">
                                    {new Date(data.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                        )}

                        {type === 'return' && data.penalty > 0 && (
                            <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg -mx-1 border border-red-200">
                                <span className="text-red-700 font-bold">⚠️ Late Fee:</span>
                                <span className="font-bold text-red-700">₱{data.penalty.toFixed(2)}</span>
                            </div>
                        )}

                        {type === 'return' && data.penalty === 0 && (
                            <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg -mx-1 border border-green-200">
                                <span className="text-green-700 font-bold">✅ Status:</span>
                                <span className="font-bold text-green-700">Returned On Time</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-400 space-y-1">
                        <p className="font-medium">Thank you for using {libraryName}!</p>
                        <p>Please return books on or before the due date.</p>
                        <p className="mt-2 text-gray-300">Late fee: ₱{settings.fine_per_day || 5}.00 per day</p>
                    </div>
                </div>

                {/* Footer Actions - Hidden in print */}
                <div className="p-4 border-t bg-gray-50 flex gap-3 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
                    >
                        <Printer size={18} /> Print Receipt
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
