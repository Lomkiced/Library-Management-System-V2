import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  FolderOpen,
  GraduationCap,
  Loader2,
  LibraryBig,
  PlusCircle,
  Printer,
  Search,
  Trash2
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import axiosClient from "../axios-client";
import { getStorageUrl } from "../lib/utils";
import PrintLabelModal from "../components/PrintLabelModal";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";

import BookForm from "./BookForm";
import DamagedBooksModal from "./DamagedBooksModal";
import LostBooksModal from "./LostBooksModal";

// College color mapping for visual distinction
const COLLEGE_COLORS = {
  "COLLEGE OF CRIMINOLOGY": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700 border-red-200", icon: "text-red-500", gradient: "from-red-500 to-red-600" },
  "COLLEGE OF MARITIME": { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", badge: "bg-sky-100 text-sky-700 border-sky-200", icon: "text-sky-500", gradient: "from-sky-500 to-sky-600" },
  "COLLEGE OF INFORMATION TECHNOLOGY": { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700 border-violet-200", icon: "text-violet-500", gradient: "from-violet-500 to-violet-600" },
  "COLLEGE OF HOSPITALITY & TOURISM MANAGEMENT": { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700 border-orange-200", icon: "text-orange-500", gradient: "from-orange-500 to-orange-600" },
  "COLLEGE OF BUSINESS ADMINISTRATION": { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", badge: "bg-teal-100 text-teal-700 border-teal-200", icon: "text-teal-500", gradient: "from-teal-500 to-teal-600" },
  "COLLEGE OF EDUCATION": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "text-amber-500", gradient: "from-amber-500 to-amber-600" },
  "GENERAL": { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100 text-slate-700 border-slate-200", icon: "text-slate-500", gradient: "from-slate-500 to-slate-600" },
  "default": { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", badge: "bg-gray-100 text-gray-700 border-gray-200", icon: "text-gray-500", gradient: "from-gray-500 to-gray-600" }
};

// Category color mapping for visual distinction
const CATEGORY_COLORS = {
  "Book": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-700 border-purple-200", icon: "text-purple-500", gradient: "from-purple-500 to-purple-600" },
  "Article": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700 border-blue-200", icon: "text-blue-500", gradient: "from-blue-500 to-blue-600" },
  "Thesis": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "text-emerald-500", gradient: "from-emerald-500 to-emerald-600" },
  "Map": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "text-amber-500", gradient: "from-amber-500 to-amber-600" },
  "Visual Materials": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700 border-rose-200", icon: "text-rose-500", gradient: "from-rose-500 to-rose-600" },
  "Computer File/Electronic Resources": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "text-indigo-500", gradient: "from-indigo-500 to-indigo-600" },
  "default": { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100 text-slate-700 border-slate-200", icon: "text-slate-500", gradient: "from-slate-500 to-slate-600" }
};

const getCollegeColors = (college) => COLLEGE_COLORS[college] || COLLEGE_COLORS.default;
const getCategoryColors = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

// Short display name for college cards
const getCollegeShortName = (college) => {
  const map = {
    "COLLEGE OF CRIMINOLOGY": "CRIMINOLOGY",
    "COLLEGE OF MARITIME": "MARITIME",
    "COLLEGE OF INFORMATION TECHNOLOGY": "INFORMATION TECHNOLOGY",
    "COLLEGE OF HOSPITALITY & TOURISM MANAGEMENT": "HOSPITALITY & TOURISM",
    "COLLEGE OF BUSINESS ADMINISTRATION": "BUSINESS ADMINISTRATION",
    "COLLEGE OF EDUCATION": "EDUCATION",
    "GENERAL": "GENERAL"
  };
  return map[college] || college;
};

export default function Books({ pendingBarcode = "", onClearPendingBarcode }) {
  const toast = useToast();

  // 3-Level Navigation States
  // Level 1: selectedCollege=null, selectedCategory=null  → College list
  // Level 2: selectedCollege="X", selectedCategory=null   → Categories within college X
  // Level 3: selectedCollege="X", selectedCategory="Y"    → Book list
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Data states
  const [colleges, setColleges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryBooks, setCategoryBooks] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [perPage] = useState(20);

  // Search (within category)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Year Classification filter (Level 1 global filter)
  const [selectedYear, setSelectedYear] = useState("");

  // Fetch year summaries (total books per year)
  const [yearSummaries, setYearSummaries] = useState([]);

  useEffect(() => {
    axiosClient.get('/books/years/summary')
      .then(({ data }) => setYearSummaries(data))
      .catch(console.error);
  }, []);

  // Modal states
  const [showTitleForm, setShowTitleForm] = useState(false);
  const [showLostBooksModal, setShowLostBooksModal] = useState(false);
  const [showDamagedBooksModal, setShowDamagedBooksModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [prefillBarcode, setPrefillBarcode] = useState("");

  const [selectedBookForLabel, setSelectedBookForLabel] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch colleges (Level 1)
  const getColleges = useCallback((silent = false, year = "") => {
    if (!silent) setLoadingColleges(true);
    axiosClient.get("/books/colleges/summary", { params: { year } })
      .then(({ data }) => {
        setColleges(data);
        setLoadingColleges(false);
      })
      .catch(() => {
        setLoadingColleges(false);
      });
  }, []);

  // Fetch categories by college (Level 2)
  const getCategoriesByCollege = useCallback((college, silent = false, year = "") => {
    if (!silent) setLoadingCategories(true);
    axiosClient.get(`/books/colleges/${encodeURIComponent(college)}/categories`, { params: { year } })
      .then(({ data }) => {
        setCategories(data);
        setLoadingCategories(false);
      })
      .catch(() => {
        setLoadingCategories(false);
      });
  }, []);

  // Fetch books by category + college (Level 3)
  const getBooksByCategory = useCallback((category, college, page = 1, search = "", year = "") => {
    setLoadingBooks(true);
    axiosClient.get(`/books/by-category/${encodeURIComponent(category)}`, {
      params: { page, per_page: perPage, search, college, year }
    })
      .then(({ data }) => {
        setCategoryBooks(data.data);
        setCurrentPage(data.current_page);
        setTotalPages(data.last_page);
        setTotalBooks(data.total);
        setLoadingBooks(false);
      })
      .catch(() => {
        setLoadingBooks(false);
      });
  }, [perPage]);

  // Fetch colleges when selected year changes or initially
  useEffect(() => {
    getColleges(false, selectedYear);
  }, [selectedYear, getColleges]);

  // When a college is selected or year changes (Level 2), load its categories
  useEffect(() => {
    if (selectedCollege) {
      getCategoriesByCollege(selectedCollege, false, selectedYear);
    }
  }, [selectedCollege, selectedYear, getCategoriesByCollege]);

  // When category is selected or search/page/year changes (Level 3), load its books
  useEffect(() => {
    if (selectedCategory && selectedCollege) {
      getBooksByCategory(selectedCategory, selectedCollege, currentPage, debouncedSearch, selectedYear);
    }
  }, [selectedCategory, selectedCollege, currentPage, debouncedSearch, selectedYear, getBooksByCategory]);

  // Handle college card click (Level 1 → Level 2)
  const handleCollegeClick = (college) => {
    setSelectedCollege(college);
    setSelectedCategory(null);
  };

  // Handle category card click (Level 2 → Level 3)
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Handle back to categories (Level 3 → Level 2)
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCategoryBooks([]);
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Handle back to colleges (Level 2 → Level 1)
  const handleBackToColleges = () => {
    setSelectedCollege(null);
    setSelectedCategory(null);
    setCategories([]);
    setCategoryBooks([]);
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Handle year change (Level 1)
  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Handle back button click — context-aware
  const handleBack = () => {
    if (selectedCategory) {
      handleBackToCategories();
    } else if (selectedCollege) {
      handleBackToColleges();
    }
  };

  // CRUD Operations
  const onDelete = (book) => {
    Swal.fire({
      title: 'Delete Book?',
      text: `Are you sure you want to delete "${book.title}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#020463',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        axiosClient.delete(`/books/${book.id}`)
          .then(() => {
            toast.success('The book has been removed.');
            if (selectedCategory && selectedCollege) {
              getBooksByCategory(selectedCategory, selectedCollege, currentPage, debouncedSearch);
            }
            if (selectedCollege) getCategoriesByCollege(selectedCollege, true);
            getColleges(true);
          })
          .catch((err) => {
            toast.error(err.response?.data?.message || 'Failed to delete book.');
          });
      }
    });
  };

  const onEdit = (book) => {
    setEditingBook(book);
    setShowTitleForm(true);
  };

  const onAddNew = () => {
    setEditingBook(null);
    setShowTitleForm(true);
  };

  // Get status badge
  const getStatusBadge = (book) => {
    const available = book.available_copies || 0;
    const damaged = book.damaged_copies || 0;
    const lost = book.lost_copies || 0;
    const borrowed = book.borrowed_copies || 0;
    const total = book.total_copies || (available + damaged + lost + borrowed);

    if (available > 0) {
      return { className: "bg-green-100 text-green-700 border border-green-200", text: `${available} Available` };
    }
    if (damaged > 0 && borrowed === 0) {
      return { className: "bg-rose-100 text-rose-700 border border-rose-200", text: damaged === total ? "All Damaged" : `${damaged} Damaged` };
    }
    if (lost > 0 && borrowed === 0 && damaged === 0) {
      return { className: "bg-red-100 text-red-700 border border-red-200", text: lost === total ? "All Lost" : `${lost} Lost` };
    }
    if (borrowed > 0) {
      let text = `${borrowed} Borrowed`;
      if (damaged > 0) text += `, ${damaged} Damaged`;
      if (lost > 0) text += `, ${lost} Lost`;
      return { className: "bg-amber-100 text-amber-700 border border-amber-200", text };
    }
    return { className: "bg-gray-100 text-gray-600 border border-gray-200", text: "No Copies" };
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
          Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalBooks)} of {totalBooks} books
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

  // College Card Component (Level 1)
  const CollegeCard = ({ college, totalBooks, availableTitles, categoryCount }) => {
    const colors = getCollegeColors(college);
    const shortName = getCollegeShortName(college);
    return (
      <button
        onClick={() => handleCollegeClick(college)}
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
          <h3 className={`text-lg font-bold ${colors.text} dark:text-white mb-1 truncate`} title={college}>{shortName}</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 truncate">{college}</p>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalBooks}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {availableTitles} available
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge} border font-medium`}>
                {categoryCount} {categoryCount === 1 ? "category" : "categories"}
              </span>
            </div>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={24} className={colors.icon} />
        </div>
      </button>
    );
  };

  // Category Card Component (Level 2)
  const CategoryCard = ({ category, totalBooks, availableTitles, totalCopies, availableCopies }) => {
    const colors = getCategoryColors(category);
    return (
      <button
        onClick={() => handleCategoryClick(category)}
        className={`group relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl ${colors.bg} dark:bg-slate-800 border-2 ${colors.border} dark:border-slate-700`}
      >
        {/* Background gradient accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors.gradient} opacity-10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500`} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.gradient} shadow-lg`}>
              <FolderOpen size={24} className="text-white" />
            </div>
          </div>
          <h3 className={`text-lg font-bold ${colors.text} dark:text-white mb-2 truncate`}>{category}</h3>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalBooks}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {availableTitles} available
            </p>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={24} className={colors.icon} />
        </div>
      </button>
    );
  };

  // Determine current level
  const currentLevel = selectedCategory ? 3 : selectedCollege ? 2 : 1;

  // Build header text
  const getHeaderTitle = () => {
    if (currentLevel === 3) return selectedCategory;
    if (currentLevel === 2) return getCollegeShortName(selectedCollege);
    return "Book Inventory";
  };

  const getHeaderSubtext = () => {
    if (currentLevel === 3) return `${totalBooks} titles in ${getCollegeShortName(selectedCollege)} • ${selectedCategory}`;
    if (currentLevel === 2) return `${categories.length} categories in ${getCollegeShortName(selectedCollege)}`;
    return `${colleges.length} college departments • Click to browse`;
  };

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-slate-900 p-8 min-h-screen transition-colors duration-300">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          {(currentLevel > 1 || selectedYear) && (
            <button
              onClick={() => {
                if (currentLevel > 1) {
                  handleBack();
                } else {
                  handleYearChange("");
                }
              }}
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm"
              title={selectedYear && currentLevel === 1 ? "Clear Year Filter" : "Go Back"}
            >
              <ArrowLeft size={24} className="text-gray-600 dark:text-slate-300" />
            </button>
          )}
          <div className={`p-3 rounded-xl shadow-lg ${currentLevel === 1 ? "bg-primary-600" : currentLevel === 2 ? `bg-gradient-to-br ${getCollegeColors(selectedCollege).gradient}` : `bg-gradient-to-br ${getCategoryColors(selectedCategory).gradient}`}`}>
            {currentLevel === 1 ? (
              <BookOpen size={28} className="text-white" />
            ) : currentLevel === 2 ? (
              <GraduationCap size={28} className="text-white" />
            ) : (
              <FolderOpen size={28} className="text-white" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {getHeaderTitle()}
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              {getHeaderSubtext()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* Year Filter Dropdown - Level 1 Only */}
          {currentLevel === 1 && (
            <div className="relative w-[140px]">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all appearance-none cursor-pointer dark:text-white"
              >
                <option value="">All Years</option>
                {yearSummaries.map(ys => (
                  <option key={ys.year} value={ys.year}>{ys.year}</option>
                ))}
              </select>
            </div>
          )}
          <Button
            onClick={() => setShowDamagedBooksModal(true)}
            variant="outline"
            className="border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800"
          >
            <AlertCircle size={18} className="mr-2" /> Damaged Books
          </Button>
          <Button
            onClick={() => setShowLostBooksModal(true)}
            variant="outline"
            className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
          >
            <AlertCircle size={18} className="mr-2" /> Lost Books
          </Button>
          <Button onClick={onAddNew} icon={PlusCircle}>
            Add New Book
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      {currentLevel > 1 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <button onClick={handleBackToColleges} className="hover:text-primary-600 dark:hover:text-primary-400 transition font-medium">
            Book Inventory
          </button>
          <ChevronRight size={14} />
          {currentLevel >= 2 && (
            <>
              <button
                onClick={currentLevel === 3 ? handleBackToCategories : undefined}
                className={`font-medium ${currentLevel === 3 ? "hover:text-primary-600 dark:hover:text-primary-400 transition cursor-pointer" : "text-gray-700 dark:text-slate-200"}`}
              >
                {getCollegeShortName(selectedCollege)}
              </button>
            </>
          )}
          {currentLevel === 3 && (
            <>
              <ChevronRight size={14} />
              <span className="text-gray-700 dark:text-slate-200 font-medium">{selectedCategory}</span>
            </>
          )}
        </div>
      )}

      {/* LEVEL 1: COLLEGE VIEW OR YEAR VIEW */}
      {currentLevel === 1 && (
        <div className="space-y-6">
          {selectedYear && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-primary-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex items-center gap-6">
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-400 opacity-20 rounded-full translate-y-8 -translate-x-8" />

                <div className="relative z-10 p-4 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                  <LibraryBig size={36} className="text-white" />
                </div>
                <div className="relative z-10">
                  <p className="text-primary-100 text-sm font-semibold mb-1 uppercase tracking-wider">
                    Total Books ({selectedYear})
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-5xl font-extrabold drop-shadow-md">
                      {yearSummaries.find(ys => String(ys.year) === String(selectedYear))?.total_books || 0}
                    </h2>
                    <span className="text-primary-200 text-sm font-medium">titles found</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COLLEGE CARDS VIEW */}
          {loadingColleges ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-primary-600" />
              <p>Loading college departments...</p>
            </div>
          ) : colleges.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700">
              <Building2 size={40} strokeWidth={1.5} className="mx-auto mb-4" />
              <p className="text-lg font-medium">No college departments found</p>
              <p className="text-sm">Add new books with a college assigned using the button above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {colleges.map((col) => (
                <CollegeCard
                  key={col.college}
                  college={col.college}
                  totalBooks={col.total_books}
                  availableTitles={col.available_titles}
                  categoryCount={col.category_count}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEVEL 2: CATEGORY VIEW (within selected college) */}
      {currentLevel === 2 && (
        <>
          {loadingCategories ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-primary-600" />
              <p>Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700">
              <Filter size={40} strokeWidth={1.5} className="mx-auto mb-4" />
              <p className="text-lg font-medium">No categories found in {getCollegeShortName(selectedCollege)}</p>
              <p className="text-sm">Add new books to this college using the button above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.category}
                  category={cat.category}
                  totalBooks={cat.total_books}
                  availableTitles={cat.available_titles}
                  totalCopies={cat.total_copies}
                  availableCopies={cat.available_copies}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* LEVEL 3: BOOK LIST VIEW */}
      {currentLevel === 3 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
          {/* Search Bar */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by title, author, ISBN..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-600 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Book Table */}
          {loadingBooks ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-primary-600" />
              <p className="text-gray-400 dark:text-slate-500">Loading books...</p>
            </div>
          ) : categoryBooks.length === 0 ? (
            <div className="p-12 text-center text-gray-400 dark:text-slate-500">
              <Filter size={40} strokeWidth={1.5} className="mx-auto mb-4" />
              <p className="text-lg font-medium">
                {searchTerm ? `No books found matching "${searchTerm}"` : "No books in this category"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Title</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Author</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Publisher</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">College</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Call No.</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600 text-center">Status</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {categoryBooks.map((book) => {
                    const badge = getStatusBadge(book);
                    return (
                      <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {book.image_path && !imgErrors[book.id] ? (
                              <img
                                src={getStorageUrl(book.image_path)}
                                alt={book.title}
                                className="w-10 h-14 object-cover rounded shadow-sm"
                                onError={() => setImgErrors(prev => ({ ...prev, [book.id]: true }))}
                              />
                            ) : (
                              <div className="w-10 h-14 bg-gray-100 dark:bg-slate-700 rounded flex items-center justify-center">
                                <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-white">{book.title}</p>
                              {book.subtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">{book.subtitle}</p>
                              )}
                              {book.isbn && (
                                <p className="text-xs text-slate-400 font-mono">{book.isbn}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{book.author}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{book.publisher || '-'}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{book.college || '-'}</td>
                        <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">{book.call_number || '-'}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setSelectedBookForLabel(book)}
                              className="text-xs bg-[#020463] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a1c7a] transition mr-1 font-medium flex items-center gap-1"
                              title="Print Label"
                            >
                              <Printer size={12} /> Label
                            </button>

                            <button onClick={() => onEdit(book)} className="text-slate-400 hover:text-[#020463] dark:hover:text-blue-400 p-2 rounded hover:bg-blue-50 dark:hover:bg-slate-700 transition" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => onDelete(book)} className="text-slate-400 hover:text-[#020463] dark:hover:text-red-400 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Delete">
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
          {categoryBooks.length > 0 && totalPages > 1 && (
            <div className="px-6 pb-6">
              <PaginationControls />
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {showTitleForm && (
        <BookForm
          bookToEdit={editingBook}
          prefillBarcode={prefillBarcode}
          onClose={() => {
            setShowTitleForm(false);
            setPrefillBarcode("");
          }}
          onSuccess={(newBook) => {
            if (selectedCategory && selectedCollege) {
              getBooksByCategory(selectedCategory, selectedCollege, currentPage, debouncedSearch);
            }
            if (selectedCollege) getCategoriesByCollege(selectedCollege, true);
            getColleges(true);
            if (newBook && newBook.id) {
              setSelectedBookForLabel(newBook);
            }
          }}
        />
      )}



      {selectedBookForLabel && (
        <PrintLabelModal book={selectedBookForLabel} onClose={() => setSelectedBookForLabel(null)} />
      )}

      {showLostBooksModal && (
        <LostBooksModal
          onClose={() => setShowLostBooksModal(false)}
          onSuccess={() => {
            if (selectedCategory && selectedCollege) {
              getBooksByCategory(selectedCategory, selectedCollege, currentPage, debouncedSearch);
            }
            if (selectedCollege) getCategoriesByCollege(selectedCollege, true);
            getColleges(true);
          }}
        />
      )}

      {showDamagedBooksModal && (
        <DamagedBooksModal
          onClose={() => setShowDamagedBooksModal(false)}
          onSuccess={() => {
            if (selectedCategory && selectedCollege) {
              getBooksByCategory(selectedCategory, selectedCollege, currentPage, debouncedSearch);
            }
            if (selectedCollege) getCategoriesByCollege(selectedCollege, true);
            getColleges(true);
          }}
        />
      )}
    </div>
  );
}
