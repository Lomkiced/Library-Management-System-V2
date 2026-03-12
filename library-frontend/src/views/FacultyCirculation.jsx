import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../components/ui/Toast";
import axiosClient from "../axios-client";
import BookSelectorModal from "../components/BookSelectorModal";
import {
    Search,
    User,
    Book,
    BookOpen,
    RotateCcw,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Building2,
    Calendar,
    Clock,
    Scan,
    X,
    Library,
} from "lucide-react";
import Swal from "sweetalert2";
import Button from "../components/ui/Button";

export default function FacultyCirculation() {
    const toast = useToast();

    // Tab state
    const [activeTab, setActiveTab] = useState("borrow"); // 'borrow' or 'return'

    // Borrow Tab States
    const [facultySearch, setFacultySearch] = useState("");
    const [facultyResults, setFacultyResults] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [assetCode, setAssetCode] = useState("");
    const [selectedBook, setSelectedBook] = useState(null);
    const [borrowLoading, setBorrowLoading] = useState(false);

    // Return Tab States
    const [returnAssetCode, setReturnAssetCode] = useState("");
    const [returnSelectedBook, setReturnSelectedBook] = useState(null);
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [returnLoading, setReturnLoading] = useState(false);
    const [loadingBorrowed, setLoadingBorrowed] = useState(false);

    // Available Books for borrowing (shared with student circulation)
    const [availableBooks, setAvailableBooks] = useState([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);

    // Book Selector Modal States
    const [showBorrowBookModal, setShowBorrowBookModal] = useState(false);
    const [showReturnBookModal, setShowReturnBookModal] = useState(false);

    // =========================================
    // HARDWARE USB SCANNER — Global Keydown Listener (Tab-Aware)
    // =========================================
    const scanBufferRef = useRef("");
    const lastKeystrokeRef = useRef(0);
    const scanProcessingRef = useRef(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            // IGNORE if user is actively typing in an input, textarea, or select
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            // IGNORE if a Swal modal is currently open
            if (document.querySelector('.swal2-container')) return;

            // IGNORE if already processing a scan
            if (scanProcessingRef.current) return;

            const now = Date.now();
            const timeSinceLastKey = now - lastKeystrokeRef.current;

            if (event.key === 'Enter') {
                // Only process if we have buffered characters from rapid typing
                if (scanBufferRef.current.length > 0) {
                    event.preventDefault();
                    const scannedCode = scanBufferRef.current.trim();
                    scanBufferRef.current = "";
                    lastKeystrokeRef.current = 0;

                    if (scannedCode) {
                        processHardwareScan(scannedCode);
                    }
                }
                return;
            }

            // Only accept printable single characters
            if (event.key.length !== 1) return;

            // If time since last keystroke is > 80ms, this is likely human typing — reset buffer
            if (timeSinceLastKey > 80) {
                scanBufferRef.current = "";
            }

            scanBufferRef.current += event.key;
            lastKeystrokeRef.current = now;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Process barcode from hardware scanner
    const processHardwareScan = async (scannedCode) => {
        scanProcessingRef.current = true;

        try {
            const { data: result } = await axiosClient.get(`/books/lookup/${encodeURIComponent(scannedCode)}`);
            handleScanResult(result);
        } catch (err) {
            console.error("Hardware scan lookup failed:", err);
            if (err.response?.status === 404) {
                toast.error(`Book with barcode "${scannedCode}" not found in library.`);
            } else {
                toast.error(`Scanner error: Could not look up code "${scannedCode}".`);
            }
        } finally {
            scanProcessingRef.current = false;
        }
    };

    // Faculty Search
    useEffect(() => {
        if (facultySearch.length >= 2) {
            const timer = setTimeout(() => {
                axiosClient.get(`/faculties/search?q=${encodeURIComponent(facultySearch)}`)
                    .then(({ data }) => setFacultyResults(data))
                    .catch(() => setFacultyResults([]));
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setFacultyResults([]);
        }
    }, [facultySearch]);

    // Fetch available books (same endpoint as student circulation)
    const fetchAvailableBooks = useCallback(() => {
        setLoadingAvailable(true);
        axiosClient.get("/books/available")
            .then(({ data }) => {
                // Endpoint is now paginated — extract the items array from data.data
                setAvailableBooks(data.data ?? data);
                setLoadingAvailable(false);
            })
            .catch(() => {
                setLoadingAvailable(false);
            });
    }, []);

    // Fetch borrowed books for return tab
    const fetchBorrowedBooks = useCallback(() => {
        setLoadingBorrowed(true);
        axiosClient.get("/faculty/borrowed")
            .then(({ data }) => {
                // Endpoint is now paginated — extract the items array from data.data
                setBorrowedBooks(data.data ?? data);
                setLoadingBorrowed(false);
            })
            .catch(() => {
                setLoadingBorrowed(false);
            });
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchAvailableBooks();
        fetchBorrowedBooks();
    }, [fetchAvailableBooks, fetchBorrowedBooks]);

    // Refresh when tab changes
    useEffect(() => {
        if (activeTab === "return") {
            fetchBorrowedBooks();
        } else {
            fetchAvailableBooks();
        }
    }, [activeTab, fetchBorrowedBooks, fetchAvailableBooks]);

    // Select Faculty
    const handleSelectFaculty = (faculty) => {
        setSelectedFaculty(faculty);
        setFacultySearch("");
        setFacultyResults([]);
    };

    // Handle Book Selection from Modal (Borrow)
    const handleSelectBorrowBook = (book) => {
        setAssetCode(book.asset_code);
        setSelectedBook(book);
        setShowBorrowBookModal(false);
        toast.info(`Selected: "${book.title}"`);
    };

    // Handle Book Selection from Modal (Return)
    const handleSelectReturnBook = (book) => {
        setReturnAssetCode(book.asset_code);
        setReturnSelectedBook({
            asset_code: book.asset_code,
            title: book.title || book.book_title,
            borrower: book.borrower || book.faculty_name
        });
        setShowReturnBookModal(false);
        toast.info(`Selected: "${book.title || book.book_title}"`);
    };

    // =========================================
    // SCAN RESULT HANDLER (Tab-Aware, Status-Based)
    // =========================================

    // Handle Auto Return from Scanner
    const handleScanReturnSubmit = (code) => {
        setReturnLoading(true);

        axiosClient.post("/faculty/return", {
            asset_code: code.trim()
        })
            .then(({ data }) => {
                let message = `
          <div class="text-left">
            <p><strong>Faculty:</strong> ${data.faculty_name}</p>
            <p><strong>Book:</strong> ${data.book_title}</p>
            <p><strong>Returned:</strong> ${new Date(data.returned_at).toLocaleDateString()}</p>
          </div>
        `;

                Swal.fire({
                    icon: "success",
                    title: "Book Returned!",
                    html: message,
                    confirmButtonColor: "#7c3aed"
                });

                setReturnAssetCode("");
                setReturnSelectedBook(null);
                fetchAvailableBooks();
                fetchBorrowedBooks();
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Failed to return book.");
            })
            .finally(() => setReturnLoading(false));
    };

    // Handle scan result — uses activeTab to determine action
    const handleScanResult = (result) => {
        const scannedBarcode = result.asset_code || result.scanned_code || "";

        if (!result.found) {
            toast.error(`Book with barcode "${scannedBarcode}" not found in library.`);
            return;
        }

        if (activeTab === 'borrow') {
            // BORROW TAB: Book must be 'available'
            if (result.status === 'available') {
                // ✅ Book is available — select it for borrowing
                setAssetCode(result.asset_code);
                setSelectedBook({
                    asset_code: result.asset_code,
                    title: result.title,
                    author: result.author,
                    category: result.category
                });
                toast.success(`Book "${result.title}" selected for borrowing.`);
            } else if (result.status === 'borrowed') {
                toast.error(`"${result.title}" is currently borrowed and not available.`);
            } else {
                toast.error(`Cannot borrow. Book status: ${result.status || 'unknown'}`);
            }
        } else if (activeTab === 'return') {
            // RETURN TAB: Book must be 'borrowed'
            if (result.status === 'borrowed') {
                // Check if borrowed by Student — REJECT if so
                const borrowerType = result.borrower?.type;

                if (borrowerType === 'Student') {
                    toast.error(`This book is borrowed by a Student. Please use Student Circulation.`);
                    return;
                }

                // ✅ Confirm before processing (Faculty)
                const borrower = result.borrower || {};
                const borrowerName = borrower.name || 'Unknown Faculty';
                const borrowerId = borrower.student_id || '';
                const typeLabel = borrower.type || 'Faculty';

                Swal.fire({
                    title: 'Return Book?',
                    html: `
              <div style="text-align: left; font-size: 0.95rem;">
                <p style="color: #64748b; margin-bottom: 0.5rem;">Are you sure you want to return:</p>
                <div style="background: #f1f5f9; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                  <p style="font-weight: 700; color: #1e293b; margin-bottom: 0.25rem;">${result.title}</p>
                  <p style="font-family: monospace; color: #64748b; font-size: 0.8em;">${result.asset_code}</p>
                </div>
                
                <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                   <p style="text-transform: uppercase; font-size: 0.7rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.25rem;">Borrowed By</p>
                   <p style="font-weight: 700; color: #0f172a; font-size: 1.1rem; margin-bottom: 0.25rem;">${borrowerName}</p>
                   <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="background: #e0f2fe; color: #0369a1; padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">${typeLabel}</span>
                      <span style="color: #64748b; font-size: 0.9rem;">${borrowerId}</span>
                   </div>
                </div>
              </div>
            `,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#7c3aed',
                    cancelButtonColor: '#ef4444',
                    confirmButtonText: 'Yes, Return it!',
                    focusCancel: true
                }).then((swalResult) => {
                    if (swalResult.isConfirmed) {
                        handleScanReturnSubmit(result.asset_code);
                    }
                });
            } else if (result.status === 'available') {
                toast.error(`"${result.title}" is not currently borrowed.`);
            } else {
                toast.error(`Cannot return. Book status: ${result.status || 'unknown'}`);
            }
        }
    };

    // Handle Borrow
    const handleBorrow = (e) => {
        e.preventDefault();

        if (!selectedFaculty) {
            toast.error("Please select a faculty member first.");
            return;
        }
        if (!assetCode.trim()) {
            toast.error("Please select or enter a book barcode.");
            return;
        }

        setBorrowLoading(true);

        axiosClient.post("/faculty/borrow", {
            faculty_id: selectedFaculty.id,
            asset_code: assetCode.trim()
        })
            .then(({ data }) => {
                Swal.fire({
                    icon: "success",
                    title: "Book Issued!",
                    html: `
            <div class="text-left">
              <p><strong>Faculty:</strong> ${data.faculty_name}</p>
              <p><strong>Book:</strong> ${data.book_title}</p>
              <p><strong>Due Date:</strong> ${data.due_date}</p>
            </div>
          `,
                    confirmButtonColor: "#7c3aed"
                });
                setAssetCode("");
                setSelectedBook(null);
                setSelectedFaculty(null);
                fetchAvailableBooks();
                fetchBorrowedBooks();
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Failed to issue book.");
            })
            .finally(() => setBorrowLoading(false));
    };

    // Handle Return
    const handleReturn = (e) => {
        e.preventDefault();

        if (!returnAssetCode.trim()) {
            toast.error("Please select or enter a book barcode.");
            return;
        }

        setReturnLoading(true);

        axiosClient.post("/faculty/return", {
            asset_code: returnAssetCode.trim()
        })
            .then(({ data }) => {
                let message = `
          <div class="text-left">
            <p><strong>Faculty:</strong> ${data.faculty_name}</p>
            <p><strong>Book:</strong> ${data.book_title}</p>
            <p><strong>Returned:</strong> ${new Date(data.returned_at).toLocaleDateString()}</p>
          </div>
        `;

                Swal.fire({
                    icon: "success",
                    title: "Book Returned!",
                    html: message,
                    confirmButtonColor: "#7c3aed"
                });

                setReturnAssetCode("");
                setReturnSelectedBook(null);
                fetchAvailableBooks();
                fetchBorrowedBooks();
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Failed to return book.");
            })
            .finally(() => setReturnLoading(false));
    };

    // Quick return from list
    const handleQuickReturn = (book) => {
        setReturnAssetCode(book.asset_code);
        setReturnSelectedBook({
            asset_code: book.asset_code,
            title: book.book_title,
            borrower: book.faculty_name
        });
    };

    // Transform borrowed books for BookSelectorModal format
    const borrowedBooksForModal = borrowedBooks.map(book => ({
        ...book,
        title: book.book_title,
        author: book.department || "Faculty",
        category: book.department,
        borrower: book.faculty_name,
        image_path: null
    }));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300">
            {/* Book Selector Modals */}
            <BookSelectorModal
                isOpen={showBorrowBookModal}
                onClose={() => setShowBorrowBookModal(false)}
                onSelect={handleSelectBorrowBook}
                title="Browse Library Catalog"
                mode="borrow"
                apiEndpoint="/books/available/catalog"
            />

            <BookSelectorModal
                isOpen={showReturnBookModal}
                onClose={() => setShowReturnBookModal(false)}
                onSelect={handleSelectReturnBook}
                title="Select Book to Return"
                mode="return"
                apiEndpoint="/books/borrowed/catalog"
                apiParams={{ type: "faculty" }}
            />

            {/* Header with Hardware Scanner Status */}
            <div className="mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                            <Building2 size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Faculty Circulation</h1>
                            <p className="text-gray-500 dark:text-slate-400">Borrow and return books for faculty members</p>
                        </div>
                    </div>

                    {/* Hardware Scanner Status Indicator */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Scan size={20} />
                            <span className="font-medium">Quick Scan:</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/15 rounded-lg">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-sm font-medium text-emerald-100">Hardware Scanner Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab("borrow")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "borrow"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                        : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
                        }`}
                >
                    <BookOpen size={20} />
                    Borrow Book
                </button>
                <button
                    onClick={() => setActiveTab("return")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "return"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                        : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
                        }`}
                >
                    <RotateCcw size={20} />
                    Return Book
                </button>
            </div>

            {/* BORROW TAB */}
            {activeTab === "borrow" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Faculty Selection */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <User size={20} className="text-purple-600" />
                            Select Faculty
                        </h2>

                        {selectedFaculty ? (
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                            {selectedFaculty.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{selectedFaculty.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">{selectedFaculty.faculty_id}</p>
                                            <p className="text-xs text-purple-600">{selectedFaculty.department}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFaculty(null)}
                                        className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition"
                                    >
                                        <X size={18} className="text-gray-400" />
                                    </button>
                                </div>
                                {selectedFaculty.active_loans > 0 && (
                                    <p className="mt-3 text-sm text-amber-600 flex items-center gap-1">
                                        <AlertTriangle size={14} /> Has {selectedFaculty.active_loans} active loan(s)
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or faculty ID..."
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-600 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                                    value={facultySearch}
                                    onChange={(e) => setFacultySearch(e.target.value)}
                                />

                                {/* Search Results */}
                                {facultyResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 max-h-60 overflow-y-auto">
                                        {facultyResults.map((f) => (
                                            <button
                                                key={f.id}
                                                onClick={() => handleSelectFaculty(f)}
                                                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center gap-3"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                    {f.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-white">{f.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">{f.faculty_id} • {f.department}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Book Selection */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Book size={20} className="text-purple-600" />
                            Select Book
                        </h2>

                        <form onSubmit={handleBorrow} className="space-y-4">
                            {/* Selected Book Display */}
                            {selectedBook ? (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{selectedBook.title}</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">{selectedBook.author}</p>
                                            <p className="text-xs font-mono text-emerald-600 mt-1">{selectedBook.asset_code}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedBook(null);
                                                setAssetCode("");
                                            }}
                                            className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition"
                                        >
                                            <X size={18} className="text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Manual Barcode Input */}
                                    <div className="relative">
                                        <Scan className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Scan or enter book barcode..."
                                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-600 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                                            value={assetCode}
                                            onChange={(e) => setAssetCode(e.target.value)}
                                        />
                                    </div>

                                    {/* Browse Catalog Button */}
                                    <button
                                        type="button"
                                        onClick={() => setShowBorrowBookModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition font-medium"
                                    >
                                        <Library size={18} />
                                        Browse Catalog
                                    </button>
                                </>
                            )}

                            <Button
                                type="submit"
                                disabled={borrowLoading || !selectedFaculty || !assetCode}
                                loading={borrowLoading}
                                icon={BookOpen}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            >
                                Issue Book to Faculty
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* RETURN TAB */}
            {activeTab === "return" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Return Input */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <RotateCcw size={20} className="text-purple-600" />
                            Return Book
                        </h2>

                        <form onSubmit={handleReturn} className="space-y-4">
                            {/* Selected Return Book Display */}
                            {returnSelectedBook ? (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{returnSelectedBook.title}</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">Borrowed by: {returnSelectedBook.borrower}</p>
                                            <p className="text-xs font-mono text-amber-600 mt-1">{returnSelectedBook.asset_code}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReturnSelectedBook(null);
                                                setReturnAssetCode("");
                                            }}
                                            className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition"
                                        >
                                            <X size={18} className="text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Scan className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Scan or enter book barcode..."
                                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-600 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                                            value={returnAssetCode}
                                            onChange={(e) => setReturnAssetCode(e.target.value)}
                                        />
                                    </div>

                                    {/* Browse Borrowed Button */}
                                    <button
                                        type="button"
                                        onClick={() => setShowReturnBookModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition font-medium"
                                    >
                                        <BookOpen size={18} />
                                        Browse Borrowed
                                    </button>
                                </>
                            )}

                            <Button
                                type="submit"
                                disabled={returnLoading || !returnAssetCode}
                                loading={returnLoading}
                                icon={CheckCircle}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                            >
                                Return Book
                            </Button>
                        </form>
                    </div>

                    {/* Currently Borrowed */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-amber-500" />
                            Currently Borrowed by Faculty ({borrowedBooks.length})
                        </h2>

                        {loadingBorrowed ? (
                            <div className="text-center py-8">
                                <Loader2 className="animate-spin h-8 w-8 mx-auto text-purple-600" />
                                <p className="text-gray-400 mt-2">Loading...</p>
                            </div>
                        ) : borrowedBooks.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-slate-500">
                                <CheckCircle size={40} strokeWidth={1.5} className="mx-auto mb-2" />
                                <p>No books currently borrowed by faculty</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {borrowedBooks.map((book) => (
                                    <div
                                        key={book.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border ${book.is_overdue
                                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                            : "bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-600"
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 dark:text-white">{book.book_title}</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                                {book.faculty_name} • {book.department}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs">
                                                <span className="text-gray-500 dark:text-slate-400">
                                                    Code: {book.asset_code}
                                                </span>
                                                <span className={book.is_overdue ? "text-red-600 font-medium" : "text-gray-500 dark:text-slate-400"}>
                                                    <Calendar size={12} className="inline mr-1" />
                                                    Due: {new Date(book.due_date).toLocaleDateString()}
                                                </span>
                                                {book.is_overdue && (
                                                    <span className="text-red-600 font-bold flex items-center gap-1">
                                                        <AlertTriangle size={12} />
                                                        {book.days_overdue} days overdue
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleQuickReturn(book)}
                                            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                                        >
                                            Return
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
