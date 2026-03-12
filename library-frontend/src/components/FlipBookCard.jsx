import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Building2, Tag, Hash, CheckCircle, AlertCircle } from "lucide-react";
import { ASSET_URL } from "../axios-client";
import { cn, getStorageUrl } from "../lib/utils";

export default function FlipBookCard({ book, index }) {
    const imagePath = book.image_path || book.cover_image;
    const imageUrl = getStorageUrl(imagePath);

    const [isFlipped, setIsFlipped] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="relative w-full h-80 perspective-1000 cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: isHovered || isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* FRONT FACE */}
                <div
                    className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                >
                    <div className="h-full w-full relative">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={book.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.fallback').style.display = 'flex'; }}
                            />
                        ) : null}

                        {/* Fallback Icon */}
                        <div className={`fallback absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-700 text-gray-300 dark:text-slate-600 ${imageUrl ? 'hidden' : 'flex'}`}>
                            <BookOpen size={48} strokeWidth={1.5} />
                        </div>

                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                            <h3 className="text-white font-bold text-lg line-clamp-2 leading-tight shadow-black drop-shadow-md">
                                {book.title}
                            </h3>
                            {book.subtitle && (
                                <p className="text-white/90 text-xs italic line-clamp-1 mb-0.5">{book.subtitle}</p>
                            )}
                            <p className="text-white/80 text-sm mt-1 font-medium">{book.author}</p>
                        </div>

                        {/* Availability Badge */}
                        <div className="absolute top-3 right-3">
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/20",
                                book.available_copies > 0
                                    ? "bg-emerald-500/90 text-white"
                                    : book.damaged_copies > 0
                                        ? "bg-orange-500/90 text-white" // Damaged color
                                        : "bg-red-500/90 text-white"
                            )}>
                                {book.available_copies > 0
                                    ? "Available"
                                    : book.damaged_copies > 0
                                        ? "DAMAGED BOOK"
                                        : "Borrowed"
                                }
                            </span>
                        </div>
                    </div>
                </div>

                {/* BACK FACE */}
                <div
                    className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 flex flex-col justify-between"
                    style={{
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden"
                    }}
                >

                    {/* Top Section: Info */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-gray-900 dark:text-white font-bold text-sm line-clamp-2 leading-tight">
                                {book.title}
                            </h4>
                            {book.subtitle && (
                                <p className="text-xs text-gray-500 dark:text-slate-400 italic line-clamp-1 mb-1">{book.subtitle}</p>
                            )}
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                                {book.category || "General"}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                <Building2 size={14} className="text-gray-400" />
                                <span className="truncate">{book.publisher || "Unknown Publisher"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                <Calendar size={14} className="text-gray-400" />
                                <span>{book.published_year || "Year N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                <Hash size={14} className="text-gray-400" />
                                <span className="font-mono">{book.isbn || "No ISBN"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Status & Copies */}
                    <div>
                        <div className="h-px w-full bg-gray-100 dark:bg-slate-700 mb-3"></div>

                        <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500 dark:text-slate-500">
                                Copies
                            </div>
                            <div className="font-bold text-lg text-gray-800 dark:text-white">
                                {book.available_copies}
                            </div>
                        </div>

                        <div className={cn(
                            "mt-2 w-full py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5",
                            book.available_copies > 0
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : book.damaged_copies > 0
                                    ? "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                            {book.available_copies > 0
                                ? <><CheckCircle size={12} /> AVAILABLE NOW</>
                                : book.damaged_copies > 0
                                    ? <><AlertCircle size={12} /> DAMAGED BOOK</>
                                    : <><AlertCircle size={12} /> OUT OF STOCK</>
                            }
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
