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

// Department color mapping (matching course colors for consistency)
const DEPARTMENT_COLORS = {
    "BSIT": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", gradient: "from-blue-500 to-cyan-500", icon: "💻" },
    "BSED": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", gradient: "from-rose-500 to-pink-500", icon: "📚" },
    "BEED": { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", gradient: "from-pink-500 to-purple-500", icon: "🎓" },
    "Maritime": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", gradient: "from-cyan-500 to-blue-500", icon: "⚓" },
    "BSHM": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", gradient: "from-amber-500 to-orange-500", icon: "🏨" },
    "BS Criminology": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", gradient: "from-red-600 to-orange-600", icon: "⚖️" },
    "BSBA": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", gradient: "from-emerald-500 to-teal-500", icon: "📊" },
    "BS Tourism": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", gradient: "from-indigo-500 to-violet-500", icon: "✈️" },
    "default": { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", gradient: "from-slate-500 to-gray-500", icon: "📖" }
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
            <button
                onClick={() => handleDepartmentClick(department)}
                className={`group relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl ${colors.bg} dark:bg-slate-800 border-2 ${colors.border} dark:border-slate-700`}
            >
                {/* Background gradient accent */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors.gradient} opacity-10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500`} />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.gradient} shadow-lg`}>
                            <Briefcase size={24} className="text-white" />
                        </div>
                        <span className="text-2xl">{colors.icon}</span>
                    </div>
                    <h3 className={`text-lg font-bold ${colors.text} dark:text-white mb-2`}>{department}</h3>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalFaculty}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            faculty • {activeLoans} active loans
                        </p>
                    </div>
                </div>

                {/* Arrow indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={24} className={colors.text} />
                </div>
            </button>
        );
    };

    return (
        <div className="space-y-6 bg-gray-50 dark:bg-slate-900 p-8 min-h-screen transition-colors duration-300">
            {/* HEADER & CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    {selectedDepartment && (
                        <button
                            onClick={handleBackToDepartments}
                            className="p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm"
                        >
                            <ArrowLeft size={24} className="text-gray-600 dark:text-slate-300" />
                        </button>
                    )}
                    <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                        <Building2 size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            {selectedDepartment ? selectedDepartment : "Faculty Directory"}
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                            {selectedDepartment
                                ? `${totalFaculties} faculty members in this department`
                                : `${departments.length} departments • Click to browse`
                            }
                        </p>
                    </div>
                </div>

                <Button onClick={onAddNew} icon={PlusCircle} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                    Add New Faculty
                </Button>
            </div>

            {/* DEPARTMENT VIEW (when no department selected) */}
            {!selectedDepartment && (
                <>
                    {loadingDepartments ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700">
                            <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-purple-600" />
                            <p>Loading departments...</p>
                        </div>
                    ) : departments.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700">
                            <Building2 size={40} strokeWidth={1.5} className="mx-auto mb-4" />
                            <p className="text-lg font-medium">No faculty members yet</p>
                            <p className="text-sm">Add faculty using the button above</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {departments.map((d) => (
                                <DepartmentCard
                                    key={d.department}
                                    department={d.department}
                                    totalFaculty={d.total_faculty}
                                    activeLoans={d.active_loans}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* FACULTY LIST VIEW (when department selected) */}
            {selectedDepartment && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, ID, email..."
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-600 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Faculty Table */}
                    {loadingFaculties ? (
                        <div className="p-12 text-center">
                            <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-purple-600" />
                            <p className="text-gray-400 dark:text-slate-500">Loading faculty...</p>
                        </div>
                    ) : departmentFaculties.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 dark:text-slate-500">
                            <Users size={40} strokeWidth={1.5} className="mx-auto mb-4" />
                            <p className="text-lg font-medium">
                                {searchTerm ? `No faculty found matching "${searchTerm}"` : "No faculty in this department"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="p-4 border-b border-slate-100 dark:border-slate-600">Faculty</th>
                                        <th className="p-4 border-b border-slate-100 dark:border-slate-600">Department</th>
                                        <th className="p-4 border-b border-slate-100 dark:border-slate-600">Contact</th>
                                        <th className="p-4 border-b border-slate-100 dark:border-slate-600 text-center">Library Activity</th>
                                        <th className="p-4 border-b border-slate-100 dark:border-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                    {departmentFaculties.map((faculty) => {
                                        const colors = getDepartmentColors(selectedDepartment);
                                        return (
                                            <tr key={faculty.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${colors.gradient}`}>
                                                            {faculty.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 dark:text-white">{faculty.name}</p>
                                                            <p className="text-xs text-slate-400 font-mono">{faculty.faculty_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-600 dark:text-slate-300">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}>
                                                        {faculty.department}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                                                        {faculty.email && (
                                                            <div className="flex items-center gap-2">
                                                                <Mail size={12} /> {faculty.email}
                                                            </div>
                                                        )}
                                                        {faculty.phone_number && (
                                                            <div className="flex items-center gap-2">
                                                                <Phone size={12} /> {faculty.phone_number}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-3">
                                                        <div className="text-center">
                                                            <p className="text-lg font-bold text-emerald-600">{faculty.total_borrowed || 0}</p>
                                                            <p className="text-xs text-slate-400">Borrowed</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className={`text-lg font-bold ${faculty.active_loans > 0 ? "text-amber-600" : "text-slate-400"}`}>
                                                                {faculty.active_loans || 0}
                                                            </p>
                                                            <p className="text-xs text-slate-400">Active</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => setViewingFaculty(faculty)}
                                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                                                            title="View Profile"
                                                        >
                                                            <Award size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => onEdit(faculty)}
                                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => onDelete(faculty)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
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
                        <div className="px-6 pb-6">
                            <PaginationControls />
                        </div>
                    )}
                </div>
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
    );
}
