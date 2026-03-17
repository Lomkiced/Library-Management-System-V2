import { useCallback, useEffect, useState } from "react";
import axiosClient from "../axios-client";
import Swal from "sweetalert2";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    Loader2,
    Mail,
    Phone,
    PlusCircle,
    Search,
    Trash2,
    Users,
    Award,
    Pencil,
    BookOpen,
    Building2
} from "lucide-react";
import { useToast } from "../components/ui/Toast";
import FacultyFormModal from "./FacultyFormModal";
import FacultyProfileModal from "./FacultyProfileModal";
import Button from "../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Department color mapping (matching course colors for consistency)
const DEPARTMENT_COLORS = {
    "BSIT": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", gradient: "from-blue-500 to-cyan-500" },
    "BSED": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", gradient: "from-rose-500 to-pink-500" },
    "BEED": { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", gradient: "from-pink-500 to-purple-500" },
    "Maritime": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", gradient: "from-cyan-500 to-blue-500" },
    "BSHM": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", gradient: "from-amber-500 to-orange-500" },
    "BS Criminology": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", gradient: "from-red-600 to-orange-600" },
    "BSBA": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", gradient: "from-emerald-500 to-teal-500" },
    "BS Tourism": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", gradient: "from-indigo-500 to-violet-500" },
    "default": { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", gradient: "from-slate-500 to-gray-500" }
};

const getDepartmentColors = (department) => DEPARTMENT_COLORS[department] || DEPARTMENT_COLORS.default;

export default function Faculty() {
    const toast = useToast();

    // View Mode States
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [departmentFaculties, setDepartmentFaculties] = useState([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingFaculties, setLoadingFaculties] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalFaculties, setTotalFaculties] = useState(0);
    const [perPage] = useState(20);

    // Search
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Modals
    const [viewingFaculty, setViewingFaculty] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch departments
    const getDepartments = useCallback((silent = false) => {
        if (!silent) setLoadingDepartments(true);
        axiosClient.get("/faculties/departments/summary")
            .then(({ data }) => {
                setDepartments(data);
                setLoadingDepartments(false);
            })
            .catch(() => {
                setLoadingDepartments(false);
            });
    }, []);

    // Fetch faculties by department with pagination
    const getFacultiesByDepartment = useCallback((department, page = 1, search = "") => {
        setLoadingFaculties(true);
        axiosClient.get(`/faculties/by-department/${encodeURIComponent(department)}`, {
            params: { page, per_page: perPage, search }
        })
            .then(({ data }) => {
                setDepartmentFaculties(data.data);
                setCurrentPage(data.current_page);
                setTotalPages(data.last_page);
                setTotalFaculties(data.total);
                setLoadingFaculties(false);
            })
            .catch(() => {
                setLoadingFaculties(false);
            });
    }, [perPage]);

    // Initial load
    useEffect(() => {
        getDepartments();
    }, [getDepartments]);

    // When department is selected
    useEffect(() => {
        if (selectedDepartment) {
            getFacultiesByDepartment(selectedDepartment, currentPage, debouncedSearch);
        }
    }, [selectedDepartment, currentPage, debouncedSearch, getFacultiesByDepartment]);

    // Handle department card click
    const handleDepartmentClick = (department) => {
        setSelectedDepartment(department);
        setSearchTerm("");
        setDebouncedSearch("");
        setCurrentPage(1);
    };

    // Handle back to departments
    const handleBackToDepartments = () => {
        setSelectedDepartment(null);
        setDepartmentFaculties([]);
        setSearchTerm("");
        setDebouncedSearch("");
        setCurrentPage(1);
        getDepartments();
    };

    // CRUD Operations
    const onDelete = (faculty) => {
        Swal.fire({
            title: 'Delete Faculty?',
            text: `Are you sure you want to delete "${faculty.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, delete!',
        }).then((result) => {
            if (result.isConfirmed) {
                axiosClient.delete(`/faculties/${faculty.id}`)
                    .then(() => {
                        toast.success('Faculty removed successfully');
                        if (selectedDepartment) {
                            getFacultiesByDepartment(selectedDepartment, currentPage, debouncedSearch);
                        }
                        getDepartments();
                    })
                    .catch((err) => {
                        toast.error(err.response?.data?.message || 'Failed to delete faculty.');
                    });
            }
        });
    };

    const onEdit = (faculty) => {
        setEditingFaculty(faculty);
        setShowFormModal(true);
    };

    const onAddNew = () => {
        setEditingFaculty(null);
        setShowFormModal(true);
    };

    // Pagination controls
    const PaginationControls = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                    Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalFaculties)} of {totalFaculties} faculty members
                </p>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={18} className="text-gray-600 dark:text-slate-300" />
                    </button>
                    {start > 1 && (
                        <>
                            <button onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300">1</button>
                            {start > 2 && <span className="px-2 text-gray-400">...</span>}
                        </>
                    )}
                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${page === currentPage
                                ? "bg-primary-600 text-white"
                                : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300"
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                    {end < totalPages && (
                        <>
                            {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
                            <button onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300">{totalPages}</button>
                        </>
                    )}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight size={18} className="text-gray-600 dark:text-slate-300" />
                    </button>
                </div>
            </div>
        );
    };

    // Department Card Component
    const DepartmentCard = ({ department, totalFaculty, activeLoans }) => {
        const colors = getDepartmentColors(department);
        return (
            <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDepartmentClick(department)}
                className={`group relative overflow-hidden rounded-[2rem] p-7 text-left shadow-sm hover:shadow-2xl transition-shadow border border-white/40 dark:border-slate-700/50 backdrop-blur-md ${colors.bg} dark:bg-slate-800/80`}
            >
                {/* Background gradient accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-20 dark:opacity-30 rounded-full blur-3xl -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-700 ease-out`} />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                        <div className={`p-3.5 rounded-2xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-md shadow-sm border border-white/50 dark:border-slate-600/50 flex flex-col items-center justify-center gap-1`}>
                            <Briefcase size={26} className={colors.text} />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                            <ChevronRight size={24} className={colors.text} />
                        </div>
                    </div>
                    <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-2 truncate`}>{department}</h3>
                    
                    <div className="space-y-2">
                        <div className="flex items-end gap-2">
                            <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{totalFaculty}</p>
                            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">faculty</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-slate-700/50">
                            <p className="text-sm font-medium text-gray-600 dark:text-slate-300">
                                <span className={`font-bold ${colors.text}`}>{activeLoans}</span> active loans
                            </p>
                        </div>
                    </div>
                </div>
            </motion.button>
        );
    };

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
            {/* Decorative Background Orbs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 dark:bg-purple-900/20 blur-[100px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 dark:bg-indigo-900/20 blur-[100px] pointer-events-none" />

            <div className="relative z-10 p-8 space-y-8 max-w-[1600px] mx-auto">
                {/* HEADER & CONTROLS */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/40 dark:border-slate-700/50 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            {selectedDepartment && (
                                <button
                                    onClick={handleBackToDepartments}
                                    className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all group"
                                >
                                    <ArrowLeft size={22} className="text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
                                </button>
                            )}
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/30">
                                    <Building2 size={28} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {selectedDepartment ? selectedDepartment : "Faculty Directory"}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                                        {selectedDepartment
                                            ? `${totalFaculties} faculty members in this department`
                                            : `${departments.length} departments • Click to browse`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button onClick={onAddNew} icon={PlusCircle} className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex-shrink-0 shadow-lg shadow-purple-500/20 rounded-xl px-6 py-3 font-bold text-[15px]">
                            Add New Faculty
                        </Button>
                    </div>
                </motion.div>

                {/* DEPARTMENT VIEW (when no department selected) */}
                {!selectedDepartment && (
                    <AnimatePresence mode="wait">
                        {loadingDepartments ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-[2rem] shadow-sm p-20 text-center border border-white/40 dark:border-slate-700/50"
                            >
                                <Loader2 className="animate-spin h-10 w-10 mx-auto mb-6 text-purple-600" />
                                <p className="font-medium text-lg text-slate-600 dark:text-slate-400">Loading departments...</p>
                            </motion.div>
                        ) : departments.length === 0 ? (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-[2rem] shadow-sm p-20 text-center border border-white/40 dark:border-slate-700/50"
                            >
                                <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <Building2 size={40} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500" />
                                </div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No faculty members yet</p>
                                <p className="text-slate-500 dark:text-slate-400">Add faculty using the button above</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="grid"
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                            >
                                {departments.map((d) => (
                                    <DepartmentCard
                                        key={d.department}
                                        department={d.department}
                                        totalFaculty={d.total_faculty}
                                        activeLoans={d.active_loans}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                {/* FACULTY LIST VIEW (when department selected) */}
                {selectedDepartment && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
                    >
                        {/* Search Bar */}
                        <div className="p-6 border-b border-white/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40">
                            <div className="relative max-w-lg">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, email..."
                                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all bg-white/80 dark:bg-slate-800/80 dark:text-white shadow-sm font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Faculty Table */}
                        {loadingFaculties ? (
                            <div className="p-20 text-center">
                                <Loader2 className="animate-spin h-10 w-10 mx-auto mb-6 text-purple-600" />
                                <p className="font-medium text-lg text-slate-600 dark:text-slate-400">Loading faculty...</p>
                            </div>
                        ) : departmentFaculties.length === 0 ? (
                            <div className="p-20 text-center text-slate-400 dark:text-slate-500">
                                <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <Users size={40} strokeWidth={1.5} />
                                </div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                    {searchTerm ? `No faculty found matching "${searchTerm}"` : "No faculty in this department"}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-100/50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-xs font-black tracking-widest border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="p-5">Faculty</th>
                                            <th className="p-5">Department</th>
                                            <th className="p-5">Contact</th>
                                            <th className="p-5 text-center">Library Activity</th>
                                            <th className="p-5 text-right w-44">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {departmentFaculties.map((faculty) => {
                                            const colors = getDepartmentColors(selectedDepartment);
                                            return (
                                                <tr key={faculty.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors group">
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold bg-gradient-to-br ${colors.gradient} shadow-md`}>
                                                                {faculty.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight mb-1">{faculty.name}</p>
                                                                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-mono font-medium drop-shadow-sm">{faculty.faculty_id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-slate-700 dark:text-slate-300">
                                                        <span className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-sm backdrop-blur-md bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50 ${colors.text}`}>
                                                            {faculty.department}
                                                        </span>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400 font-medium tracking-tight">
                                                            {faculty.email && (
                                                                <div className="flex items-center gap-2">
                                                                    <Mail size={14} className="text-slate-400" /> {faculty.email}
                                                                </div>
                                                            )}
                                                            {faculty.phone_number && (
                                                                <div className="flex items-center gap-2">
                                                                    <Phone size={14} className="text-slate-400" /> {faculty.phone_number}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <div className="flex justify-center gap-4">
                                                            <div className="text-center bg-purple-50 dark:bg-purple-500/10 rounded-xl py-1.5 px-3 border border-purple-100 dark:border-purple-500/20 shadow-sm">
                                                                <p className="text-[16px] font-black text-purple-600">{faculty.total_borrowed || 0}</p>
                                                                <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-wider">Borrowed</p>
                                                            </div>
                                                            <div className={`text-center rounded-xl py-1.5 px-3 border shadow-sm ${faculty.active_loans > 0 ? "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" : "bg-slate-50 dark:bg-slate-500/10 border-slate-100 dark:border-slate-500/20"}`}>
                                                                <p className={`text-[16px] font-black ${faculty.active_loans > 0 ? "text-amber-600" : "text-slate-400"}`}>
                                                                    {faculty.active_loans || 0}
                                                                </p>
                                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${faculty.active_loans > 0 ? "text-amber-500/70" : "text-slate-400/70"}`}>Active</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 align-middle">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => setViewingFaculty(faculty)}
                                                                className="text-slate-500 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-amber-500 dark:hover:text-amber-400 p-2.5 rounded-xl transition shadow-sm"
                                                                title="View Profile"
                                                            >
                                                                <Award size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => onEdit(faculty)}
                                                                className="text-slate-500 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 p-2.5 rounded-xl transition shadow-sm"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => onDelete(faculty)}
                                                                className="text-slate-500 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 p-2.5 rounded-xl transition shadow-sm"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {departmentFaculties.length > 0 && totalPages > 1 && (
                            <div className="px-8 pb-8">
                                <PaginationControls />
                            </div>
                        )}
                    </motion.div>
                )}

                {/* MODALS */}
                {viewingFaculty && (
                    <FacultyProfileModal
                        faculty={viewingFaculty}
                        onClose={() => setViewingFaculty(null)}
                    />
                )}

                {showFormModal && (
                    <FacultyFormModal
                        facultyToEdit={editingFaculty}
                        onClose={() => {
                            setShowFormModal(false);
                            setEditingFaculty(null);
                        }}
                        onSuccess={() => {
                            if (selectedDepartment) {
                                getFacultiesByDepartment(selectedDepartment, currentPage, debouncedSearch);
                            }
                            getDepartments();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
