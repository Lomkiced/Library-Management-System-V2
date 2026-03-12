import { AlertTriangle, BookPlus, X, Scan } from "lucide-react";

/**
 * BookNotFoundModal - Error popup when scanned book is not in the system
 * Provides option to register the book with the scanned barcode
 */
export default function BookNotFoundModal({ scannedCode, onRegister, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with warning indicator */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Book Not Found</h2>
                    <p className="text-white/80 mt-1">This book is not registered in the system</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Scanned barcode display */}
                    <div className="bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-200 p-2 rounded-lg">
                                <Scan size={24} className="text-slate-600" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-bold">Scanned Barcode</div>
                                <div className="text-lg font-mono font-bold text-slate-800">{scannedCode}</div>
                            </div>
                        </div>
                    </div>

                    <p className="text-slate-600 text-sm text-center">
                        Would you like to add this book to the library inventory?
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-slate-50 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition flex items-center justify-center gap-2"
                    >
                        <X size={18} />
                        Cancel
                    </button>

                    <button
                        onClick={() => onRegister(scannedCode)}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                    >
                        <BookPlus size={18} />
                        Register This Book
                    </button>
                </div>
            </div>
        </div>
    );
}
