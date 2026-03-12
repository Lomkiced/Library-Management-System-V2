import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../components/ui/Toast";
import axiosClient from "../axios-client";
import PaymentModal from "./PaymentModal";
import BookScanModal from "../components/BookScanModal";
import BookNotFoundModal from "../components/BookNotFoundModal";
import FineSettlementModal from "./FineSettlementModal";
import StudentSearchModal from "../components/StudentSearchModal";
import BookSelectorModal from "../components/BookSelectorModal";
import { Search, ChevronDown, User, Book, Scan, Users, Library, AlertTriangle, Settings, Clock, DollarSign, PlusCircle } from "lucide-react";
import Swal from 'sweetalert2';
import BookForm from "./BookForm";

export default function Circulation({ onNavigateToBooks }) {
  // STATE FOR BORROWING
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentCourse, setStudentCourse] = useState("BSIT");
  const [studentYear, setStudentYear] = useState("1");
  const [studentSection, setStudentSection] = useState("");
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [borrowBookCode, setBorrowBookCode] = useState("");

  // Available books dropdown
  const [availableBooks, setAvailableBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState("");

  // Students
  const [showStudentSearchModal, setShowStudentSearchModal] = useState(false);

  // STATE FOR RETURNING
  const [returnBookCode, setReturnBookCode] = useState("");
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [filteredBorrowedBooks, setFilteredBorrowedBooks] = useState([]);
  const [showReturnDropdown, setShowReturnDropdown] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");

  // Toast hook
  const toast = useToast();

  // PAYMENT MODAL STATE
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [isLostBookPayment, setIsLostBookPayment] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);

  // CLEARANCE STATE
  const [clearance, setClearance] = useState(null);
  const [selectedStudentCourse, setSelectedStudentCourse] = useState("");

  // LIBRARY SETTINGS STATE (from backend)
  const [librarySettings, setLibrarySettings] = useState({
    default_loan_days: 7,
    max_loans_per_student: 3,
    fine_per_day: 5,
    library_name: "Library"
  });

  // SCANNER MODE STATE
  const [scannedBook, setScannedBook] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);

  // Register Book State
  const [showBookForm, setShowBookForm] = useState(false);
  const [prefillBarcode, setPrefillBarcode] = useState("");

  // BOOK NOT FOUND MODAL STATE
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState("");

  // SMART BOOK SELECTOR MODAL STATE
  const [showBorrowBookModal, setShowBorrowBookModal] = useState(false);
  const [showReturnBookModal, setShowReturnBookModal] = useState(false);

  // =========================================
  // HARDWARE USB SCANNER — Global Keydown Listener
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
        setNotFoundBarcode(scannedCode);
        setShowNotFoundModal(true);
      } else {
        toast.error(`Scanner error: Could not look up code "${scannedCode}".`);
      }
    } finally {
      scanProcessingRef.current = false;
    }
  };

  // Fetch library settings on mount
  const fetchLibrarySettings = async () => {
    try {
      const res = await axiosClient.get('/settings/circulation');
      if (res.data) {
        setLibrarySettings({
          default_loan_days: res.data.default_loan_days || 7,
          max_loans_per_student: res.data.max_loans_per_student || 3,
          fine_per_day: res.data.fine_per_day || 5,
          library_name: res.data.library_name || "Library"
        });
      }
    } catch (error) {
      console.error('Failed to fetch library settings:', error);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchLibrarySettings();
    fetchAvailableBooks();
    fetchBorrowedBooks();
  }, []);

  // Filter available books
  useEffect(() => {
    if (bookSearchQuery) {
      const query = bookSearchQuery.toLowerCase();
      const filtered = availableBooks.filter(book =>
        book.asset_code.toLowerCase().includes(query) ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(availableBooks);
    }
  }, [bookSearchQuery, availableBooks]);



  // Filter borrowed books
  useEffect(() => {
    if (returnSearchQuery) {
      const query = returnSearchQuery.toLowerCase();
      const filtered = borrowedBooks.filter(book =>
        book.asset_code.toLowerCase().includes(query) ||
        book.title.toLowerCase().includes(query) ||
        book.borrower.toLowerCase().includes(query) ||
        book.student_id.toLowerCase().includes(query)
      );
      setFilteredBorrowedBooks(filtered);
    } else {
      setFilteredBorrowedBooks(borrowedBooks);
    }
  }, [returnSearchQuery, borrowedBooks]);

  const fetchAvailableBooks = (course = "") => {
    axiosClient.get("/books/available", { params: { course } })
      .then(({ data }) => {
        // Endpoint is now paginated — extract the items array from data.data
        const books = data.data ?? data;
        setAvailableBooks(books);
        setFilteredBooks(books);
      })
      .catch(err => {
        console.error("Failed to fetch available books:", err);
      });

  };

  // Fetch borrowed books (Student Only)
  const fetchBorrowedBooks = () => {
    axiosClient.get("/books/borrowed?type=student")
      .then(({ data }) => {
        // Endpoint is now paginated — extract the items array from data.data
        const books = data.data ?? data;
        setBorrowedBooks(books);
        setFilteredBorrowedBooks(books);
      })
      .catch((err) => { console.warn('Failed to fetch borrowed books:', err); });
  };


  const handleSelectBook = (assetCode) => {
    setBorrowBookCode(assetCode);
    setBookSearchQuery("");
    setShowBookDropdown(false);
  };

  const handleSelectStudent = (studentIdValue, course = "") => {
    // setStudentId(studentIdValue); // Controlled by input
    setSelectedStudentCourse(course);
    setClearance(null);

    // Fetch clearance status
    axiosClient.get(`/students/${studentIdValue}/clearance`)
      .then(({ data }) => {
        setClearance(data);
        // Refresh books with student's course for prioritization
        fetchAvailableBooks(data.course);
      })
      .catch(() => setClearance(null));
  };

  const handleSelectStudentFromModal = (student) => {
    setStudentId(student.student_id);
    setStudentName(student.name);
    setIsNewStudent(false);
    handleSelectStudent(student.student_id, student.course);
  };

  const handleSelectReturnBook = (assetCode) => {
    setReturnBookCode(assetCode);
    setReturnSearchQuery("");
    setShowReturnDropdown(false);
  };

  // --- HANDLE BORROW ---
  const handleBorrow = async (ev) => {
    ev.preventDefault();

    if (!studentId || !borrowBookCode) {
      toast.error("Please provide Student ID and Book Code.");
      return;
    }

    // A. If New Student, Register First
    if (isNewStudent) {
      if (!studentName) {
        toast.error("Please enter the new student's name.");
        return;
      }
      if (!studentCourse || !studentYear) {
        toast.error("Please select Course and Year Level for new student.");
        return;
      }
      if (!studentSection) {
        toast.error("Please enter the Section.");
        return;
      }

      try {
        await axiosClient.post("/students", {
          student_id: studentId,
          name: studentName,
          // Defaults for quick registration
          course: studentCourse,
          year_level: parseInt(studentYear),
          section: studentSection
        });
        toast.success("New student registered successfully!");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to register new student.");
        return; // Stop if registration fails
      }
    }

    // B. Proceed to Borrow
    axiosClient.post("/borrow", {
      student_id: studentId,
      asset_code: borrowBookCode
    })
      .then(({ data }) => {
        toast.success(`Success! Book borrowed until ${new Date(data.data.due_date).toLocaleDateString()}`);
        setStudentId("");
        setStudentName("");
        setIsNewStudent(false);
        setStudentSection("");
        setBorrowBookCode("");
        setBookSearchQuery("");
        setClearance(null);
        fetchAvailableBooks();
        fetchBorrowedBooks();
      })
      .catch(err => {
        const response = err.response;
        if (response && response.status === 422) {
          toast.error(response.data.message);
        } else {
          toast.error("Error processing loan. Check Student ID.");
        }
      });
  };

  // --- HANDLE RETURN ---
  const handleReturn = (ev) => {
    ev.preventDefault();

    // Get book info for success message
    const bookInfo = borrowedBooks.find(b => b.asset_code === returnBookCode);
    const bookTitle = bookInfo?.title || 'Unknown';
    const assetCode = returnBookCode;

    axiosClient.post("/return", {
      asset_code: returnBookCode
    })
      .then(({ data }) => {
        setReturnBookCode("");
        setReturnSearchQuery("");

        if (data.penalty > 0) {
          setPendingTransaction({ ...data.transaction, fine_per_day: data.fine_per_day });
          setIsLostBookPayment(false);
          setShowPaymentModal(true);
          toast.warning(`Book "${bookTitle}" (${assetCode}) returned with Late Fee: ₱${data.penalty}.00 (${data.days_late} days late)`);
        } else {
          toast.success(`Success! Book "${bookTitle}" (${assetCode}) has been returned and is now available.`);
        }
        fetchAvailableBooks();
        fetchBorrowedBooks();
        if (studentId) refreshClearance();

        // Auto-select student on return to show clearance/fines
        if (data.transaction && data.transaction.user) {
          const sId = data.transaction.user.student_id;
          const sCourse = data.transaction.user.course;
          setStudentId(sId);
          setStudentName(data.transaction.user.name);
          setIsNewStudent(false);
          handleSelectStudent(sId, sCourse);

          if (data.penalty > 0) {
            setShowFineModal(true);
          }
        }
      })
      .catch(err => {
        const response = err.response;
        if (response && response.status === 422) {
          toast.error(response.data.message);
        } else {
          toast.error(`Error returning book ${assetCode}. Check the barcode.`);
        }
      });
  };

  const refreshClearance = (id = studentId) => {
    if (!id) return;

    axiosClient.get(`/students/${id}/clearance`)
      .then(({ data }) => {
        setClearance(data);
      })
      .catch((err) => { console.warn('Failed to refresh clearance:', err); });
  };

  // --- HANDLE MARK AS LOST ---
  const handleMarkAsLost = async () => {
    if (!returnBookCode) {
      toast.error("Please select a book to mark as lost.");
      return;
    }

    const bookInfo = borrowedBooks.find(b => b.asset_code === returnBookCode);
    const bookTitle = bookInfo?.title || 'Unknown';

    // Confirm with User
    const result = await Swal.fire({
      title: 'Mark as Lost?',
      text: `Are you sure you want to mark "${bookTitle}" as lost? The student will be charged for the book price.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Mark Lost'
    });

    if (!result.isConfirmed) return;

    axiosClient.post("/transactions/lost", {
      asset_code: returnBookCode
    })
      .then(({ data }) => {
        setReturnBookCode("");
        setReturnSearchQuery("");

        if (data.penalty > 0) {
          axiosClient.get("/transactions")
            .then(({ data: transactions }) => {
              // Fix: Handle paginated response structure
              const transactionList = transactions.data || transactions;
              const transaction = transactionList.find(t =>
                t.penalty_amount == data.penalty &&
                t.payment_status === 'pending'
              );
              if (transaction) {
                setPendingTransaction(transaction);
                setIsLostBookPayment(true);
                setShowPaymentModal(true);
              }
            });
          toast.error(`Book marked as lost. Fine Applied: ₱${data.penalty}.00`);
        } else {
          toast.success(data.message);
        }

        fetchAvailableBooks();
        fetchBorrowedBooks();

        // Auto-select student to show clearance/fines
        if (data.transaction && data.transaction.user) {
          const sId = data.transaction.user.student_id;
          const sCourse = data.transaction.user.course;
          setStudentId(sId);
          setStudentName(data.transaction.user.name);
          setIsNewStudent(false);
          handleSelectStudent(sId, sCourse);
          // Note: PaymentModal already shown above if there's a penalty
        } else if (studentId) {
          refreshClearance();
        }

      })
      .catch(err => {
        toast.error(err.response?.data?.message || "Failed to mark as lost.");
      });
  };

  const handlePaymentSuccess = (successMessage) => {
    toast.success(successMessage);
    setShowPaymentModal(false);
    setPendingTransaction(null);
    if (studentId) refreshClearance();
  };

  // =========================================
  // SMART SCAN RESULT HANDLER (Status-based, no scanMode)
  // =========================================
  const handleScanResult = (result) => {
    const scannedBarcode = result.asset_code || result.scanned_code || "";

    if (!result.found) {
      // Book not in database
      setNotFoundBarcode(scannedBarcode);
      setShowNotFoundModal(true);
      return;
    }

    if (result.status === 'available') {
      // ✅ Book is available → route to BORROW flow
      setBorrowBookCode(result.asset_code);
      setScannedBook(result);
      toast.info(`Book "${result.title}" selected. Select a student to complete loan.`);
    } else if (result.status === 'borrowed') {
      // Book is borrowed → route to RETURN flow
      const borrowerType = result.borrower?.type;

      if (borrowerType === 'Faculty') {
        toast.error(`This book is borrowed by a Faculty member. Please use Faculty Circulation.`);
        return;
      }

      // ✅ Confirm before processing return
      const borrower = result.borrower || {};
      const borrowerName = borrower.name || 'Unknown Borrower';
      const borrowerId = borrower.student_id || '';
      const typeLabel = borrower.type || 'Borrower';

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
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Yes, Return it!',
        focusCancel: true
      }).then((swalResult) => {
        if (swalResult.isConfirmed) {
          handleScanReturn(result.asset_code, result.title);
        }
      });
    } else {
      toast.error(`Unknown book status: ${result.status || 'unknown'}`);
    }
  };

  // Handle registering a new book from the Not Found modal
  const handleRegisterBook = (barcode) => {
    setShowNotFoundModal(false);
    setNotFoundBarcode("");
    // Navigate to Books page with the barcode to pre-fill
    setPrefillBarcode(barcode);
    setShowBookForm(true);
  };

  const handleScanBorrow = (assetCode) => {
    setShowScanModal(false);
    setBorrowBookCode(assetCode);
    toast.info(`Book selected: ${scannedBook.title}. Select a student.`);
  };

  const handleScanReturn = (assetCode, bookTitle = null) => {
    setShowScanModal(false);
    // Directly process return - immediate database update
    axiosClient.post("/return", { asset_code: assetCode })
      .then(({ data }) => {
        const displayTitle = bookTitle || data.title || assetCode;

        if (data.penalty > 0) {
          setPendingTransaction({ ...data.transaction, fine_per_day: data.fine_per_day });
          setShowPaymentModal(true);
          toast.warning(`Book "${displayTitle}" returned with Late Fee: ₱${data.penalty}.00`);
        } else {
          toast.success(`Success! "${displayTitle}" has been returned.`);
        }
        fetchAvailableBooks();
        fetchBorrowedBooks();
        setScannedBook(null);
        if (studentId) refreshClearance();

        // Auto-select student on return to show clearance/fines
        if (data.transaction && data.transaction.user) {
          const sId = data.transaction.user.student_id;
          const sCourse = data.transaction.user.course;
          setStudentId(sId);
          setStudentName(data.transaction.user.name);
          setIsNewStudent(false);
          handleSelectStudent(sId, sCourse);

          if (data.penalty > 0) {
            setShowFineModal(true);
          }
        }
      })
      .catch(err => {
        toast.error(err.response?.data?.message || `Error returning book ${assetCode}.`);
      });
  };

  // Handle adding a physical copy for a book that exists but has no copies
  const handleAddCopy = (book) => {
    setShowScanModal(false);
    setScannedBook(null);
    // Navigate to Books page - the book title already exists, they just need to add a copy
    // Show a message to guide the user
    toast.info(`"${book.title}" needs a physical copy. Click "+ Copy" in Inventory.`);
  };

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-slate-900 p-8 min-h-screen transition-colors duration-300">

      {/* SEARCH MODAL */}
      <FineSettlementModal
        isOpen={showFineModal}
        onClose={() => setShowFineModal(false)}
        studentId={studentId}
        studentName={studentName}
        onPaymentSuccess={() => refreshClearance(studentId)}
      />
      <StudentSearchModal
        isOpen={showStudentSearchModal}
        onClose={() => setShowStudentSearchModal(false)}
        onSelect={handleSelectStudentFromModal}
      />

      <BookSelectorModal
        isOpen={showBorrowBookModal}
        onClose={() => setShowBorrowBookModal(false)}
        onSelect={(book) => {
          setBorrowBookCode(book.asset_code);
          setShowBorrowBookModal(false);
        }}
        title="Browse Library Catalog"
        mode="borrow"
        apiEndpoint="/books/available/catalog"
      />

      <BookSelectorModal
        isOpen={showReturnBookModal}
        onClose={() => setShowReturnBookModal(false)}
        onSelect={(book) => {
          setReturnBookCode(book.asset_code);
          setShowReturnBookModal(false);
        }}
        title="Select Book to Return"
        mode="return"
        apiEndpoint="/books/borrowed/catalog"
        apiParams={{ type: "student" }}
      />

      {/* SCANNER MODE HEADER - Deep Navy Blue Gradient */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 text-white p-6 rounded-2xl shadow-xl border border-primary-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Scan size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Quick Scan Mode</h2>
              <p className="text-sm text-white/70">Scan book barcode or QR code for instant lookup</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Hardware Scanner Status Indicator */}
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-sm text-emerald-100">Hardware Scanner Active & Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE SETTINGS INFO BAR */}
      <div className="mt-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
            <Settings size={16} className="text-primary-500" />
            <span className="font-medium">Active Library Rules:</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-emerald-500" />
              <span className="text-gray-700 dark:text-slate-300">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{librarySettings.default_loan_days}</span> day loan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Book size={14} className="text-blue-500" />
              <span className="text-gray-700 dark:text-slate-300">
                Max <span className="font-bold text-blue-600 dark:text-blue-400">{librarySettings.max_loans_per_student}</span> books
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-amber-500" />
              <span className="text-gray-700 dark:text-slate-300">
                <span className="font-bold text-amber-600 dark:text-amber-400">₱{librarySettings.fine_per_day}</span>/day fine
              </span>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 mt-6">

        {/* LEFT SIDE: BORROW - Elevated White Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
              <Book size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Borrow Book</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Quick issue to student</p>
            </div>
          </div>
          <form onSubmit={handleBorrow} className="space-y-5 flex-1 flex flex-col">

            {/* SMART STUDENT ID INPUT */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-12 gap-4">
                {/* ID Input */}
                <div className="col-span-4">
                  <label className="flex justify-between text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setStudentId(val);
                      // Clear previous state immediately
                      setStudentName("");
                      setClearance(null);
                      setIsNewStudent(true);
                    }}
                    onBlur={() => {
                      // Server-side student lookup on blur (when user finishes typing)
                      if (!studentId || studentId.length < 2) return;
                      axiosClient.get(`/students/lookup/${encodeURIComponent(studentId)}`)
                        .then(({ data }) => {
                          if (data.found && data.student) {
                            setStudentName(data.student.name);
                            setIsNewStudent(false);
                            handleSelectStudent(data.student.student_id, data.student.course);
                          } else {
                            setStudentName("");
                            setStudentCourse("BSIT");
                            setStudentYear("1");
                            setStudentSection("");
                            setIsNewStudent(true);
                            setClearance(null);
                          }
                        })
                        .catch(() => {
                          setIsNewStudent(true);
                          setClearance(null);
                        });
                    }}
                    className="w-full border-2 border-gray-200 dark:border-slate-600 p-3 rounded-xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-600 outline-none transition-all bg-gray-50 dark:bg-slate-900 dark:text-white font-mono font-bold"
                    placeholder="ID No."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentSearchModal(true)}
                    className="mt-2 w-full text-xs text-primary-600 dark:text-primary-400 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 py-1.5 rounded transition flex items-center justify-center gap-1 border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                  >
                    <Search size={12} /> Search Directory
                  </button>
                </div>

                {/* Name Input */}
                <div className="col-span-8">
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Student Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      readOnly={!isNewStudent}
                      className={`w-full pl-12 pr-4 border-2 p-3 rounded-xl outline-none transition-all 
                            ${!isNewStudent
                          ? 'bg-gray-100 dark:bg-slate-800 border-transparent text-gray-500 dark:text-slate-500 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-900 border-primary-300 ring-2 ring-primary-100 text-primary-700 dark:text-emerald-400 font-bold'
                        }`}
                      placeholder={isNewStudent && studentId.length > 2 ? "Enter new student name..." : "Waiting for ID..."}
                      required
                    />
                    {isNewStudent && studentId.length > 2 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* New Student Details (Animated) */}
              {isNewStudent && studentId.length > 2 && (
                <div className="grid grid-cols-2 gap-4 animate-scaleIn origin-top">
                  {/* Course Select */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Course</label>
                    <div className="relative">
                      <select
                        value={studentCourse}
                        onChange={(e) => setStudentCourse(e.target.value)}
                        className="w-full appearance-none bg-white dark:bg-slate-900 border-2 border-primary-300 dark:border-primary-700 text-gray-800 dark:text-gray-100 p-3 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none font-bold"
                      >
                        <option value="BSIT">BSIT</option>
                        <option value="BSED">BSED</option>
                        <option value="BEED">BEED</option>
                        <option value="BSHM">BSHM</option>
                        <option value="BSBA">BSBA</option>
                        <option value="Maritime">Maritime</option>
                        <option value="BS Criminology">BS Criminology</option>
                        <option value="BS Tourism">BS Tourism</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Year & Section Split */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Year</label>
                      <div className="relative">
                        <select
                          value={studentYear}
                          onChange={(e) => setStudentYear(e.target.value)}
                          className="w-full appearance-none bg-white dark:bg-slate-900 border-2 border-primary-300 dark:border-primary-700 text-gray-800 dark:text-gray-100 p-3 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none font-bold"
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Section</label>
                      <input
                        type="text"
                        value={studentSection}
                        onChange={(e) => setStudentSection(e.target.value.toUpperCase())}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-primary-300 dark:border-primary-700 text-gray-800 dark:text-white p-3 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none font-bold placeholder-gray-400"
                        placeholder="Sec"
                        maxLength={5}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CLEARANCE STATUS BADGE (Only for existing students) */}
            {clearance && !isNewStudent && (
              <div className={`p-3 rounded-lg border ${clearance.is_cleared ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-bold ${clearance.is_cleared ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {clearance.is_cleared ? '✅ CLEARED' : '🚫 BLOCKED'}
                    </span>
                    <span className="text-gray-600 dark:text-slate-300 text-sm ml-2">
                      {clearance.course} | Loan Period: {clearance.loan_days} day(s)
                    </span>
                  </div>
                  <div className="text-right text-sm dark:text-slate-300">
                    <div>Active Loans: <span className="font-bold">{clearance.active_loans}/{clearance.max_loans || 3}</span></div>
                    {clearance.fine_per_day && (
                      <div className="text-xs text-gray-500 dark:text-slate-400">Fine Rate: ₱{clearance.fine_per_day}/day</div>
                    )}
                  </div>
                </div>

                {/* Overdue Book Details */}
                {clearance.overdue_count > 0 && clearance.overdue_details && (
                  <div className="mt-2 bg-rose-100 dark:bg-rose-900/40 p-2 rounded border border-rose-200 dark:border-rose-800">
                    <div className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide mb-1">
                      📚 {clearance.overdue_count} Overdue Book{clearance.overdue_count > 1 ? 's' : ''}
                    </div>
                    <div className="space-y-1">
                      {clearance.overdue_details.map((book, i) => (
                        <div key={i} className="flex justify-between items-center text-xs text-rose-700 dark:text-rose-300">
                          <span className="truncate max-w-[60%] font-medium">{book.book_title} <span className="text-rose-500/60 font-mono">({book.asset_code})</span></span>
                          <span className="font-bold whitespace-nowrap">{book.days_overdue}d late · ₱{parseFloat(book.accrued_fine).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Owed Breakdown */}
                {(clearance.total_owed > 0 || clearance.pending_fines > 0 || (clearance.block_reason && clearance.block_reason.includes('LOST BOOK'))) && (
                  <div className="mt-2 flex justify-between items-center bg-red-100 dark:bg-red-900/50 p-2 rounded">
                    <div className="text-sm">
                      <span className="text-red-700 dark:text-red-300 font-bold">
                        {clearance.total_owed > 0
                          ? `Total Owed: ₱${parseFloat(clearance.total_owed).toFixed(2)}`
                          : 'Lost Book - Payment Required'}
                      </span>
                      {clearance.pending_fines > 0 && clearance.accrued_fines > 0 && (
                        <div className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-0.5">
                          Settled: ₱{parseFloat(clearance.pending_fines).toFixed(2)} + Accruing: ₱{parseFloat(clearance.accrued_fines).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFineModal(true)}
                      className="text-xs bg-red-600 text-white px-3 py-1 rounded font-bold hover:bg-red-700 transition"
                    >
                      Manage
                    </button>
                  </div>
                )}

                {clearance.block_reason && (
                  <div className="text-red-600 dark:text-red-400 text-sm mt-1">⚠️ {clearance.block_reason}</div>
                )}
              </div>
            )}

            {/* AVAILABLE BOOKS DROPDOWN - Modernized Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Select Available Book</label>

              <div
                onClick={() => setShowBorrowBookModal(true)}
                className="group cursor-pointer relative w-full border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-primary-500 dark:hover:border-primary-400 bg-gray-50 dark:bg-slate-900 rounded-xl p-4 transition-all hover:bg-white dark:hover:bg-slate-800"
              >
                {borrowBookCode ? (
                  <div className="flex items-center gap-4">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg text-primary-600 dark:text-primary-400">
                      <Book size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Selected Book</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        {availableBooks.find(b => b.asset_code === borrowBookCode)?.title || borrowBookCode}
                        <span className="text-xs bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-300">{borrowBookCode}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBorrowBookCode("");
                      }}
                      className="ml-auto p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 transition-colors"
                    >
                      <span className="sr-only">Clear</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 text-gray-400 group-hover:text-primary-500 transition-colors">
                    <Library size={32} className="mb-2 opacity-50" />
                    <span className="font-bold">Click to Select Book</span>
                    <span className="text-xs mt-1">Browse library catalog</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Row - pushed to bottom */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-700 mt-auto">
              <span className="flex items-center gap-1"><User size={14} /> {(isNewStudent ? 'New Student' : (studentName || 'Select Student'))}</span>
              <span className="flex items-center gap-1"><Book size={14} /> {filteredBooks.length} available</span>
            </div>

            {/* Confirm Loan Button - Full Width, High Contrast Dark Blue */}
            <button
              disabled={clearance && !clearance.is_cleared}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 transform ${clearance && !clearance.is_cleared
                ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-primary-200'
                }`}
            >
              {clearance && !clearance.is_cleared ? '🚫 Borrowing Blocked' : '✓ Confirm Loan'}
            </button>
          </form>
        </div>

        {/* RIGHT SIDE: RETURN - Elevated White Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <Book size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Return Book</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Process a book return</p>
            </div>
          </div>
          <form onSubmit={handleReturn} className="space-y-5 flex-1 flex flex-col">

            {/* BORROWED BOOKS DROPDOWN - Modernized Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Select Borrowed Book</label>

              <div
                onClick={() => setShowReturnBookModal(true)}
                className="group cursor-pointer relative w-full border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-gray-50 dark:bg-slate-900 rounded-xl p-4 transition-all hover:bg-white dark:hover:bg-slate-800"
              >
                {returnBookCode ? (
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <Book size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Selected Book</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        {borrowedBooks.find(b => b.asset_code === returnBookCode)?.title || returnBookCode}
                        <span className="text-xs bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-300">{returnBookCode}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReturnBookCode("");
                      }}
                      className="ml-auto p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 transition-colors"
                    >
                      <span className="sr-only">Clear</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 text-gray-400 group-hover:text-emerald-500 transition-colors">
                    <Library size={32} className="mb-2 opacity-50" />
                    <span className="font-bold">Click to Return Book</span>
                    <span className="text-xs mt-1">Search borrowed books</span>
                  </div>
                )}
              </div>
            </div>



            {/* Stats Row with Status Badge - pushed to bottom */}
            <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-700 mt-auto">
              <span className="text-gray-500 dark:text-slate-400">📖 {borrowedBooks.length} book{borrowedBooks.length !== 1 ? 's' : ''} borrowed</span>
              {borrowedBooks.filter(b => b.is_overdue).length > 0 && (
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-bold border border-red-200 dark:border-red-800">
                  {borrowedBooks.filter(b => b.is_overdue).length} Overdue
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* Mark as Returned Button - Main Action */}
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white py-4 rounded-xl hover:bg-emerald-700 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] font-bold text-lg transition-all duration-200 transform shadow-md shadow-emerald-200"
              >
                ✓ Mark as Returned
              </button>

              {/* Mark as Lost Button - Danger Action */}
              <button
                type="button"
                onClick={handleMarkAsLost}
                disabled={!returnBookCode}
                className="px-5 bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100 hover:border-red-200 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Mark as Lost"
              >
                <AlertTriangle size={20} />
                <span className="text-[10px] uppercase tracking-wide">Lost</span>
              </button>
            </div>
          </form>
        </div>

        {/* STATUS MESSAGES AREA REMOVED (Replaced by Toasts) */}

        {/* PAYMENT MODAL */}
        {
          showPaymentModal && pendingTransaction && (
            <PaymentModal
              transaction={pendingTransaction}
              isLostBook={isLostBookPayment}
              onClose={() => {
                setShowPaymentModal(false);
                setPendingTransaction(null);
                setIsLostBookPayment(false);
              }}
              onSuccess={handlePaymentSuccess}
            />
          )
        }
      </div >

      {/* BOOK SCAN MODAL */}
      {
        showScanModal && scannedBook && (
          <BookScanModal
            book={scannedBook}
            onBorrow={handleScanBorrow}
            onReturn={handleScanReturn}
            onAddCopy={handleAddCopy}
            onClose={() => {
              setShowScanModal(false);
              setScannedBook(null);
            }}
          />
        )
      }

      {/* BOOK NOT FOUND MODAL */}
      {
        showNotFoundModal && (
          <BookNotFoundModal
            scannedCode={notFoundBarcode}
            onRegister={handleRegisterBook}
            onClose={() => {
              setShowNotFoundModal(false);
              setNotFoundBarcode("");
            }}
          />
        )
      }
      {/* Book Registration Form */}
      {showBookForm && (
        <BookForm
          prefillBarcode={prefillBarcode}
          onClose={() => {
            setShowBookForm(false);
            setPrefillBarcode("");
          }}
          onSuccess={() => {
            fetchAvailableBooks(); // Refresh list to include new book
            toast.success("Book registered successfully!");
          }}
        />
      )}
    </div >
  );
}