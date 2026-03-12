import { X, MapPin, Building, Library, BookOpen, Calendar, Building2, FileText } from "lucide-react";

export default function ShelfMapModal({ book, location, onClose }) {
    if (!book || !location) return null;

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-scale-up">

                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Library size={120} />
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-2xl font-bold mb-1">Locate Book</h2>
                    <p className="text-primary-100 text-sm">Follow the map to find your book.</p>
                </div>

                {/* Book Info with Cover */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex gap-4">
                        {/* Book Cover */}
                        <div className="w-20 h-28 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-md">
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
                                <BookOpen size={28} className="text-gray-400" />
                            </div>
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-lg line-clamp-2">{book.title}</h3>
                            <p className="text-gray-500 text-sm">{book.author}</p>

                            {/* Additional Info */}
                            <div className="mt-2 space-y-1 text-xs text-gray-400">
                                {book.publisher && (
                                    <div className="flex items-center gap-1.5">
                                        <Building2 size={12} />
                                        <span className="truncate">{book.publisher}</span>
                                    </div>
                                )}
                                {book.call_number && (
                                    <div className="flex items-center gap-1.5">
                                        <FileText size={12} />
                                        <span className="font-mono">{book.call_number}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                Available Now
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location Details */}
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4 p-4 border-2 border-primary-100 rounded-xl bg-primary-50/50">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-primary-600">
                            <MapPin size={28} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-primary-400 uppercase tracking-wider">Exact Location</div>
                            <div className="text-xl font-bold text-gray-800">
                                {location.shelf || book.location || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">
                                {[location.building, location.aisle].filter(Boolean).join(', ') || 'Location details not specified'}
                            </div>
                        </div>
                    </div>

                    {/* Visual Map Placeholder */}
                    <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <Building size={32} className="mb-2" />
                        <span className="text-xs font-medium">Shelf Map Visualization</span>
                        <span className="text-[10px] mt-1">(Mockup)</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-200"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </div>
    );
}
