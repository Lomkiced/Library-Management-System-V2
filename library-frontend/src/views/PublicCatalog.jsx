import { useState, useEffect } from "react";
import KioskLayout from "./KioskLayout";
import FlipBookCard from "../components/FlipBookCard";
import ShelfMapModal from "../components/ShelfMapModal";
import axiosClient from "../axios-client";
import { useToast } from "../components/ui/Toast";
import { Search, Loader2, BookOpen, MapPin, Library, BookMarked, X, ChevronRight, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Glass Card Helper ---
const GlassCard = ({ children, className = "", onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden hover:bg-white/10 transition-all duration-300 ${className} ${onClick ? 'cursor-pointer group' : ''}`}
    >
        {children}
    </div>
);

export default function PublicCatalog() {
    const toast = useToast();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedBook, setSelectedBook] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 400) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        // Fetch Categories
        setLoadingCategories(true);
        axiosClient.get('/public/books/categories')
            .then(({ data }) => {
                const totalBooks = data.reduce((sum, cat) => sum + cat.count, 0);
                const allCategory = { category: "All", count: totalBooks };
                setCategories([allCategory, ...data]);
                setLoadingCategories(false);
            })
            .catch(err => {
                console.error("Failed to fetch categories:", err);
                setLoadingCategories(false);
            });
    }, []);

    // Reset pagination when search or category changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        setBooks([]); // Clear current books to show loading state or fresh results

        const delayDebounceFn = setTimeout(() => {
            fetchBooks(1, true);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedCategory]);

    const fetchBooks = (pageToFetch = 1, isFresh = false) => {
        if (isFresh) setLoading(true);
        else setLoadingMore(true);

        const params = {
            page: pageToFetch,
            limit: 12
        };

        if (selectedCategory !== "All") {
            params.category = selectedCategory;
        }

        if (searchTerm) {
            params.search = searchTerm;
        }

        axiosClient.get('/public/books', { params })
            .then(({ data }) => {
                const newBooks = data.data || [];
                const meta = data; // Laravel pagination object usually has current_page, last_page, etc. at root or in meta

                if (isFresh) {
                    setBooks(newBooks);
                } else {
                    setBooks(prev => [...prev, ...newBooks]);
                }

                // Check if we have more pages
                // Assuming standard Laravel pagination response structure: data, current_page, last_page
                if (data.current_page >= data.last_page) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                setLoading(false);
                setLoadingMore(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
                setLoadingMore(false);
            });
    };

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchBooks(nextPage, false);
        }
    };

    const handleLocate = (book) => {
        axiosClient.get(`/public/books/${book.id}`)
            .then(({ data }) => {
                const asset = data.assets && data.assets.length > 0 ? data.assets[0] : null;
                if (asset) setSelectedBook({ ...book, foundAsset: asset });
                else toast.error("Sorry, no physical copy location found.");
            })
            .catch(err => {
                console.error(err);
                toast.error("Failed to locate book details.");
            });
    };

    // Count stats
    const totalBooks = categories.find(c => c.category === "All")?.count || 0;
    const categoryCount = categories.length > 1 ? categories.length - 1 : 0;

    return (
        <KioskLayout>
            {/* HERO SECTION */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative mb-8"
            >
                {/* Decorative Background Glow */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-pink-500/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Title Section */}
                <div className="relative text-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-3 mb-4"
                    >
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                            <Library className="text-blue-400" size={28} />
                        </div>
                        <div className="text-left">
                            <h1 className="text-3xl font-black text-white tracking-tight">
                                Book Catalog
                            </h1>
                            <p className="text-sm text-slate-400">
                                {totalBooks.toLocaleString()} books across {categoryCount} categories
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* HERO SEARCH BAR */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-3xl mx-auto"
                >
                    <GlassCard
                        className={`p-1 relative transition-all duration-500 ${isSearchFocused
                            ? 'bg-slate-900/80 border-blue-500/30 shadow-2xl shadow-blue-500/10 scale-[1.02]'
                            : 'bg-slate-900/60'
                            }`}
                    >
                        {/* Animated Border Gradient */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 opacity-0 transition-opacity duration-500 ${isSearchFocused ? 'opacity-100' : ''}`} style={{ padding: '1px' }}>
                            <div className="w-full h-full bg-slate-900 rounded-2xl" />
                        </div>

                        <div className="relative flex items-center px-6 py-4">
                            <Search className={`mr-4 transition-colors duration-300 ${isSearchFocused ? 'text-blue-400' : 'text-slate-500'}`} size={24} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                placeholder="Search by title, author, or ISBN..."
                                className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 text-lg font-medium"
                                autoFocus
                            />
                            {searchTerm && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setSearchTerm('')}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                >
                                    <X size={16} />
                                </motion.button>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>
            </motion.div>

            {/* CATEGORY NAVIGATION */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {loadingCategories ? (
                        // Skeleton loaders
                        [...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="h-10 w-28 bg-white/5 rounded-xl animate-pulse flex-shrink-0"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))
                    ) : (
                        categories.map((cat, index) => (
                            <motion.button
                                key={cat.category}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * index }}
                                onClick={() => setSelectedCategory(cat.category)}
                                className={`group relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${selectedCategory === cat.category
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10'
                                    }`}
                            >
                                {cat.category === "All" && <BookMarked size={14} className="opacity-70" />}
                                <span>{cat.category}</span>
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${selectedCategory === cat.category
                                    ? 'bg-white/20 text-white'
                                    : 'bg-white/5 text-slate-500 group-hover:bg-white/10'
                                    }`}>
                                    {cat.count || 0}
                                </span>
                            </motion.button>
                        ))
                    )}
                </div>
            </motion.div>

            {/* BOOKS CATALOG GRID */}
            <div className="relative">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between mb-6"
                >
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">
                            {selectedCategory === "All" ? "All Books" : selectedCategory}
                        </h2>
                        {!loading && (
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                                {books.length} {books.length === 1 ? 'book' : 'books'}
                            </span>
                        )}
                    </div>

                    {searchTerm && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span>Results for:</span>
                            <span className="px-3 py-1 rounded-lg bg-white/5 text-white font-medium border border-white/10">
                                "{searchTerm}"
                            </span>
                        </div>
                    )}
                </motion.div>

                {/* BOOKS GRID */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-24"
                        >
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                    <Loader2 size={32} className="animate-spin text-blue-400" />
                                </div>
                                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
                            </div>
                            <p className="text-slate-500 mt-6 font-medium">Searching catalog...</p>
                        </motion.div>
                    ) : books.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                            {books.map((book, i) => (
                                <motion.div
                                    key={book.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, delay: i < 10 ? i * 0.04 : 0 }}
                                    className="group"
                                >
                                    <div className="relative">
                                        <FlipBookCard book={book} index={i} />

                                        {/* Quick Locate Button Overlay */}
                                        <motion.button
                                            onClick={(e) => { e.stopPropagation(); handleLocate(book); }}
                                            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-[11px] font-bold px-4 py-2 rounded-xl shadow-lg shadow-blue-500/25 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5 z-30 whitespace-nowrap"
                                        >
                                            <MapPin size={12} />
                                            <span>Locate Book</span>
                                            <ChevronRight size={12} className="opacity-60" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-24"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center mb-6">
                                <BookOpen size={40} className="text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-400 mb-2">No books found</h3>
                            <p className="text-slate-500 text-center max-w-md">
                                {searchTerm
                                    ? `No results for "${searchTerm}" in ${selectedCategory === "All" ? "all categories" : selectedCategory}.`
                                    : `No books available in ${selectedCategory}.`
                                }
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="mt-6 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10"
                                >
                                    Clear Search
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* LOAD MORE BUTTON */}
                    {hasMore && books.length > 0 && !loading && (
                        <div className="flex justify-center mt-12 mb-8">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="group relative px-8 py-3 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto] animate-gradient" />
                                <div className="absolute inset-[1px] rounded-2xl bg-slate-900 group-hover:bg-slate-900/80 transition-colors" />
                                <span className="relative flex items-center gap-2">
                                    {loadingMore ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            Load More Books
                                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* SCROLL TO TOP BUTTON */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToTop}
                        className="fixed top-1/2 -translate-y-1/2 left-8 z-50 p-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-white/20 flex items-center justify-center hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] transition-shadow duration-300"
                        title="Scroll to Top"
                    >
                        <ArrowUp size={24} strokeWidth={2.5} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* MODAL */}
            <AnimatePresence>
                {selectedBook && (
                    <ShelfMapModal
                        book={selectedBook}
                        location={selectedBook.foundAsset}
                        onClose={() => setSelectedBook(null)}
                    />
                )}
            </AnimatePresence>
        </KioskLayout>
    );
}
