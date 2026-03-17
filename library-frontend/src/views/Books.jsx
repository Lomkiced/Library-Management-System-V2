import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Filter,
  FolderOpen,
  GraduationCap,
  Info,
  Loader2,
  LibraryBig,
  PlusCircle,
  Printer,
  Search,
  Trash2,
  XCircle
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import axiosClient from "../axios-client";
import { getStorageUrl } from "../lib/utils";
import PrintLabelModal from "../components/PrintLabelModal";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

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
      return { 
        className: "bg-emerald-50/80 text-emerald-700 border-emerald-200 shadow-emerald-500/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", 
        text: `${available} Available`,
        icon: <CheckCircle2 size={14} />
      };
    }
    if (damaged > 0 && borrowed === 0) {
      return { 
        className: "bg-rose-50/80 text-rose-700 border-rose-200 shadow-rose-500/10 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20", 
        text: damaged === total ? "All Damaged" : `${damaged} Damaged`,
        icon: <XCircle size={14} />
      };
    }
    if (lost > 0 && borrowed === 0 && damaged === 0) {
      return { 
        className: "bg-red-50/80 text-red-700 border-red-200 shadow-red-500/10 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20", 
        text: lost === total ? "All Lost" : `${lost} Lost`,
        icon: <AlertTriangle size={14} />
      };
    }
    if (borrowed > 0) {
      let text = `${borrowed} Borrowed`;
      if (damaged > 0) text += `, ${damaged} Damaged`;
      if (lost > 0) text += `, ${lost} Lost`;
      return { 
        className: "bg-amber-50/80 text-amber-700 border-amber-200 shadow-amber-500/10 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", 
        text,
        icon: <Clock size={14} />
      };
    }
    return { 
      className: "bg-slate-50/80 text-slate-600 border-slate-200 shadow-slate-500/10 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20", 
      text: "No Copies",
      icon: <Info size={14} />
    };
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
      <motion.button
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCollegeClick(college)}
        className={`group relative overflow-hidden rounded-[2rem] p-7 text-left shadow-sm hover:shadow-2xl transition-shadow border border-white/40 dark:border-slate-700/50 backdrop-blur-md ${colors.bg} dark:bg-slate-800/80`}
      >
        {/* Background gradient accent */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-20 dark:opacity-30 rounded-full blur-3xl -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-700 ease-out`} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className={`p-3.5 rounded-2xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-md shadow-sm border border-white/50 dark:border-slate-600/50`}>
              <GraduationCap size={26} className={colors.icon} />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
              <ChevronRight size={24} className={colors.icon} />
            </div>
          </div>
          <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-1.5 truncate`} title={college}>{shortName}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 truncate font-medium">{college}</p>
          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{totalBooks}</p>
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">books</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-slate-700/50">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-300">
                <span className={`font-bold ${colors.text}`}>{availableTitles}</span> available
              </p>
              <span className={`text-xs px-2.5 py-1 rounded-full ${colors.badge} font-bold shadow-sm backdrop-blur-sm bg-white/50 dark:bg-slate-800/50`}>
                {categoryCount} {categoryCount === 1 ? "Category" : "Categories"}
              </span>
            </div>
          </div>
        </div>
      </motion.button>
    );
  };

  // Category Card Component (Level 2)
  const CategoryCard = ({ category, totalBooks, availableTitles, totalCopies, availableCopies }) => {
    const colors = getCategoryColors(category);
    return (
      <motion.button
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCategoryClick(category)}
        className={`group relative overflow-hidden rounded-[2rem] p-7 text-left shadow-sm hover:shadow-2xl transition-shadow border border-white/40 dark:border-slate-700/50 backdrop-blur-md ${colors.bg} dark:bg-slate-800/80`}
      >
        {/* Background gradient accent */}
        <div className={`absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-tl ${colors.gradient} opacity-20 dark:opacity-30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 ease-out`} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
             <div className={`p-3.5 rounded-2xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-md shadow-sm border border-white/50 dark:border-slate-600/50`}>
              <FolderOpen size={26} className={colors.icon} />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
              <ChevronRight size={24} className={colors.icon} />
            </div>
          </div>
          <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-6 truncate`}>{category}</h3>
          
          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{totalBooks}</p>
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">books</p>
            </div>
            <div className="pt-4 border-t border-gray-200/50 dark:border-slate-700/50 flex flex-col gap-1">
               <p className="text-sm font-medium text-gray-600 dark:text-slate-300 flex justify-between">
                <span>Unique Titles</span>
                <span className={`font-bold ${colors.text}`}>{availableTitles}</span>
              </p>
               <p className="text-sm font-medium text-gray-600 dark:text-slate-300 flex justify-between">
                <span>Total Copies</span>
                <span className={`font-bold ${colors.text}`}>{totalCopies}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.button>
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
    <div className="space-y-6 bg-slate-50 dark:bg-[#0B1120] p-4 sm:p-8 min-h-screen transition-colors duration-300 selection:bg-primary-500/30">
      
      {/* Decorative Blur Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* HEADER & CONTROLS */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 p-6 rounded-[2rem] shadow-sm"
      >
        <div className="flex items-center gap-5">
          <AnimatePresence mode="popLayout">
            {(currentLevel > 1 || selectedYear) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  if (currentLevel > 1) {
                    handleBack();
                  } else {
                    handleYearChange("");
                  }
                }}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all shadow-sm group"
                title={selectedYear && currentLevel === 1 ? "Clear Year Filter" : "Go Back"}
              >
                <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>
          
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className={`p-2.5 rounded-xl text-white shadow-lg ${currentLevel === 1 ? "bg-gradient-to-br from-primary-500 to-indigo-600" : currentLevel === 2 ? `bg-gradient-to-br ${getCollegeColors(selectedCollege).gradient}` : `bg-gradient-to-br ${getCategoryColors(selectedCategory).gradient}`}`}>
                {currentLevel === 1 ? <LibraryBig size={24} /> : currentLevel === 2 ? <GraduationCap size={24} /> : <FolderOpen size={24} />}
              </span>
              {getHeaderTitle()}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              {getHeaderSubtext()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
          {/* Year Filter Dropdown - Level 1 Only */}
          {currentLevel === 1 && (
            <div className="relative min-w-[160px]">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full pl-11 pr-10 py-3 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-semibold transition-all appearance-none cursor-pointer text-slate-700 dark:text-white shadow-sm hover:border-primary-300"
              >
                <option value="">All Years</option>
                {yearSummaries.map(ys => (
                  <option key={ys.year} value={ys.year}>{ys.year}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronRight size={16} className="text-slate-400 rotate-90" />
              </div>
            </div>
          )}
          <Button
            onClick={() => setShowDamagedBooksModal(true)}
            variant="outline"
            className="flex-1 xl:flex-none border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-900/30 backdrop-blur-md shadow-sm rounded-xl py-3"
          >
            <AlertCircle size={18} className="mr-2" /> Damaged Books
          </Button>
          <Button
            onClick={() => setShowLostBooksModal(true)}
            variant="outline"
            className="flex-1 xl:flex-none border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-900/30 backdrop-blur-md shadow-sm rounded-xl py-3"
          >
            <AlertCircle size={18} className="mr-2" /> Lost Books
          </Button>
          <Button onClick={onAddNew} icon={PlusCircle} className="flex-1 xl:flex-none py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary-600 dark:hover:bg-primary-500 shadow-md">
            Add New Book
          </Button>
        </div>
      </motion.div>

      {/* Breadcrumb */}
      {currentLevel > 1 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 px-6 py-3 rounded-2xl w-max shadow-sm"
        >
          <button onClick={handleBackToColleges} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Book Inventory
          </button>
          <ChevronRight size={14} className="opacity-50" />
          {currentLevel >= 2 && (
            <button
              onClick={currentLevel === 3 ? handleBackToCategories : undefined}
              className={`${currentLevel === 3 ? "hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer" : "text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-lg"}`}
            >
              {getCollegeShortName(selectedCollege)}
            </button>
          )}
          {currentLevel === 3 && (
            <>
              <ChevronRight size={14} className="opacity-50" />
              <span className="text-slate-800 dark:text-slate-200 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400">{selectedCategory}</span>
            </>
          )}
        </motion.div>
      )}

      {/* LEVEL 1: COLLEGE VIEW OR YEAR VIEW */}
      {currentLevel === 1 && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 space-y-6"
        >
          {selectedYear && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden flex items-center gap-6 border border-slate-700">
                {/* Decorative background circle */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-500 opacity-20 blur-3xl rounded-full" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500 opacity-20 blur-3xl rounded-full" />

                <div className="relative z-10 p-5 bg-white/10 rounded-2xl backdrop-blur-md shadow-inner border border-white/10">
                  <LibraryBig size={40} className="text-white drop-shadow-md" />
                </div>
                <div className="relative z-10">
                  <p className="text-slate-300 text-sm font-bold mb-1 uppercase tracking-widest">
                    Total Books ({selectedYear})
                  </p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-6xl font-black drop-shadow-lg tracking-tighter">
                      {yearSummaries.find(ys => String(ys.year) === String(selectedYear))?.total_books || 0}
                    </h2>
                    <span className="text-slate-400 font-medium">titles found</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* COLLEGE CARDS VIEW */}
          {loadingColleges ? (
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-[2rem] shadow-sm p-16 text-center text-slate-400 dark:text-slate-500 border border-white/40 dark:border-slate-700/50">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-6 text-primary-500" />
              <p className="font-medium text-lg text-slate-600 dark:text-slate-400">Loading college departments...</p>
            </div>
          ) : colleges.length === 0 ? (
            <motion.div variants={itemVariants} className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-[2rem] shadow-sm p-20 text-center border border-white/40 dark:border-slate-700/50">
              <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Building2 size={40} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No college departments found</p>
              <p className="text-slate-500 dark:text-slate-400">Add new books with a college assigned using the button above</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
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
        </motion.div>
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
                placeholder="Search by title, author, ISBN..."
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all bg-white/80 dark:bg-slate-800/80 dark:text-white shadow-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Book Table */}
          {loadingBooks ? (
            <div className="p-20 text-center">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-6 text-primary-500" />
              <p className="font-medium text-lg text-slate-600 dark:text-slate-400">Loading catalog...</p>
            </div>
          ) : categoryBooks.length === 0 ? (
            <div className="p-20 text-center text-slate-400 dark:text-slate-500">
               <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                 <Filter size={40} strokeWidth={1.5} />
               </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                {searchTerm ? `No matches found for "${searchTerm}"` : "No books in this category"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-xs font-black tracking-widest border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-5">Title Details</th>
                    <th className="p-5">Author</th>
                    <th className="p-5">Publisher</th>
                    <th className="p-5">College</th>
                    <th className="p-5">Call No.</th>
                    <th className="p-5 text-center">Status</th>
                    <th className="p-5 text-right w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categoryBooks.map((book) => {
                    const badge = getStatusBadge(book);
                    return (
                      <tr key={book.id} className="hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors group">
                        <td className="p-5 min-w-[300px]">
                          <div className="flex items-center gap-4">
                            {book.image_path && !imgErrors[book.id] ? (
                              <img
                                src={getStorageUrl(book.image_path)}
                                alt={book.title}
                                className="w-12 h-16 object-cover rounded-lg shadow-md border border-slate-200 dark:border-slate-700"
                                onError={() => setImgErrors(prev => ({ ...prev, [book.id]: true }))}
                              />
                            ) : (
                              <div className="w-12 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                                <BookOpen size={20} className="text-slate-400 dark:text-slate-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight mb-1">{book.title}</p>
                              {book.subtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-1">{book.subtitle}</p>
                              )}
                              {book.isbn && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono font-medium drop-shadow-sm">{book.isbn}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-slate-700 dark:text-slate-300 font-medium">{book.author}</td>
                        <td className="p-5 text-slate-600 dark:text-slate-400 text-sm">{book.publisher || '-'}</td>
                        <td className="p-5 text-slate-600 dark:text-slate-400 text-sm font-medium">{getCollegeShortName(book.college) || '-'}</td>
                        <td className="p-5 font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{book.call_number || '-'}</td>
                        <td className="p-5 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md shadow-sm text-xs font-bold leading-none ${badge.className}`}>
                            {badge.icon}
                            <span>{badge.text}</span>
                          </div>
                        </td>
                        <td className="p-5 align-middle">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedBookForLabel(book)}
                              className="text-xs bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm hover:shadow-indigo-500/20"
                              title="Print Label"
                            >
                              <Printer size={16} />
                            </button>

                            <button onClick={() => onEdit(book)} className="text-slate-500 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 p-2.5 rounded-xl transition shadow-sm" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => onDelete(book)} className="text-slate-500 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 p-2.5 rounded-xl transition shadow-sm" title="Delete">
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
            <div className="px-8 pb-8">
              <PaginationControls />
            </div>
          )}
        </motion.div>
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
