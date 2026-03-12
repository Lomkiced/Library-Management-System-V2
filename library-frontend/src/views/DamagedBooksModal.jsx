import { useEffect, useState } from "react";
import axiosClient, { ASSET_URL } from "../axios-client";
import { useToast } from "../components/ui/Toast";
import { X, Wrench, AlertTriangle, BookOpen, Search, Plus } from "lucide-react";
import Swal from "sweetalert2";

export default function DamagedBooksModal({ onClose, onSuccess }) {
    const toast = useToast();
    const [damagedBooks, setDamagedBooks] = useState([]);
    const [availableBooks, setAvailableBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [repairingId, setRepairingId] = useState(null);
    const [markingId, setMarkingId] = useState(null);
    const [activeTab, setActiveTab] = useState('damaged'); // 'damaged' or 'mark'
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDamagedBooks();
        fetchAvailableBooks();
    }, []);

    const fetchDamagedBooks = () => {
        setLoading(true);
        axiosClient.get('/books/damaged')
            .then(({ data }) => {
                setDamagedBooks(data);
                setLoading(false);
            })
            .catch((err) => {
                setLoading(false);
                toast.error("Failed to load damaged books.");
            });
    };

    const fetchAvailableBooks = () => {
        axiosClient.get('/books/available')
            .then(({ data }) => {
                // Endpoint is now paginated — extract the items array from data.data
                setAvailableBooks(data.data ?? data);
            })
            .catch((err) => {
                console.warn("Failed to load available books.");
            });
    };

    const handleRepair = (assetId) => {
        setRepairingId(assetId);
        axiosClient.post(`/books/assets/${assetId}/repair`)
            .then(() => {
                toast.success("Book has been repaired and restored to inventory.");
                fetchDamagedBooks();
                fetchAvailableBooks();
                if (onSuccess) onSuccess();
                setRepairingId(null);
            })
            .catch((err) => {
                const message = err.response?.data?.message || "Failed to repair book.";
                toast.error(message);
                setRepairingId(null);
            });
    };

    const handleMarkAsDamaged = async (asset) => {
        // Confirm with user
        const result = await Swal.fire({
            title: 'Mark as Damaged?',
            html: `Are you sure you want to mark <strong>"${asset.title}"</strong> (${asset.asset_code}) as damaged?<br/><br/>This book will be removed from circulation until repaired.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Mark as Damaged'
        });

        if (!result.isConfirmed) return;

        setMarkingId(asset.asset_code);

        // Use the new endpoint that accepts asset_code directly
        axiosClient.post('/books/mark-damaged', { asset_code: asset.asset_code })
            .then(() => {
                toast.success(`"${asset.title}" has been marked as damaged.`);
                fetchDamagedBooks();
                fetchAvailableBooks();
                if (onSuccess) onSuccess();
                setMarkingId(null);
            })
            .catch((err) => {
                const message = err.response?.data?.message || "Failed to mark book as damaged.";
                toast.error(message);
                setMarkingId(null);
            });
    };

    // Filter available books based on search
    const filteredAvailable = availableBooks.filter(book =>
        book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.asset_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-rose-600 p-6 text-white flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <AlertTriangle size={24} /> Damaged Books Management
                        </h2>
                        <p className="text-rose-100 mt-1">Manage damaged books - mark as damaged or restore repaired ones.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-slate-700 shrink-0">
                    <button
                        onClick={() => setActiveTab('damaged')}
                        className={`flex-1 py-3 px-4 text-sm font-bold transition-all ${activeTab === 'damaged'
                            ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50 dark:bg-rose-900/20'
                            : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Wrench size={16} />
                            Damaged Books ({damagedBooks.length})
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('mark')}
                        className={`flex-1 py-3 px-4 text-sm font-bold transition-all ${activeTab === 'mark'
                            ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50 dark:bg-rose-900/20'
                            : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Plus size={16} />
                            Mark Book as Damaged
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'damaged' ? (
                        // DAMAGED BOOKS TAB
                        loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                            </div>
                        ) : damagedBooks.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                                <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="text-lg">No books currently marked as damaged.</p>
                                <p className="text-sm mt-2">All books are in good condition! 🎉</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {damagedBooks.map((asset) => (
                                    <div key={asset.id} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600 flex justify-between items-center group hover:border-rose-200 dark:hover:border-rose-700 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-16 bg-gray-200 dark:bg-slate-600 rounded flex-shrink-0 overflow-hidden">
                                                {asset.book_title?.image_path ? (
                                                    <img src={`${ASSET_URL}/${asset.book_title.image_path}`} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <BookOpen size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white line-clamp-1">{asset.book_title?.title}</h4>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">Code: <span className="font-mono text-rose-600 dark:text-rose-400">{asset.asset_code}</span></p>
                                                <p className="text-xs text-start text-gray-400">Damaged since: {new Date(asset.updated_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded border border-rose-200 dark:border-rose-800">
                                                Damaged
                                            </span>
                                            <button
                                                onClick={() => handleRepair(asset.id)}
                                                disabled={repairingId === asset.id}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Mark as repaired and restore to inventory"
                                            >
                                                {repairingId === asset.id ? (
                                                    "Repairing..."
                                                ) : (
                                                    <>
                                                        <Wrench size={16} /> Repair
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        // MARK AS DAMAGED TAB
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search available books by title, code, or author..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900 focus:border-rose-500 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            {/* Available Books List */}
                            {filteredAvailable.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                                    <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-lg">No available books found.</p>
                                    <p className="text-sm mt-2">{searchQuery ? 'Try a different search term.' : 'All books are currently borrowed or damaged.'}</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredAvailable.slice(0, 20).map((asset) => (
                                        <div key={asset.asset_code} className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100 dark:border-slate-600 flex justify-between items-center hover:border-rose-200 dark:hover:border-rose-700 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-14 bg-gray-200 dark:bg-slate-600 rounded flex-shrink-0 overflow-hidden">
                                                    {asset.image_path ? (
                                                        <img src={`${ASSET_URL}/${asset.image_path}`} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <BookOpen size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1">{asset.title}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                                        <span className="font-mono text-gray-600 dark:text-gray-300">{asset.asset_code}</span>
                                                        {asset.author && <span className="ml-2">by {asset.author}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleMarkAsDamaged(asset)}
                                                disabled={markingId === asset.asset_code}
                                                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {markingId === asset.asset_code ? (
                                                    "Marking..."
                                                ) : (
                                                    <>
                                                        <AlertTriangle size={14} /> Mark Damaged
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                    {filteredAvailable.length > 20 && (
                                        <p className="text-center text-sm text-gray-400 py-2">
                                            Showing 20 of {filteredAvailable.length} books. Use search to find specific books.
                                        </p>
                                    )}
                                </div>
                            )}
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
