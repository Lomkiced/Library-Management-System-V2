import { useState, useEffect, useRef } from "react";
import axiosClient, { API_BASE_URL, ASSET_URL } from "../axios-client";
import { X, BookOpen, AlertTriangle, CheckCircle, DollarSign, Calendar, Hash, Printer, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import LibraryCard from "../components/LibraryCard";
import Pagination from "../components/ui/Pagination"; // Import Pagination
import Swal from "sweetalert2";

export default function StudentProfileModal({ student: initialStudent, onClose, onUpdate }) {
    const [student, setStudent] = useState(initialStudent);
    const [transactions, setTransactions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10; // Must match backend paginate(10)

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [stats, setStats] = useState({
        totalBorrowed: 0,
        currentLoans: 0,
        overdueCount: 0,
        totalFines: 0,
        pendingFines: 0,
        accruedFines: 0,
        totalOwed: 0,
        finePerDay: 0
    });

    useEffect(() => {
        fetchStudentHistory(1); // Reset to page 1 on open/change
    }, [initialStudent]);

    const fetchStudentHistory = (page = 1) => {
        setLoading(true);
        axiosClient.get(`/students/${initialStudent.id}/history?page=${page}`)
            .then(({ data }) => {
                // Handle Paginated Response
                if (data.transactions && data.transactions.data) {
                    setTransactions(data.transactions.data);
                    setCurrentPage(data.transactions.current_page);
                    setTotalPages(data.transactions.last_page);
                    setTotalItems(data.transactions.total);
                } else {
                    setTransactions([]);
                }

                setStats(data.stats || stats);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    // Handle Page Change
    const handlePageChange = (page) => {
        fetchStudentHistory(page);
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            Swal.fire('Error', 'Please select a valid image file.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('profile_picture', file);
        formData.append('_method', 'PUT'); // Spoof PUT for Laravel

        // Append other required fields to avoid validation errors (if backend requires them for update)
        // Usually, update endpoint might validate required fields again.
        // Let's send current values just in case or hopefully backend allows partial if not 'required'.
        // Checking StudentController: it validates name, course, etc. as REQUIRED.
        // So we MUST send them again.
        formData.append('name', student.name);
        formData.append('course', student.course || 'N/A');
        formData.append('year_level', student.year_level || 1);
        formData.append('section', student.section || 'N/A');
        if (student.email) formData.append('email', student.email);
        if (student.phone_number) formData.append('phone_number', student.phone_number);

        setUploading(true);

        axiosClient.post(`/students/${student.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(({ data }) => {
                setStudent(data); // specific update of student state
                setUploading(false);
                if (onUpdate) {
                    onUpdate(data);
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Photo Updated!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            })
            .catch((err) => {
                console.error(err);
                setUploading(false);
                Swal.fire('Error', 'Failed to upload photo.', 'error');
            });
    };

    // Safe fallback for parsing numbers
    const formatCurrency = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? "0.00" : num.toFixed(2);
    };

    const getProfileImage = () => {
        if (student.profile_picture_url) {
            return `${student.profile_picture_url}?t=${new Date().getTime()}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=200&bold=true`;
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
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-end p-6">
                        {/* Actions */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <LibraryCard
                                student={student} // Pass updated student object with new photo
                                trigger={
                                    <button className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-md" title="Print Library Card">
                                        <Printer size={20} />
                                    </button>
                                }
                            />
                            <button
                                onClick={onClose}
                                className="p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-md"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex items-end gap-4 translate-y-8">
                            <div
                                className="relative group w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 cursor-pointer"
                                onClick={handleAvatarClick}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <img
                                    src={getProfileImage()}
                                    alt={student.name}
                                    className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
                                />
                                {/* Overlay on Hover */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <Camera className="text-white" size={24} />
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <div className="mb-2">
                                <h2 className="text-2xl font-bold text-white shadow-sm">{student.name}</h2>
                                <div className="flex items-center gap-3 text-blue-100 text-sm font-medium">
                                    <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">{student.student_id}</span>
                                    <span>{student.course}</span>
                                    {student.year_level && <span>• Year {student.year_level}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="pt-12 px-6 pb-6 overflow-y-auto custom-scrollbar">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex flex-col items-center justify-center text-center group hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors">
                                <BookOpen className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                                <div className="text-2xl font-bold text-gray-800 dark:text-blue-100">{stats.totalBorrowed}</div>
                                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Borrowed</div>
                            </div>

                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl flex flex-col items-center justify-center text-center group hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors">
                                <CheckCircle className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                                <div className="text-2xl font-bold text-gray-800 dark:text-emerald-100">{stats.currentLoans}</div>
                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Active Loans</div>
                            </div>

                            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-4 rounded-xl flex flex-col items-center justify-center text-center group hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors">
                                <AlertTriangle className={cn("mb-2 group-hover:scale-110 transition-transform", stats.overdueCount > 0 ? "text-rose-500" : "text-gray-400")} size={24} />
                                <div className={cn("text-2xl font-bold", stats.overdueCount > 0 ? "text-rose-600 dark:text-rose-200" : "text-gray-400")}>{stats.overdueCount}</div>
                                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Overdue</div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex flex-col items-center justify-center text-center group hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors relative">
                                <DollarSign className={cn("mb-2 group-hover:scale-110 transition-transform", stats.totalOwed > 0 ? "text-amber-500" : "text-gray-400")} size={24} />
                                <div className={cn("text-2xl font-bold", stats.totalOwed > 0 ? "text-amber-600 dark:text-amber-200" : "text-gray-400")}>₱{formatCurrency(stats.totalOwed)}</div>
                                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Total Owed</div>
                                {(stats.pendingFines > 0 || stats.accruedFines > 0) && (
                                    <div className="mt-2 w-full text-[10px] space-y-0.5">
                                        {stats.pendingFines > 0 && (
                                            <div className="flex justify-between text-amber-700 dark:text-amber-300">
                                                <span>Settled fines</span>
                                                <span className="font-bold">₱{formatCurrency(stats.pendingFines)}</span>
                                            </div>
                                        )}
                                        {stats.accruedFines > 0 && (
                                            <div className="flex justify-between text-rose-600 dark:text-rose-400">
                                                <span>Overdue accruing</span>
                                                <span className="font-bold animate-pulse">₱{formatCurrency(stats.accruedFines)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* History Table */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="text-primary-500" size={20} /> Borrowing History
                            </h3>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
                                {loading ? (
                                    <div className="p-8 text-center text-gray-400">Loading history...</div>
                                ) : transactions.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">No borrowing history found.</div>
                                ) : (
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-slate-700">
                                            <tr>
                                                <th className="p-4 pl-6">Book</th>
                                                <th className="p-4 text-center">Borrowed</th>
                                                <th className="p-4 text-center">Returned</th>
                                                <th className="p-4 text-center">Status</th>
                                                <th className="p-4 pr-6 text-right">Fine</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                            {transactions.map((t) => (
                                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="p-4 pl-6">
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">{t.book_title}</div>
                                                        <div className="text-xs font-mono text-gray-400 flex items-center gap-1">
                                                            <Hash size={10} /> {t.asset_code}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                                                        {new Date(t.borrowed_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                                                        {t.returned_at ? new Date(t.returned_at).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {!t.returned_at ? (
                                                            t.is_overdue ? (
                                                                <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-bold">
                                                                    Overdue{t.days_overdue > 0 ? ` · ${t.days_overdue}d` : ''}
                                                                </span>
                                                            ) : (
                                                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold">Active</span>
                                                            )
                                                        ) : (
                                                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded text-xs font-bold">Returned</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        {/* Show accrued fine for overdue unreturned books, or penalty_amount for returned */}
                                                        {t.is_overdue && !t.returned_at && t.accrued_fine > 0 ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                                                                    ₱{formatCurrency(t.accrued_fine)}
                                                                </span>
                                                                <span className="text-[10px] text-rose-500 uppercase font-bold tracking-wider">Accruing</span>
                                                            </div>
                                                        ) : t.penalty_amount > 0 ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className={cn("font-bold", t.payment_status === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                                                                    ₱{formatCurrency(t.penalty_amount)}
                                                                </span>
                                                                {t.payment_status === 'paid' && <span className="text-[10px] text-green-500 uppercase font-bold tracking-wider">Paid</span>}
                                                                {t.payment_status === 'pending' && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider">Unpaid</span>}
                                                                {t.payment_status === 'waived' && <span className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">Waived</span>}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300 dark:text-gray-600">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Pagination Logic */}
                            {!loading && transactions.length > 0 && (
                                <div className="mt-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
