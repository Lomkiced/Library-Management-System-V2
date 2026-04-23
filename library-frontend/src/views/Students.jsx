import { useCallback, useEffect, useState } from "react";
import axiosClient from "../axios-client";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  PlusCircle,
  Search,
  Trash2,
  TrendingUp,
  Users,
  Award,
  Pencil,
  BookOpen
} from "lucide-react";
import { useToast } from "../components/ui/Toast";
import StudentProfileModal from "./StudentProfileModal";
import StudentFormModal from "./StudentFormModal";
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

// Course color mapping
const COURSE_COLORS = {
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

const getCourseColors = (course) => COURSE_COLORS[course] || COURSE_COLORS.default;

export default function Students() {
  const toast = useToast();

  // View Mode States
  const [selectedCourse, setSelectedCourse] = useState(null); // null = course view, string = student list view
  const [courses, setCourses] = useState([]);
  const [courseStudents, setCourseStudents] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [perPage] = useState(20);

  // Search (within course)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals
  const [viewingStudent, setViewingStudent] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Bulk Selection (Promotion)
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch courses
  const getCourses = useCallback((silent = false) => {
    if (!silent) setLoadingCourses(true);
    axiosClient.get("/students/courses/summary")
      .then(({ data }) => {
        setCourses(data);
        setLoadingCourses(false);
      })
      .catch(() => {
        setLoadingCourses(false);
      });
  }, []);

  // Fetch students by course with pagination
  const getStudentsByCourse = useCallback((course, page = 1, search = "") => {
    setLoadingStudents(true);
    axiosClient.get(`/students/by-course/${encodeURIComponent(course)}`, {
      params: { page, per_page: perPage, search }
    })
      .then(({ data }) => {
        setCourseStudents(data.data);
        setCurrentPage(data.current_page);
        setTotalPages(data.last_page);
        setTotalStudents(data.total);
        setLoadingStudents(false);
      })
      .catch(() => {
        setLoadingStudents(false);
      });
  }, [perPage]);

  // Initial load - fetch courses
  useEffect(() => {
    getCourses();
  }, [getCourses]);

  // When course is selected, load its students
  useEffect(() => {
    if (selectedCourse) {
      getStudentsByCourse(selectedCourse, currentPage, debouncedSearch);
    }
  }, [selectedCourse, currentPage, debouncedSearch, getStudentsByCourse]);

  // Handle course card click
  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
    setSelectedStudents([]);
  };

  // Handle back to courses
  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setCourseStudents([]);
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
    setSelectedStudents([]);
    getCourses(); // Refresh courses when going back
  };

  // CRUD Operations
  const onDelete = (student) => {
    Swal.fire({
      title: 'Delete Student?',
      text: `Are you sure you want to delete "${student.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete!',
    }).then((result) => {
      if (result.isConfirmed) {
        axiosClient.delete(`/students/${student.id}`)
          .then(() => {
            toast.success('Student removed successfully');
            if (selectedCourse) {
              getStudentsByCourse(selectedCourse, currentPage, debouncedSearch);
            }
            getCourses(); // Refresh course counts
          })
          .catch((err) => {
            toast.error(err.response?.data?.message || 'Failed to delete student.');
          });
      }
    });
  };

  const onEdit = (student) => {
    setEditingStudent(student);
    setShowFormModal(true);
  };

  const onAddNew = () => {
    setEditingStudent(null);
    setShowFormModal(true);
  };

  // Update student in list (e.g. after photo upload)
  const handleStudentUpdate = (updatedStudent) => {
    setCourseStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    setViewingStudent(updatedStudent);
  };

  // ========================================
  // PROMOTION LOGIC
  // ========================================

  // Single student promotion
  const onPromote = (student) => {
    const nextLevel = (student.year_level || 0) + 1;
    Swal.fire({
      title: 'Promote Student?',
      text: `Promote "${student.name}" to Year ${nextLevel}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'Yes, promote!',
    }).then((result) => {
      if (result.isConfirmed) {
        axiosClient.post(`/students/${student.id}/promote`)
          .then(({ data }) => {
            toast.success(data.message);
            if (selectedCourse) {
              getStudentsByCourse(selectedCourse, currentPage, debouncedSearch);
            }
          })
          .catch((err) => {
            toast.error(err.response?.data?.message || 'Failed to promote student.');
          });
      }
    });
  };

  // Bulk student promotion
  const onBulkPromote = () => {
    Swal.fire({
      title: 'Bulk Promote Students?',
      text: `Promote ${selectedStudents.length} selected student(s) to the next year level?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'Yes, promote all!',
    }).then((result) => {
      if (result.isConfirmed) {
        axiosClient.post('/students/bulk-promote', { student_ids: selectedStudents })
          .then(({ data }) => {
            toast.success(data.message);
            if (data.skipped?.length > 0) {
              toast.info(`Skipped (already Year 4): ${data.skipped.join(', ')}`);
            }
            setSelectedStudents([]);
            if (selectedCourse) {
              getStudentsByCourse(selectedCourse, currentPage, debouncedSearch);
            }
          })
          .catch((err) => {
            toast.error(err.response?.data?.message || 'Bulk promotion failed.');
          });
      }
    });
  };

  // Select / deselect a single student
  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Master checkbox: select all eligible (year_level < 4) visible students
  const toggleSelectAll = () => {
    const eligible = courseStudents.filter(s => (s.year_level || 0) < 4).map(s => s.id);
    const allSelected = eligible.length > 0 && eligible.every(id => selectedStudents.includes(id));
    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !eligible.includes(id)));
    } else {
      setSelectedStudents(prev => [...new Set([...prev, ...eligible])]);
    }
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
          Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalStudents)} of {totalStudents} students
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

  // Course Card Component
  const CourseCard = ({ course, totalStudents, activeLoans, index = 0 }) => {
    const colors = getCourseColors(course);
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.05 }}
        onClick={() => handleCourseClick(course)}
        className={`group relative overflow-hidden rounded-[2rem] p-7 text-left shadow-sm hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-white/40 dark:border-slate-700/50 backdrop-blur-md ${colors.bg} dark:bg-slate-800/80`}
      >
        {/* Background gradient accent */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-20 dark:opacity-30 rounded-full blur-3xl -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-700 ease-out`} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className={`p-3.5 rounded-2xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-md shadow-sm border border-white/50 dark:border-slate-600/50 flex items-center gap-3`}>
              <GraduationCap size={26} className={colors.text} />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
              <ChevronRight size={24} className={colors.text} />
            </div>
          </div>
          <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-2 truncate`}>{course}</h3>
          
          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{totalStudents}</p>
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">students</p>
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
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 dark:bg-primary-900/20 blur-[100px] pointer-events-none" />
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
              {selectedCourse && (
                <button
                  onClick={handleBackToCourses}
                  className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all group"
                >
                  <ArrowLeft size={22} className="text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
                </button>
              )}
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/30">
                  <Users size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {selectedCourse ? selectedCourse : "Student Directory"}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {selectedCourse
                      ? `${totalStudents} students in this course`
                      : `${courses.length} courses • Click to browse`
                    }
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={onAddNew} icon={PlusCircle} className="w-full md:w-auto shadow-lg shadow-primary-500/20 rounded-xl px-6 py-3 font-bold text-[15px]">
              Add New Student
            </Button>
          </div>
        </motion.div>

        {/* COURSE VIEW (when no course selected) */}
        {!selectedCourse && (
          <AnimatePresence mode="wait">
            {loadingCourses ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-[2rem] shadow-sm p-20 text-center border border-white/40 dark:border-slate-700/50">
                <Loader2 className="animate-spin h-10 w-10 mx-auto mb-6 text-primary-500" />
                <p className="font-medium text-lg text-slate-600 dark:text-slate-400">Loading courses...</p>
              </motion.div>
            ) : courses.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-[2rem] shadow-sm p-20 text-center border border-white/40 dark:border-slate-700/50">
                <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <GraduationCap size={40} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No courses found</p>
                <p className="text-slate-500 dark:text-slate-400">Add new students using the button above</p>
              </motion.div>
            ) : (
              <motion.div key="grid" variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {courses.map((c, index) => (
                  <CourseCard
                    key={c.course}
                    course={c.course}
                    totalStudents={c.total_students}
                    activeLoans={c.active_loans}
                    index={index}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

      {/* STUDENT LIST VIEW (when course selected) */}
      {selectedCourse && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
        >
          {/* Search Bar + Bulk Action */}
          <div className="p-6 border-b border-white/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative max-w-lg flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, ID, email..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all bg-white/80 dark:bg-slate-800/80 dark:text-white shadow-sm font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {selectedStudents.length > 0 && (
                <button
                  onClick={onBulkPromote}
                  className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all"
                >
                  <TrendingUp size={20} />
                  Bulk Promote ({selectedStudents.length})
                </button>
              )}
            </div>
          </div>

          {/* Student Table */}
          {loadingStudents ? (
            <div className="p-20 text-center">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-6 text-primary-500" />
              <p className="font-medium text-lg text-slate-600 dark:text-slate-400">Loading students...</p>
            </div>
          ) : courseStudents.length === 0 ? (
            <div className="p-20 text-center text-slate-400 dark:text-slate-500">
              <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Users size={40} strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                {searchTerm ? `No matches found for "${searchTerm}"` : "No students in this course"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-xs font-black tracking-widest border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-5 w-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        checked={
                          courseStudents.filter(s => (s.year_level || 0) < 4).length > 0 &&
                          courseStudents.filter(s => (s.year_level || 0) < 4).every(s => selectedStudents.includes(s.id))
                        }
                        onChange={toggleSelectAll}
                        title="Select all eligible students"
                      />
                    </th>
                    <th className="p-5">Student</th>
                    <th className="p-5 text-center">Year & Sec</th>
                    <th className="p-5">Contact</th>
                    <th className="p-5 text-center">Library Activity</th>
                    <th className="p-5 text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {courseStudents.map((student) => {
                    const colors = getCourseColors(selectedCourse);
                    return (
                      <tr key={student.id} className={`hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors group ${selectedStudents.includes(student.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                        <td className="p-5">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            checked={selectedStudents.includes(student.id)}
                            disabled={(student.year_level || 0) >= 4}
                            onChange={() => toggleStudentSelection(student.id)}
                          />
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white text-lg font-bold bg-gradient-to-br ${colors.gradient} shadow-md`}>
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight mb-1">{student.name}</p>
                              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-mono font-medium drop-shadow-sm">{student.student_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-center text-slate-700 dark:text-slate-300">
                          <span className="font-bold text-[15px]">Year {student.year_level || '-'}</span>
                          {student.section && <span className="block text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Sec {student.section}</span>}
                        </td>
                        <td className="p-5">
                          <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400 font-medium tracking-tight">
                            {student.email && (
                              <div className="flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" /> {student.email}
                              </div>
                            )}
                            {student.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-slate-400" /> {student.phone_number}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex justify-center gap-4">
                            <div className="text-center bg-emerald-50 dark:bg-emerald-500/10 rounded-xl py-1.5 px-3 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                              <p className="text-[16px] font-black text-emerald-600">{student.total_borrowed || 0}</p>
                              <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider">Borrowed</p>
                            </div>
                            <div className={`text-center rounded-xl py-1.5 px-3 border shadow-sm ${student.active_loans > 0 ? "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" : "bg-slate-50 dark:bg-slate-500/10 border-slate-100 dark:border-slate-500/20"}`}>
                              <p className={`text-[16px] font-black ${student.active_loans > 0 ? "text-amber-600" : "text-slate-400"}`}>
                                {student.active_loans || 0}
                              </p>
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${student.active_loans > 0 ? "text-amber-500/70" : "text-slate-400/70"}`}>Active</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 align-middle">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(student.year_level || 0) < 4 && (
                              <button
                                onClick={() => onPromote(student)}
                                className="text-xs bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 transition shadow-sm hover:shadow-emerald-500/20"
                                title={`Promote to Year ${(student.year_level || 0) + 1}`}
                              >
                                <TrendingUp size={16} />
                              </button>
                            )}
                            <button onClick={() => setViewingStudent(student)} className="text-slate-500 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-amber-500 dark:hover:text-amber-400 p-2.5 rounded-xl transition shadow-sm" title="View Profile">
                              <Award size={16} />
                            </button>
                            <button onClick={() => onEdit(student)} className="text-slate-500 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 p-2.5 rounded-xl transition shadow-sm" title="Edit">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => onDelete(student)} className="text-slate-500 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 p-2.5 rounded-xl transition shadow-sm" title="Delete">
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
          {courseStudents.length > 0 && totalPages > 1 && (
            <div className="px-8 pb-8">
              <PaginationControls />
            </div>
          )}
        </motion.div>
      )}

      {/* MODALS */}
      {viewingStudent && (
        <StudentProfileModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onUpdate={handleStudentUpdate}
        />
      )}

      {showFormModal && (
        <StudentFormModal
          studentToEdit={editingStudent}
          onClose={() => {
            setShowFormModal(false);
            setEditingStudent(null);
          }}
          onSuccess={() => {
            if (selectedCourse) {
              getStudentsByCourse(selectedCourse, currentPage, debouncedSearch);
            }
            getCourses();
          }}
        />
      )}
      </div>
    </div>
  );
}
