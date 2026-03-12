import { BookOpen, User, MapPin, Calendar, AlertTriangle, Check, ArrowRight, RotateCcw, Package, PlusCircle, Building2, FileText, Globe } from "lucide-react";
import { ASSET_URL } from "../axios-client";

/**
 * BookScanModal - Shows scanned book details and action buttons
 */
export default function BookScanModal({ book, onBorrow, onReturn, onAddCopy, onClose }) {
    if (!book || !book.found) return null;

    const isAvailable = book.status === 'available';
    const isBorrowed = book.status === 'borrowed';
    const needsPhysicalCopy = book.needs_physical_copy || book.status === 'no_copies';

    // Get image URL
    const getImageUrl = () => {
        const imagePath = book.image_path || book.cover_image;
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('http')) return imagePath;

        return `${ASSET_URL}/${imagePath}`;
    };

    const imageUrl = getImageUrl();

    // Header background color based on status
    const getHeaderColor = () => {
        if (needsPhysicalCopy) return 'bg-gradient-to-r from-blue-600 to-cyan-600';
        if (isAvailable) return 'bg-gradient-to-r from-green-500 to-emerald-500';
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
    };

    // Header text based on status
    const getHeaderText = () => {
        if (needsPhysicalCopy) return 'Book Registered - No Copies';
        if (isAvailable) return 'Available for Borrowing';
        return 'Currently Borrowed';
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with status indicator */}
                <div className={`p-4 ${getHeaderColor()} text-white`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {needsPhysicalCopy ? <Package size={24} /> : <BookOpen size={24} />}
                            <span className="font-bold text-lg">
                                {getHeaderText()}
                            </span>
                        </div>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-mono">
                            {book.asset_code || book.isbn || 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Book Details with Cover */}
                <div className="p-6 space-y-4">
                    {/* Title, Author and Cover */}
                    <div className="flex gap-4">
                        {/* Book Cover */}
                        <div className="w-24 h-32 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-md">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div className={`fallback-icon w-full h-full flex items-center justify-center ${imageUrl ? 'hidden' : 'flex'}`}>
                                <BookOpen size={32} className="text-gray-400" />
                            </div>
                        </div>

                        {/* Title and Author */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-slate-800 line-clamp-2">{book.title}</h3>
                            <p className="text-slate-500 mt-1">by {book.author}</p>

                            {/* Publisher and Year */}
                            {(book.publisher || book.published_year) && (
                                <div className="mt-2 space-y-1 text-sm text-slate-400">
                                    {book.publisher && (
                                        <div className="flex items-center gap-1.5">
                                            <Building2 size={14} />
                                            <span className="truncate">{book.publisher}</span>
                                        </div>
                                    )}
                                    {book.published_year && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            <span>{book.published_year}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warning for books needing physical copy */}
                    {needsPhysicalCopy && (
                        <div className="p-4 rounded-xl border-2 bg-blue-50 border-blue-200">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-full shadow-sm">
                                    <AlertTriangle size={20} className="text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-blue-800">Physical Copy Required</div>
                                    <div className="text-sm text-blue-600 mt-1">
                                        This book is registered in the system but doesn't have any physical copies yet.
                                        Please add a physical copy before it can be borrowed.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Category</div>
                            <div className="text-slate-700 font-medium">{book.category}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Location</div>
                            <div className="text-slate-700 font-medium flex items-center gap-1">
                                <MapPin size={14} /> {book.location || 'N/A'}
                            </div>
                        </div>
                        {book.call_number && (
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <div className="text-slate-400 text-xs uppercase font-bold mb-1">Call Number</div>
                                <div className="text-slate-700 font-medium font-mono">{book.call_number}</div>
                            </div>
                        )}
                        {book.language && (
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <div className="text-slate-400 text-xs uppercase font-bold mb-1">Language</div>
                                <div className="text-slate-700 font-medium flex items-center gap-1">
                                    <Globe size={14} /> {book.language}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {book.description && (
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Description</div>
                            <div className="text-slate-600 text-sm line-clamp-3">{book.description}</div>
                        </div>
                    )}

                    {/* Borrower Info (if borrowed) */}
                    {isBorrowed && book.borrower && (
                        <div className={`p-4 rounded-xl border-2 ${book.is_overdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-full shadow-sm">
                                    <User size={20} className={book.is_overdue ? 'text-red-500' : 'text-amber-600'} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800">{book.borrower.name}</div>
                                    <div className="text-sm text-slate-500">
                                        {book.borrower.student_id} • {book.borrower.course}
                                    </div>
                                    <div className={`flex items-center gap-2 mt-2 text-sm ${book.is_overdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                        <Calendar size={14} />
                                        Due: {book.due_date ? new Date(book.due_date).toLocaleDateString() : 'N/A'}
                                        {book.is_overdue && (
                                            <span className="flex items-center gap-1 bg-red-100 px-2 py-0.5 rounded text-xs">
                                                <AlertTriangle size={12} /> OVERDUE
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-slate-50 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition"
                    >
                        Cancel
                    </button>

                    {/* Add Physical Copy button for books without copies */}
                    {needsPhysicalCopy && onAddCopy && (
                        <button
                            onClick={() => onAddCopy(book)}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 transition flex items-center justify-center gap-2"
                        >
                            <PlusCircle size={18} /> Add Physical Copy
                        </button>
                    )}

                    {isAvailable && !needsPhysicalCopy && (
                        <button
                            onClick={() => onBorrow(book.asset_code)}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition flex items-center justify-center gap-2"
                        >
                            <ArrowRight size={18} /> Borrow This Book
                        </button>
                    )}

                    {isBorrowed && (
                        <button
                            onClick={() => onReturn(book.asset_code)}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={18} /> Return This Book
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
