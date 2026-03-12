import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { X, BookOpen, Mail, Phone, Building2, Calendar, AlertTriangle, CheckCircle, Clock, DollarSign, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FacultyProfileModal({ faculty, onClose }) {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        total_borrowed: 0,
        active_loans: 0,
        total_fines: 0,
        pending_fines: 0
    });

    useEffect(() => {
        if (faculty?.id) {
            setLoading(true);
            axiosClient.get(`/faculties/${faculty.id}/history`)
                .then(({ data }) => {
                    setHistory(data.transactions || []);
                    setStats(data.stats || {});
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        }
    }, [faculty?.id]);

    const getStatusBadge = (tx) => {
        if (!tx.returned_at) {
            if (tx.is_overdue) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle size={12} /> Overdue
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Clock size={12} /> Active
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle size={12} /> Returned
            </span>
        );
    };

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

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
                >
                    {/* Header with Profile */}
                    <div className="relative px-6 py-6 bg-gradient-to-r from-purple-600 to-indigo-600">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">
                                {faculty.name?.charAt(0) || "?"}
                            </div>
                            <div className="text-white">
                                <h2 className="text-xl font-bold">{faculty.name}</h2>
                                <p className="text-white/80 text-sm font-mono">{faculty.faculty_id}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                                    <span className="flex items-center gap-1">
                                        <Building2 size={14} /> {faculty.department}
                                    </span>
                                    {faculty.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail size={14} /> {faculty.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700 text-center">
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total_borrowed}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Total Borrowed</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{stats.active_loans}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Active Loans</p>
                        </div>
                    </div>

                    {/* History */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BookOpen size={14} /> Borrowing History
                        </h3>

                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="animate-spin h-8 w-8 mx-auto text-purple-600" />
                                <p className="text-gray-400 mt-2">Loading history...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-slate-500">
                                <BookOpen size={40} strokeWidth={1.5} className="mx-auto mb-2" />
                                <p>No borrowing history found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700"
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 dark:text-white">{tx.book_title}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                {tx.asset_code} • Borrowed: {new Date(tx.borrowed_at).toLocaleDateString()}
                                            </p>
                                            {tx.returned_at && (
                                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                                    Returned: {new Date(tx.returned_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(tx)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
