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
  const CourseCard = ({ course, totalStudents, activeLoans }) => {
    const colors = getCourseColors(course);
    return (
      <button
        onClick={() => handleCourseClick(course)}
        className={`group relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl ${colors.bg} dark:bg-slate-800 border-2 ${colors.border} dark:border-slate-700`}
      >
        {/* Background gradient accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors.gradient} opacity-10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500`} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.gradient} shadow-lg`}>
              <GraduationCap size={24} className="text-white" />
            </div>
          </div>
          <h3 className={`text-lg font-bold ${colors.text} dark:text-white mb-2`}>{course}</h3>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalStudents}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              students • {activeLoans} active loans
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
          {selectedCourse && (
            <button
              onClick={handleBackToCourses}
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <ArrowLeft size={24} className="text-gray-600 dark:text-slate-300" />
            </button>
          )}
          <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
            <Users size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {selectedCourse ? selectedCourse : "Student Directory"}
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              {selectedCourse
                ? `${totalStudents} students in this course`
                : `${courses.length} courses • Click to browse`
              }
            </p>
          </div>
        </div>

        <Button onClick={onAddNew} icon={PlusCircle}>
          Add New Student
        </Button>
      </div>

      {/* COURSE VIEW (when no course selected) */}
      {!selectedCourse && (
        <>
          {loadingCourses ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-primary-600" />
              <p>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700">
              <GraduationCap size={40} strokeWidth={1.5} className="mx-auto mb-4" />
              <p className="text-lg font-medium">No courses found</p>
              <p className="text-sm">Add new students using the button above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {courses.map((c) => (
                <CourseCard
                  key={c.course}
                  course={c.course}
                  totalStudents={c.total_students}
                  activeLoans={c.active_loans}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* STUDENT LIST VIEW (when course selected) */}
      {selectedCourse && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
          {/* Search Bar + Bulk Action */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, ID, email..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-600 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {selectedStudents.length > 0 && (
                <button
                  onClick={onBulkPromote}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm"
                >
                  <TrendingUp size={18} />
                  Bulk Promote ({selectedStudents.length})
                </button>
              )}
            </div>
          </div>

          {/* Student Table */}
          {loadingStudents ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-primary-600" />
              <p className="text-gray-400 dark:text-slate-500">Loading students...</p>
            </div>
          ) : courseStudents.length === 0 ? (
            <div className="p-12 text-center text-gray-400 dark:text-slate-500">
              <Users size={40} strokeWidth={1.5} className="mx-auto mb-4" />
              <p className="text-lg font-medium">
                {searchTerm ? `No students found matching "${searchTerm}"` : "No students in this course"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600 w-10">
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
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Student</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Year & Section</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Contact</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600 text-center">Library Activity</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {courseStudents.map((student) => {
                    const colors = getCourseColors(selectedCourse);
                    return (
                      <tr key={student.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group ${selectedStudents.includes(student.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            checked={selectedStudents.includes(student.id)}
                            disabled={(student.year_level || 0) >= 4}
                            onChange={() => toggleStudentSelection(student.id)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${colors.gradient}`}>
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-white">{student.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{student.student_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          <span className="font-medium">Year {student.year_level || '-'}</span>
                          {student.section && <span className="text-sm text-slate-400 ml-2">• Sec {student.section}</span>}
                        </td>
                        <td className="p-4">
                          <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                            {student.email && (
                              <div className="flex items-center gap-2">
                                <Mail size={12} /> {student.email}
                              </div>
                            )}
                            {student.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone size={12} /> {student.phone_number}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-3">
                            <div className="text-center">
                              <p className="text-lg font-bold text-emerald-600">{student.total_borrowed || 0}</p>
                              <p className="text-xs text-slate-400">Borrowed</p>
                            </div>
                            <div className="text-center">
                              <p className={`text-lg font-bold ${student.active_loans > 0 ? "text-amber-600" : "text-slate-400"}`}>
                                {student.active_loans || 0}
                              </p>
                              <p className="text-xs text-slate-400">Active</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            {(student.year_level || 0) < 4 && (
                              <button
                                onClick={() => onPromote(student)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                                title={`Promote to Year ${(student.year_level || 0) + 1}`}
                              >
                                <TrendingUp size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => setViewingStudent(student)}
                              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                              title="View Profile"
                            >
                              <Award size={18} />
                            </button>
                            <button
                              onClick={() => onEdit(student)}
                              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => onDelete(student)}
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
          {courseStudents.length > 0 && totalPages > 1 && (
            <div className="px-6 pb-6">
              <PaginationControls />
            </div>
          )}
        </div>
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
  );
}
