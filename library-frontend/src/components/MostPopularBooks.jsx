import { useEffect, useState } from "react";
import axiosClient, { ASSET_URL } from "../axios-client";
import { Trophy, TrendingUp, BookOpen, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { cn, getStorageUrl } from "../lib/utils";

export default function MostPopularBooks() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMostBorrowed();
    }, []);

    const fetchMostBorrowed = () => {
        axiosClient.get("/reports/most-borrowed")
            .then(({ data }) => {
                setBooks(Array.isArray(data) ? data.slice(0, 3) : []); // Top 3
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    if (!loading && books.length === 0) return null;

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-500">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Most Popular Books</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Top borrowed titles this month</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {loading
                    ? [...Array(5)].map((_, i) => (
                        <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
                    ))
                    : books.map((book, index) => (
                        <PopularBookCard key={book.id} book={book} index={index} />
                    ))}
            </div>
        </div>
    );
}

function PopularBookCard({ book, index }) {
    const imagePath = book.image_path;
    const imageUrl = getStorageUrl(imagePath);

    // Rank Colors
    const getRankStyle = (idx) => {
        if (idx === 0) return "border-amber-400 shadow-amber-200/50 dark:shadow-amber-900/20"; // Gold
        if (idx === 1) return "border-slate-300 shadow-slate-200/50 dark:shadow-slate-900/20"; // Silver
        if (idx === 2) return "border-orange-300 shadow-orange-200/50 dark:shadow-orange-900/20"; // Bronze
        return "border-transparent border-gray-100 dark:border-slate-700";
    };

    const getBadgeColor = (idx) => {
        if (idx === 0) return "bg-gradient-to-r from-amber-300 to-amber-500 text-white";
        if (idx === 1) return "bg-gradient-to-r from-slate-300 to-slate-400 text-white";
        if (idx === 2) return "bg-gradient-to-r from-orange-300 to-orange-400 text-white";
        return "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "relative group flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border-2",
                getRankStyle(index)
            )}
        >
            {/* Rank Badge */}
            <div className={cn(
                "absolute top-0 left-0 z-10 px-3 py-1.5 rounded-br-2xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1",
                getBadgeColor(index)
            )}>
                {index === 0 && <Crown size={12} fill="currentColor" />}
                #{index + 1}
            </div>

            {/* Image Section */}
            <div className="relative h-48 overflow-hidden bg-gray-50 dark:bg-slate-900">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-700">
                        <BookOpen size={40} />
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                {/* Borrow Count Overlay */}
                <div className="absolute bottom-3 right-3 text-white flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="font-bold text-sm">{book.borrow_count} borrows</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-1">
                <h4 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-2 leading-tight mb-1" title={book.title}>
                    {book.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{book.author}</p>
            </div>
        </motion.div>
    );
}
