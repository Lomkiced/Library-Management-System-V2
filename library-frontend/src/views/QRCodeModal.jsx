import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, BookOpen, Building2, Hash, MapPin } from 'lucide-react';

export default function QRCodeModal({ book, onClose }) {
    const handlePrint = () => {
        window.print();
    };

    // Get image URL
    const getImageUrl = () => {
        const imagePath = book.image_path || book.cover_image;
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
        return `${baseUrl}/${imagePath}`;
    };

    const imageUrl = getImageUrl();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:bg-white print:static">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden print:shadow-none print:max-w-full">

                {/* Header - Hidden in print */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white print:hidden">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <BookOpen size={22} />
                            </div>
                            <h3 className="text-xl font-bold">QR Code Label</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* QR Code Content */}
                <div className="p-6">
                    {/* Printable Label Container */}
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-xl print:border-solid print:border-black">
                        <div className="flex flex-col items-center">
                            {/* QR Code */}
                            <div className="mb-4 p-4 bg-white rounded-xl shadow-sm">
                                <QRCodeSVG
                                    value={book.asset_code || book.isbn || 'NO-CODE'}
                                    size={160}
                                    level="H"
                                    className="mx-auto"
                                />
                            </div>

                            {/* Asset Code */}
                            <div className="font-mono text-2xl font-bold text-gray-800 mb-4">
                                {book.asset_code || 'N/A'}
                            </div>

                            {/* Book Info with Cover */}
                            <div className="flex gap-4 w-full bg-gray-50 p-4 rounded-xl">
                                {/* Book Cover */}
                                <div className="w-16 h-22 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-sm print:hidden">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen size={20} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Book Details */}
                                <div className="flex-1 min-w-0 text-left">
                                    <h4 className="font-bold text-gray-800 line-clamp-2">{book.title}</h4>
                                    <p className="text-sm text-gray-500">{book.author}</p>

                                    <div className="mt-2 space-y-1 text-xs text-gray-400">
                                        {book.isbn && (
                                            <div className="flex items-center gap-1.5">
                                                <Hash size={12} />
                                                <span className="font-mono">{book.isbn}</span>
                                            </div>
                                        )}
                                        {book.call_number && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={12} />
                                                <span className="font-mono">{book.call_number}</span>
                                            </div>
                                        )}
                                        {book.publisher && (
                                            <div className="flex items-center gap-1.5">
                                                <Building2 size={12} />
                                                <span className="truncate">{book.publisher}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Category Badge */}
                            {book.category && (
                                <div className="mt-3">
                                    <span className="bg-primary-50 text-primary-700 px-4 py-1.5 rounded-full text-xs font-bold border border-primary-100">
                                        {book.category}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Print Instructions - Hidden in print */}
                    <p className="text-sm text-gray-500 mt-4 text-center print:hidden">
                        Print this label and attach it to the book
                    </p>
                </div>

                {/* Footer Actions - Hidden in print */}
                <div className="p-4 border-t bg-gray-50 flex gap-3 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
                    >
                        <Printer size={18} /> Print Label
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:bg-white,
                    .print\\:bg-white * {
                        visibility: visible;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
