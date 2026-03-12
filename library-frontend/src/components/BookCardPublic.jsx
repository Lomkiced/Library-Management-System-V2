import { MapPin, Book, Calendar, FileText, Building2 } from "lucide-react";

export default function BookCardPublic({ book, onLocate }) {
    const isAvailable = book.available_copies > 0;

    // Get image URL - handle both image_path (new) and cover_image (legacy)
    const getImageUrl = () => {
        const imagePath = book.image_path || book.cover_image;
        if (!imagePath) return null;

        // If it's already a full URL, return as is
        if (imagePath.startsWith('http')) return imagePath;

        // Otherwise, prepend the API base URL
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
        return `${baseUrl}/${imagePath}`;
    };

    const imageUrl = getImageUrl();

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="flex h-full">
                {/* Cover Image */}
                <div className="w-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border-r border-gray-100 relative overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div className={`fallback-icon absolute inset-0 flex items-center justify-center ${imageUrl ? 'hidden' : 'flex'}`}>
                        <Book size={40} className="text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    {/* Status Band */}
                    <div className={`absolute bottom-0 w-full text-center text-[10px] font-bold uppercase py-1.5 ${isAvailable ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {isAvailable ? `${book.available_copies} Available` : 'Borrowed'}
                    </div>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1 min-w-0">
                    <div className="mb-auto">
                        <span className="text-[10px] font-bold tracking-wider text-primary-600 uppercase mb-1 block">
                            {book.category}
                        </span>
                        <h3 className="font-bold text-gray-800 leading-tight mb-1 line-clamp-2" title={book.title}>
                            {book.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2 truncate">{book.author}</p>

                        {/* Additional Info */}
                        <div className="space-y-1 text-xs text-gray-400">
                            {book.publisher && (
                                <div className="flex items-center gap-1.5 truncate">
                                    <Building2 size={12} />
                                    <span className="truncate">{book.publisher}</span>
                                </div>
                            )}
                            {book.published_year && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={12} />
                                    <span>{book.published_year}</span>
                                </div>
                            )}
                            {book.call_number && (
                                <div className="flex items-center gap-1.5">
                                    <FileText size={12} />
                                    <span className="font-mono">{book.call_number}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs font-medium text-gray-400 font-mono truncate">
                            {book.isbn || 'No ISBN'}
                        </div>
                        {isAvailable && (
                            <button
                                onClick={() => onLocate(book)}
                                className="flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-2 rounded-lg hover:bg-primary-100 transition-colors flex-shrink-0"
                            >
                                <MapPin size={14} />
                                <span className="hidden sm:inline">Find It</span>
                            </button>
                        )}
                    </div>

                    {/* Mobile Button */}
                    <div className="mt-2 sm:hidden">
                        {isAvailable ? (
                            <button
                                onClick={() => onLocate(book)}
                                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-2 rounded-lg"
                            >
                                <MapPin size={14} /> Locate
                            </button>
                        ) : (
                            <div className="text-center text-xs font-bold text-rose-500 bg-rose-50 py-2 rounded-lg">
                                Out of Stock
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
