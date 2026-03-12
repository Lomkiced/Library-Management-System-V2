import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, X, Book, ChevronRight, CheckCircle, AlertCircle,
    ChevronLeft, ChevronsLeft, ChevronsRight, Copy,
} from "lucide-react";
import { ASSET_URL } from "../axios-client";
import axiosClient from "../axios-client";
import { cn } from "../lib/utils";

const DEBOUNCE_MS = 400;
const PER_PAGE = 18;

/**
 * BookSelectorModal — Paginated browse modal for books.
 *
 * Fetching strategy:
 *   - If `apiEndpoint` is provided, the modal self-fetches with server-side
 *     pagination, search, and (optionally) category filtering.
 *   - If `books` prop is provided instead, the modal filters client-side
 *     (legacy / small-list mode, e.g. a pre-fetched list).
 *
 * Props:
 *   isOpen, onClose, onSelect, title, mode ('borrow' | 'return'),
 *   apiEndpoint (string), apiParams (object), books (array, fallback)
 */
export default function BookSelectorModal({
    isOpen,
    onClose,
    books: externalBooks,
    onSelect,
    title = "Select Book",
    mode = "borrow",
    apiEndpoint,          // e.g. "/books/available/catalog" or "/books/borrowed/catalog"
    apiParams = {},       // e.g. { type: "student" } — merged into every request
}) {
    // ── Server-paginated state ────────────────────────────────────────
    const [catalogBooks, setCatalogBooks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [categories, setCategories] = useState(["All"]);
    const [loading, setLoading] = useState(false);

    // ── Shared filter state ───────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const debounceRef = useRef(null);

    // ── Client-filtered state (fallback) ──────────────────────────────
    const [clientFiltered, setClientFiltered] = useState([]);

    // Decide whether to use server-side fetching
    const useServer = Boolean(apiEndpoint);
    const displayBooks = useServer ? catalogBooks : clientFiltered;

    // ─── Server-side fetch ────────────────────────────────────────────
    const fetchCatalog = useCallback(
        (page = 1, search = "", category = "All") => {
            if (!apiEndpoint) return;
            setLoading(true);
            axiosClient
                .get(apiEndpoint, {
                    params: {
                        ...apiParams,
                        page,
                        per_page: PER_PAGE,
                        search: search || undefined,
                        category: category !== "All" ? category : undefined,
                    },
                })
                .then(({ data }) => {
                    setCatalogBooks(data.books?.data ?? []);
                    setCurrentPage(data.books?.current_page ?? 1);
                    setLastPage(data.books?.last_page ?? 1);
                    setTotalResults(data.books?.total ?? 0);
                    if (data.categories) setCategories(data.categories);
                })
                .catch(() => {
                    setCatalogBooks([]);
                })
                .finally(() => setLoading(false));
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [apiEndpoint, JSON.stringify(apiParams)]
    );

    // ─── Open / close lifecycle ───────────────────────────────────────
    useEffect(() => {
        if (isOpen && useServer) {
            setSearchQuery("");
            setSelectedCategory("All");
            setCurrentPage(1);
            fetchCatalog(1, "", "All");
        }
        if (!isOpen) {
            setCatalogBooks([]);
            setSearchQuery("");
            setSelectedCategory("All");
        }
    }, [isOpen, useServer, fetchCatalog]);

    // ─── Debounced search (server) ────────────────────────────────────
    useEffect(() => {
        if (!isOpen || !useServer) return;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchCatalog(1, searchQuery, selectedCategory);
        }, DEBOUNCE_MS);
        return () => clearTimeout(debounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, selectedCategory]);

    // ─── Client-side filtering (fallback) ─────────────────────────────
    useEffect(() => {
        if (useServer || !externalBooks) return;
        let result = externalBooks;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (b) =>
                    b.title?.toLowerCase().includes(q) ||
                    b.author?.toLowerCase().includes(q) ||
                    b.asset_code?.toLowerCase().includes(q) ||
                    (b.borrower && b.borrower.toLowerCase().includes(q))
            );
        }
        if (selectedCategory !== "All") {
            result = result.filter((b) => (b.category || "Uncategorized") === selectedCategory);
        }
        setClientFiltered(result);
    }, [searchQuery, selectedCategory, externalBooks, useServer]);

    // Extract categories client-side for fallback
    useEffect(() => {
        if (useServer || !externalBooks?.length) return;
        const cats = ["All", ...new Set(externalBooks.map((b) => b.category || "Uncategorized"))];
        setCategories(cats);
        setClientFiltered(externalBooks);
    }, [externalBooks, useServer]);

    // ─── Page helpers ─────────────────────────────────────────────────
    const goToPage = (p) => {
        const page = Math.max(1, Math.min(p, lastPage));
        setCurrentPage(page);
        fetchCatalog(page, searchQuery, selectedCategory);
    };

    const pageNumbers = (() => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(lastPage, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    })();

    const fromItem = (currentPage - 1) * PER_PAGE + 1;
    const toItem = Math.min(currentPage * PER_PAGE, totalResults);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col h-[85vh]"
                >
                    {/* ── Header ───────────────────────────────────────── */}
                    <div className="p-6 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Book className={mode === "borrow" ? "text-blue-600" : "text-emerald-600"} />
                                    {title}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {useServer
                                        ? loading
                                            ? "Searching…"
                                            : `${totalResults.toLocaleString()} books found`
                                        : `${displayBooks.length} books found`}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder={
                                        mode === "return"
                                            ? "Search by title, author, barcode, borrower…"
                                            : "Search by title, author, barcode…"
                                    }
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-xl outline-none transition-all font-medium text-gray-700 dark:text-gray-200"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Desktop — only show when categories are available */}
                            {categories.length > 1 && (
                                <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 max-w-md no-scrollbar">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors",
                                                selectedCategory === cat
                                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Content Area ─────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950/50 p-6 custom-scrollbar">
                        {loading ? (
                            /* Skeleton loading grid */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 animate-pulse"
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-16 h-24 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                                            <div className="flex-1 space-y-3 py-1">
                                                <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded" />
                                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-slate-700 rounded" />
                                                <div className="h-3 w-1/2 bg-gray-200 dark:bg-slate-700 rounded" />
                                                <div className="h-6 w-24 bg-gray-200 dark:bg-slate-700 rounded mt-2" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : displayBooks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Book size={64} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">No books found matching your criteria</p>
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedCategory("All");
                                        }}
                                        className="mt-3 text-sm text-blue-500 hover:text-blue-600 font-semibold"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {displayBooks.map((book) => (
                                    <div
                                        key={book.id || book.asset_code}
                                        onClick={() => onSelect(book)}
                                        className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="flex gap-4">
                                            {/* Book Cover / Icon */}
                                            <div className="w-16 h-24 bg-blue-50 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-sm">
                                                {book.image_path ? (
                                                    <img
                                                        src={`${ASSET_URL}/${book.image_path}`}
                                                        alt={book.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Book size={32} className="text-blue-300 dark:text-slate-500" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                                        {book.category || "General"}
                                                    </span>
                                                    {book.is_recommended && (
                                                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                                            Recommended
                                                        </span>
                                                    )}
                                                    {book.is_overdue && (
                                                        <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                                            Overdue
                                                        </span>
                                                    )}
                                                </div>

                                                <h3
                                                    className="font-bold text-gray-800 dark:text-gray-100 truncate pr-4"
                                                    title={book.title}
                                                >
                                                    {book.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                                                    {book.author}
                                                </p>

                                                <div className="mt-3 flex items-center justify-between">
                                                    {mode === "return" ? (
                                                        /* Return mode: show barcode + borrower */
                                                        <>
                                                            <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                                {book.asset_code}
                                                            </span>
                                                            <div className="text-right">
                                                                <div className="text-xs font-medium text-gray-500">Borrowed by</div>
                                                                <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                                    {book.borrower}
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        /* Borrow mode: show copy count badge */
                                                        <>
                                                            {book.call_number && (
                                                                <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                                    {book.call_number}
                                                                </span>
                                                            )}
                                                            <span
                                                                className={cn(
                                                                    "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5",
                                                                    book.available_copies > 3
                                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                                        : book.available_copies > 1
                                                                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                                                            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                                                )}
                                                            >
                                                                <Copy size={10} />
                                                                {book.available_copies} of {book.total_copies}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Footer with Pagination ───────────────────────── */}
                    <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                        {useServer && lastPage > 1 ? (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                {/* Info text */}
                                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                                    Showing {fromItem}–{toItem} of {totalResults.toLocaleString()} results
                                </span>

                                {/* Page navigation */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => goToPage(1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="First page"
                                    >
                                        <ChevronsLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Previous page"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    {pageNumbers[0] > 1 && (
                                        <span className="px-1 text-xs text-gray-400">…</span>
                                    )}

                                    {pageNumbers.map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => goToPage(p)}
                                            className={cn(
                                                "min-w-[32px] h-8 rounded-lg text-sm font-bold transition-all",
                                                p === currentPage
                                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                                    : "text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}

                                    {pageNumbers[pageNumbers.length - 1] < lastPage && (
                                        <span className="px-1 text-xs text-gray-400">…</span>
                                    )}

                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === lastPage}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Next page"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    <button
                                        onClick={() => goToPage(lastPage)}
                                        disabled={currentPage === lastPage}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Last page"
                                    >
                                        <ChevronsRight size={16} />
                                    </button>
                                </div>

                                {/* Esc hint */}
                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                    Press{" "}
                                    <kbd className="font-mono bg-white dark:bg-slate-800 px-1 border rounded">
                                        Esc
                                    </kbd>{" "}
                                    to close
                                </span>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>
                                    {useServer
                                        ? `Showing ${totalResults.toLocaleString()} results`
                                        : `Showing ${displayBooks.length} results`}
                                </span>
                                <span>
                                    Press{" "}
                                    <kbd className="font-mono bg-white dark:bg-slate-800 px-1 border rounded">
                                        Esc
                                    </kbd>{" "}
                                    to close
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
