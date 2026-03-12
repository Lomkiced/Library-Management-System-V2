import { useEffect, useState, useRef } from "react";
import { useToast } from "../components/ui/Toast";
import axiosClient, { ASSET_URL } from "../axios-client";
import Swal from "sweetalert2";
import {
  Scan, X, BookOpen, User, Tag, Building2, Calendar,
  Hash, FileText, Globe, MapPin, Image, Copy, Upload, Search, Loader2, CheckCircle, AlertTriangle
} from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import FloatingSelect from "../components/ui/FloatingSelect";
import Button from "../components/ui/Button";

export default function BookForm({ onClose, onSuccess, bookToEdit, prefillBarcode = "" }) {
  const toast = useToast();
  // Form is always in 'details' mode now

  const [book, setBook] = useState({
    title: "",
    subtitle: "",
    author: "",
    category: "Book",
    college: "",
    isbn: "",
    accession_no: "",
    lccn: "",
    issn: "",
    publisher: "",
    place_of_publication: "",
    published_year: "",
    copyright_year: "",
    call_number: "",
    pages: "",
    physical_description: "",
    edition: "",
    series: "",
    volume: "",
    price: "",
    book_penalty: "",
    language: "English",
    description: "",
    location: "",
    copies: "1"
  });

  const [isDamaged, setIsDamaged] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Predefined lists
  const COLLEGES = [
    "GENERAL",
    "COLLEGE OF CRIMINOLOGY",
    "COLLEGE OF MARITIME",
    "COLLEGE OF INFORMATION TECHNOLOGY",
    "COLLEGE OF HOSPITALITY & TOURISM MANAGEMENT",
    "COLLEGE OF BUSINESS ADMINISTRATION",
    "COLLEGE OF EDUCATION"
  ];

  // ── Accession Duplicate Check State ──
  // status: 'idle' | 'checking' | 'available' | 'duplicate'
  const [accessionStatus, setAccessionStatus] = useState('idle');
  const [accessionConflicts, setAccessionConflicts] = useState([]); // codes that conflict
  const accessionTimerRef = useRef(null);

  // ── Edit-mode: accession number for new copies ──
  // User can type their own or accept the auto-suggested value
  const [newCopiesAccession, setNewCopiesAccession] = useState("");
  const [editAccFetching, setEditAccFetching] = useState(false);
  const [editAccUserTouched, setEditAccUserTouched] = useState(false);

  // ── Edit-mode: duplicate check for new copies accession ──
  const [editCopyAccStatus, setEditCopyAccStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'duplicate'
  const [editCopyAccConflicts, setEditCopyAccConflicts] = useState([]);
  const editCopyAccTimerRef = useRef(null);

  // Track if barcode was pre-filled from scanner
  const [isFromScanner, setIsFromScanner] = useState(false);

  // If we are editing, fill the form with the existing data
  useEffect(() => {
    if (bookToEdit) {
      setBook({
        title: bookToEdit.title || "",
        subtitle: bookToEdit.subtitle || "",
        author: bookToEdit.author || "",
        category: bookToEdit.category || "",
        college: bookToEdit.college || "",
        isbn: bookToEdit.isbn || "",
        accession_no: bookToEdit.accession_no || "",
        lccn: bookToEdit.lccn || "",
        issn: bookToEdit.issn || "",
        publisher: bookToEdit.publisher || "",
        place_of_publication: bookToEdit.place_of_publication || "",
        published_year: bookToEdit.published_year || "",
        copyright_year: bookToEdit.copyright_year || "",
        call_number: bookToEdit.call_number || "",
        pages: bookToEdit.pages || "",
        physical_description: bookToEdit.physical_description || "",
        edition: bookToEdit.edition || "",
        series: bookToEdit.series || "",
        volume: bookToEdit.volume || "",
        price: bookToEdit.price || "",
        book_penalty: bookToEdit.book_penalty || "",
        language: bookToEdit.language || "English",
        description: bookToEdit.description || "",
        location: bookToEdit.location || "",
        copies: "0" // Not editable for existing books
      });
      // Set image preview if book has existing image
      if (bookToEdit.image_path) {
        setImagePreview(`${ASSET_URL}/${bookToEdit.image_path}`);
      }
    }
  }, [bookToEdit]);

  // Pre-fill barcode from scanner
  useEffect(() => {
    if (prefillBarcode && !bookToEdit) {
      setBook(prev => ({ ...prev, isbn: prefillBarcode }));
      setIsFromScanner(true);
    }
  }, [prefillBarcode, bookToEdit]);

  // Fetch Next Accession Number for New Books
  useEffect(() => {
    if (!bookToEdit) {
      axiosClient.get('/books/next-accession')
        .then(({ data }) => {
          if (data.accession_number) {
            setBook(prev => ({ ...prev, accession_no: data.accession_number }));
          }
        })
        .catch(err => console.error("Failed to fetch next accession:", err));
    }
  }, [bookToEdit]);

  // ── Auto-suggest accession when adding copies in edit mode ──
  // Only auto-fill if the user hasn't manually typed a value
  useEffect(() => {
    if (!bookToEdit) return;
    const copies = parseInt(book.copies) || 0;
    if (copies > 0 && !editAccUserTouched) {
      setEditAccFetching(true);
      axiosClient.get('/books/next-accession')
        .then(({ data }) => {
          if (data.accession_number && !editAccUserTouched) {
            setNewCopiesAccession(data.accession_number);
          }
        })
        .catch(err => console.error('Failed to fetch next accession for copies:', err))
        .finally(() => setEditAccFetching(false));
    } else if (copies <= 0) {
      setNewCopiesAccession("");
      setEditAccUserTouched(false);
    }
  }, [bookToEdit, book.copies]);

  // ── Debounced Accession Duplicate Check ──
  useEffect(() => {
    // Clear any pending timer
    if (accessionTimerRef.current) clearTimeout(accessionTimerRef.current);

    const base = book.accession_no?.trim();
    if (!base) {
      setAccessionStatus('idle');
      setAccessionConflicts([]);
      return;
    }

    setAccessionStatus('checking');

    accessionTimerRef.current = setTimeout(() => {
      const copies = parseInt(book.copies) || 0;
      const excludeId = bookToEdit?.id || '';

      // Determine which codes to check
      let codesToCheck = [base];
      if (!bookToEdit && copies > 1) {
        // Generate all accession numbers that will be created
        const match = base.match(/^(.*?)(\d+)$/);
        if (match) {
          const prefix = match[1];
          const numStr = match[2];
          const numLen = numStr.length;
          const startNum = parseInt(numStr, 10);
          codesToCheck = [];
          for (let i = 0; i < copies; i++) {
            codesToCheck.push(prefix + (startNum + i).toString().padStart(numLen, '0'));
          }
        } else {
          codesToCheck = [base];
          for (let i = 2; i <= copies; i++) {
            codesToCheck.push(`${base}-${i}`);
          }
        }
      }

      // Use batch mode for efficiency
      const params = new URLSearchParams();
      params.set('batch', codesToCheck.join(','));
      if (excludeId) params.set('exclude_book_id', excludeId);

      axiosClient.get(`/books/check-accession?${params.toString()}`)
        .then(({ data }) => {
          const conflicts = [];
          if (data.results) {
            Object.entries(data.results).forEach(([code, info]) => {
              if (!info.available) conflicts.push(code);
            });
          }
          setAccessionConflicts(conflicts);
          setAccessionStatus(conflicts.length > 0 ? 'duplicate' : 'available');
        })
        .catch(() => {
          // Fail open — don't block form if check fails
          setAccessionStatus('idle');
          setAccessionConflicts([]);
        });
    }, 500);

    return () => {
      if (accessionTimerRef.current) clearTimeout(accessionTimerRef.current);
    };
  }, [book.accession_no, book.copies, bookToEdit]);

  // ── Debounced Duplicate Check for Edit-Mode New Copies Accession ──
  useEffect(() => {
    if (editCopyAccTimerRef.current) clearTimeout(editCopyAccTimerRef.current);

    const base = newCopiesAccession?.trim();
    if (!base || !bookToEdit) {
      setEditCopyAccStatus('idle');
      setEditCopyAccConflicts([]);
      return;
    }

    setEditCopyAccStatus('checking');

    editCopyAccTimerRef.current = setTimeout(() => {
      const copies = parseInt(book.copies) || 1;
      const excludeId = bookToEdit?.id || '';

      // Generate all accession numbers that will be created
      let codesToCheck = [];
      const match = base.match(/^(.*?)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const numStr = match[2];
        const numLen = numStr.length;
        const startNum = parseInt(numStr, 10);
        for (let i = 0; i < copies; i++) {
          codesToCheck.push(prefix + (startNum + i).toString().padStart(numLen, '0'));
        }
      } else {
        codesToCheck = [base];
        for (let i = 2; i <= copies; i++) {
          codesToCheck.push(`${base}-${i}`);
        }
      }

      const params = new URLSearchParams();
      params.set('batch', codesToCheck.join(','));
      // Do NOT exclude current book ID when checking new copies accession
      // New copies must have unique accession numbers globally, distinct from existing ones 
      // even within the same book title.

      axiosClient.get(`/books/check-accession?${params.toString()}`)
        .then(({ data }) => {
          const conflicts = [];
          if (data.results) {
            Object.entries(data.results).forEach(([code, info]) => {
              if (!info.available) conflicts.push(code);
            });
          }
          setEditCopyAccConflicts(conflicts);
          setEditCopyAccStatus(conflicts.length > 0 ? 'duplicate' : 'available');
        })
        .catch(() => {
          setEditCopyAccStatus('idle');
          setEditCopyAccConflicts([]);
        });
    }, 500);

    return () => {
      if (editCopyAccTimerRef.current) clearTimeout(editCopyAccTimerRef.current);
    };
  }, [newCopiesAccession, book.copies, bookToEdit]);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper to generate preview of accession numbers
  const getAccPreview = () => {
    const base = book.accession_no;
    const count = parseInt(book.copies) || 0;

    if (!base || count < 1) return [];

    const previews = [];
    const match = base.match(/^(.*?)(\d+)$/);

    if (match) {
      // Numeric suffix found - Smart Increment
      const prefix = match[1];
      const numberStr = match[2];
      const numberLen = numberStr.length;
      const startNum = parseInt(numberStr, 10);

      for (let i = 0; i < count; i++) {
        const nextNum = startNum + i;
        const padded = nextNum.toString().padStart(numberLen, '0');
        previews.push(`${prefix}${padded}`);
      }
    } else {
      // Non-numeric suffix - Append sequence
      // Copy 1 is base, Copy 2 is base-2, etc.
      for (let i = 0; i < count; i++) {
        if (i === 0) previews.push(base);
        else previews.push(`${base}-${i + 1}`);
      }
    }
    return previews;
  };

  // Helper to generate preview of accession numbers for edit-mode copies
  const getEditAccPreview = () => {
    const base = newCopiesAccession?.trim();
    if (!base) return [];
    const count = parseInt(book.copies) || 0;
    if (count < 1) return [];

    const previews = [];
    const match = base.match(/^(.*?)(\d+)$/);

    if (match) {
      const prefix = match[1];
      const numberStr = match[2];
      const numberLen = numberStr.length;
      const startNum = parseInt(numberStr, 10);

      for (let i = 0; i < count; i++) {
        const nextNum = startNum + i;
        const padded = nextNum.toString().padStart(numberLen, '0');
        previews.push(`${prefix}${padded}`);
      }
    } else {
      for (let i = 0; i < count; i++) {
        if (i === 0) previews.push(base);
        else previews.push(`${base}-${i + 1}`);
      }
    }
    return previews;
  };

  const accPreviews = getAccPreview();
  const editAccPreviews = getEditAccPreview();

  const handleSubmit = (ev) => {
    ev.preventDefault();
    setLoading(true);

    // Create FormData for file upload
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("title", book.title);
    if (book.subtitle) formData.append("subtitle", book.subtitle);
    formData.append("author", book.author);
    formData.append("category", book.category);
    if (book.college) formData.append("college", book.college);

    // Only append optional fields if they have values
    if (book.isbn) formData.append("isbn", book.isbn);
    if (book.accession_no) formData.append("accession_no", book.accession_no);
    if (book.lccn) formData.append("lccn", book.lccn);
    if (book.issn) formData.append("issn", book.issn);
    if (book.publisher) formData.append("publisher", book.publisher);
    if (book.place_of_publication) formData.append("place_of_publication", book.place_of_publication);
    if (book.published_year) formData.append("published_year", book.published_year);
    if (book.copyright_year) formData.append("copyright_year", book.copyright_year);
    if (book.call_number) formData.append("call_number", book.call_number);
    if (book.pages) formData.append("pages", book.pages);
    if (book.physical_description) formData.append("physical_description", book.physical_description);
    if (book.edition) formData.append("edition", book.edition);
    if (book.series) formData.append("series", book.series);
    if (book.volume) formData.append("volume", book.volume);
    if (book.price) formData.append("price", book.price);
    if (book.book_penalty) formData.append("book_penalty", book.book_penalty);
    if (book.language) formData.append("language", book.language);
    if (book.description) formData.append("description", book.description);
    if (book.location) formData.append("location", book.location);

    if (!bookToEdit) {
      formData.append("copies", book.copies || "1");
      if (isDamaged) {
        formData.append("is_damaged", "1");
      }
    }

    if (imageFile) {
      formData.append("image", imageFile);
    }

    if (bookToEdit) {
      // UPDATE MODE - Use POST with _method for Laravel
      formData.append("_method", "PUT");

      // If user entered copies in edit mode, it means they want to ADD copies
      if (book.copies && parseInt(book.copies) > 0) {
        formData.append("added_copies", book.copies);

        // Send user-provided accession number for the new copies
        if (newCopiesAccession?.trim()) {
          formData.append("new_copies_accession", newCopiesAccession.trim());
        }

        if (isDamaged) {
          formData.append("is_damaged_copies", "1");
        }
      }

      axiosClient.post(`/books/${bookToEdit.id}`, formData)
        .then((res) => {
          setLoading(false);
          const addedCount = res.data.added_copies || 0;
          const accessions = res.data.assigned_accessions || [];
          let msg = res.data.message || "Book updated successfully";
          if (addedCount > 0 && accessions.length > 0) {
            msg += `\nAccession Numbers: ${accessions.join(', ')}`;
          }
          toast.success(msg);
          onSuccess(book);
          onClose();
        })
        .catch(err => {
          setLoading(false);
          console.error(err);
          const response = err.response;
          if (response && response.status === 422) {
            const errors = response.data.errors;
            if (errors) {
              const errorMessages = Object.values(errors).flat().join('\n');
              toast.error("Validation Error: " + errorMessages);
            } else {
              toast.error(response.data.message || "Validation failed. Please check your inputs.");
            }
          } else {
            toast.error(response?.data?.message || "Failed to update book");
          }
        });
    } else {
      // CREATE MODE - Barcode auto-generated in backend
      axiosClient.post("/books/title", formData)
        .then((res) => {
          setLoading(false);
          const newBook = res.data.book;
          const copiesCreated = res.data.copies_created || 0;
          const isbn = newBook?.isbn || 'Auto-generated';

          Swal.fire({
            icon: 'success',
            title: 'Book Added Successfully!',
            html: `
              <div style="text-align: left; padding: 10px 0;">
                <p><strong>Title:</strong> ${newBook?.title || book.title}</p>
                <p><strong>ISBN:</strong> <code style="background: #e3e8ee; padding: 2px 8px; border-radius: 4px;">${isbn}</code></p>
                <p><strong>Physical Copies:</strong> ${copiesCreated}</p>
                <hr style="margin: 10px 0; border-color: #e5e7eb;">
                <p style="color: #059669;">✅ Registered for scanner - Ready to borrow!</p>
              </div>
            `,
            confirmButtonColor: '#020463',
            confirmButtonText: 'Great!'
          });

          onSuccess(newBook);
          onClose();
        })
        .catch(err => {
          setLoading(false);
          console.error(err);
          const response = err.response;
          if (response && response.status === 422) {
            const errors = response.data.errors;
            const errorMessages = Object.values(errors).flat().join('\n');
            toast.error("Validation Error: " + errorMessages);
          } else {
            // Generic fallback
            toast.error(response?.data?.message || "Failed to create book. Please check inputs.");
          }
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#020463] px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BookOpen className="text-white" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {bookToEdit ? "Edit Book" : "Add New Book"}
              </h2>
              <p className="text-white/70 text-sm">
                {bookToEdit ? "Update book information" : "Complete book details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition text-white/70 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Scanner indicator */}
          {isFromScanner && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Scan className="text-[#020463]" size={20} />
              </div>
              <div>
                <p className="text-[#020463] font-bold text-sm">Registering from Scanner</p>
                <p className="text-blue-600 text-sm mt-0.5">
                  The ISBN has been pre-filled.
                </p>
              </div>
            </div>
          )}

          {/* Book Details Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Section */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Book Cover Image</label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-32 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Image className="mx-auto text-gray-400" size={32} />
                      <p className="text-xs text-gray-400 mt-1">No image</p>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="book-image"
                  />
                  <label
                    htmlFor="book-image"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#020463] rounded-lg cursor-pointer hover:bg-blue-100 transition font-medium text-sm"
                  >
                    <Upload size={16} />
                    Choose Image
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="ml-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Form Fields: Strict Order as Requested */}
            <div className="space-y-4">

              {/* 1. Category */}
              <FloatingSelect
                label="Category"
                value={book.category}
                onChange={e => setBook({ ...book, category: e.target.value })}
                required
              >
                <option value="Article">Article</option>
                <option value="Book">Book</option>
                <option value="Computer File/Electronic Resources">Computer File/Electronic Resources</option>
                <option value="Map">Map</option>
                <option value="Thesis">Thesis</option>
                <option value="Visual Materials">Visual Materials</option>
              </FloatingSelect>

              {/* 1b. College */}
              <FloatingSelect
                label="College"
                value={book.college}
                onChange={e => setBook({ ...book, college: e.target.value })}
              >
                <option value="GENERAL">GENERAL</option>
                <option value="COLLEGE OF CRIMINOLOGY">COLLEGE OF CRIMINOLOGY</option>
                <option value="COLLEGE OF MARITIME">COLLEGE OF MARITIME</option>
                <option value="COLLEGE OF INFORMATION TECHNOLOGY">COLLEGE OF INFORMATION TECHNOLOGY</option>
                <option value="COLLEGE OF HOSPITALITY & TOURISM MANAGEMENT">COLLEGE OF HOSPITALITY & TOURISM MANAGEMENT</option>
                <option value="COLLEGE OF BUSINESS ADMINISTRATION">COLLEGE OF BUSINESS ADMINISTRATION</option>
                <option value="COLLEGE OF EDUCATION">COLLEGE OF EDUCATION</option>
              </FloatingSelect>

              {/* 2. Accession No. & 3. Call Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FloatingInput
                    label="Accession No."
                    value={book.accession_no}
                    onChange={e => setBook({ ...book, accession_no: e.target.value })}
                    icon={Hash}
                    error={accessionStatus === 'duplicate' ? 'This accession number is already in use' : undefined}
                  />
                  {/* Real-time Status Indicator */}
                  {book.accession_no?.trim() && accessionStatus === 'checking' && (
                    <div className="flex items-center gap-1.5 mt-1.5 ml-1">
                      <Loader2 size={14} className="animate-spin text-blue-500" />
                      <span className="text-xs font-medium text-blue-500">Checking availability…</span>
                    </div>
                  )}
                  {accessionStatus === 'available' && (
                    <div className="flex items-center gap-1.5 mt-1.5 ml-1">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">Available</span>
                    </div>
                  )}
                  {accessionStatus === 'duplicate' && accessionConflicts.length > 0 && (
                    <div className="mt-1.5 ml-1">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-red-500" />
                        <span className="text-xs font-medium text-red-600">
                          {accessionConflicts.length === 1
                            ? 'Already in use'
                            : `${accessionConflicts.length} conflicts found`}
                        </span>
                      </div>
                      {accessionConflicts.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {accessionConflicts.map(c => (
                            <span key={c} className="px-1.5 py-0.5 bg-red-50 border border-red-200 rounded text-[10px] font-mono text-red-600">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <FloatingInput
                  label="Call Number"
                  value={book.call_number}
                  onChange={e => setBook({ ...book, call_number: e.target.value })}
                  icon={Hash}
                />
              </div>

              {/* 4. Book Title */}
              <FloatingInput
                label="Book Title"
                value={book.title}
                onChange={e => setBook({ ...book, title: e.target.value })}
                icon={BookOpen}
                required
              />

              {/* 5. Subtitle (New) */}
              <FloatingInput
                label="Subtitle"
                value={book.subtitle || ""}
                onChange={e => setBook({ ...book, subtitle: e.target.value })}
                icon={BookOpen}
                placeholder="Optional"
              />

              {/* 6. Author */}
              <FloatingInput
                label="Author"
                value={book.author}
                onChange={e => setBook({ ...book, author: e.target.value })}
                icon={User}
                required
              />

              {/* 7. ISBN, 8. LCCN, 9. ISSN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FloatingInput
                  label="ISBN"
                  value={book.isbn}
                  onChange={e => setBook({ ...book, isbn: e.target.value })}
                  icon={Hash}
                  placeholder={bookToEdit ? "" : "Auto-generated if blank"}
                />
                <FloatingInput
                  label="LCCN"
                  value={book.lccn}
                  onChange={e => setBook({ ...book, lccn: e.target.value })}
                  icon={Hash}
                  placeholder="Library of Congress"
                />
                <FloatingInput
                  label="ISSN"
                  value={book.issn}
                  onChange={e => setBook({ ...book, issn: e.target.value })}
                  icon={Hash}
                  placeholder="Serial Number"
                />
              </div>

              {/* 10. Location & 11. Book Penalty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Location"
                  value={book.location}
                  onChange={e => setBook({ ...book, location: e.target.value })}
                  icon={MapPin}
                  placeholder="Shelf location"
                />
                <FloatingInput
                  label="Book Penalty (₱)"
                  value={book.book_penalty}
                  onChange={e => setBook({ ...book, book_penalty: e.target.value })}
                  icon={Tag}
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* 12. Publisher & 13. Place */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Publisher"
                  value={book.publisher}
                  onChange={e => setBook({ ...book, publisher: e.target.value })}
                  icon={Building2}
                />
                <FloatingInput
                  label="Place of Publication"
                  value={book.place_of_publication}
                  onChange={e => setBook({ ...book, place_of_publication: e.target.value })}
                  icon={MapPin}
                />
              </div>

              {/* 14. Physical Description & 15. Edition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Physical Description"
                  value={book.physical_description}
                  onChange={e => setBook({ ...book, physical_description: e.target.value })}
                  icon={FileText}
                  placeholder="e.g. 200p., ill."
                />
                <FloatingInput
                  label="Edition"
                  value={book.edition}
                  onChange={e => setBook({ ...book, edition: e.target.value })}
                  icon={FileText}
                  placeholder="e.g. 2nd Edition"
                />
              </div>

              {/* 16. Copyright & 17. Series */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Copyright Year"
                  value={book.copyright_year}
                  onChange={e => setBook({ ...book, copyright_year: e.target.value })}
                  icon={Calendar}
                  type="number"
                />
                <FloatingInput
                  label="Series"
                  value={book.series}
                  onChange={e => setBook({ ...book, series: e.target.value })}
                  icon={FileText}
                />
              </div>

              {/* DAMAGED BOOK TOGGLE (Only for new books) */}
              {!bookToEdit && (
                <div
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${isDamaged
                    ? "border-rose-400 bg-rose-50"
                    : "border-gray-200 hover:border-rose-200"
                    }`}
                  onClick={() => setIsDamaged(!isDamaged)}
                >
                  <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isDamaged
                    ? "bg-rose-500 border-rose-500 text-white"
                    : "bg-white border-gray-300"
                    }`}>
                    {isDamaged && <CheckCircle size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isDamaged ? "text-rose-700" : "text-gray-700"}`}>
                      MARK THIS AS A DAMAGED BOOK
                    </p>
                    <p className="text-xs text-gray-500">
                      The copies will be automatically added to the damaged inventory.
                    </p>
                  </div>
                </div>
              )}

              {/* 18. Copy & 19. Volume */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <FloatingInput
                    label={bookToEdit ? "Add Copies (+)" : "Number of Copies"}
                    value={book.copies}
                    onChange={e => setBook({ ...book, copies: e.target.value })}
                    icon={Copy}
                    type="number"
                    min="0"
                    placeholder={bookToEdit ? "0" : "1"}
                  />
                  {bookToEdit && (
                    <p className="text-xs text-slate-500 mt-1 ml-1">
                      Enter number of <b>new</b> copies to add. Leave 0 to keep current.
                    </p>
                  )}
                </div>

                {/* Live Accession Preview */}
                {!bookToEdit && book.accession_no && book.copies > 0 && (
                  <div className="col-span-1 md:col-span-2 mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                    <p className="font-bold text-[#020463] mb-1 flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" />
                      Will generate these Accession Numbers:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {accPreviews.slice(0, 5).map(acc => (
                        <span key={acc} className="px-2 py-1 bg-white border border-blue-200 rounded text-xs font-mono text-blue-700">
                          {acc}
                        </span>
                      ))}
                      {accPreviews.length > 5 && (
                        <span className="px-2 py-1 text-xs text-gray-500 italic">
                          ...and {accPreviews.length - 5} more
                        </span>
                      )}
                    </div>
                    {!book.accession_no.match(/^(.*?)(\d+)$/) && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        ⚠️ Tip: End with a number (e.g. "LIB-01") to auto-increment correctly.
                      </p>
                    )}
                  </div>
                )}

                {/* Edit-mode: Accession Input & Preview for New Copies */}
                {bookToEdit && parseInt(book.copies) > 0 && (
                  <div className="col-span-1 md:col-span-2 mt-2 space-y-3">
                    {/* Accession Number Input for New Copies */}
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                      <label className="block text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                        <Hash size={14} className="text-emerald-600" />
                        Accession No. for New Copies
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newCopiesAccession}
                          onChange={e => {
                            setNewCopiesAccession(e.target.value);
                            setEditAccUserTouched(true);
                          }}
                          placeholder={editAccFetching ? "Loading suggestion..." : "e.g. LIB-2026-0042"}
                          className="w-full px-4 py-2.5 border-2 border-emerald-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 font-mono text-sm bg-white placeholder:text-emerald-400"
                        />
                        {editAccFetching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 size={16} className="animate-spin text-emerald-500" />
                          </div>
                        )}
                        {!editAccFetching && editCopyAccStatus === 'checking' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 size={16} className="animate-spin text-blue-500" />
                          </div>
                        )}
                        {!editAccFetching && editCopyAccStatus === 'available' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <CheckCircle size={16} className="text-emerald-500" />
                          </div>
                        )}
                        {!editAccFetching && editCopyAccStatus === 'duplicate' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <AlertTriangle size={16} className="text-red-500" />
                          </div>
                        )}
                      </div>

                      {/* Duplicate Warning */}
                      {editCopyAccStatus === 'duplicate' && editCopyAccConflicts.length > 0 && (
                        <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <AlertTriangle size={13} className="text-red-500" />
                            <span className="text-xs font-bold text-red-700">
                              {editCopyAccConflicts.length === 1
                                ? 'This accession number is already in use'
                                : `${editCopyAccConflicts.length} accession numbers already in use`}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {editCopyAccConflicts.map(c => (
                              <span key={c} className="px-1.5 py-0.5 bg-red-100 border border-red-300 rounded text-[10px] font-mono text-red-700 font-semibold">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Available Indicator */}
                      {editCopyAccStatus === 'available' && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <CheckCircle size={13} className="text-emerald-500" />
                          <span className="text-[11px] font-medium text-emerald-600">All accession numbers are available</span>
                        </div>
                      )}
                      <p className="text-[11px] text-emerald-600/80 mt-1.5">
                        {parseInt(book.copies) > 1
                          ? `This is the starting number. ${parseInt(book.copies)} copies will be auto-incremented from this value.`
                          : "This will be the accession number for the new copy."}
                        {' '}Leave blank to auto-generate.
                      </p>

                      {/* Live Preview of Generated Accession Numbers */}
                      {editAccPreviews.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-emerald-200">
                          <p className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-emerald-500" />
                            Will assign:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {editAccPreviews.slice(0, 8).map(acc => (
                              <span key={acc} className="px-2 py-1 bg-white border border-emerald-300 rounded text-xs font-mono text-emerald-700 font-semibold shadow-sm">
                                {acc}
                              </span>
                            ))}
                            {editAccPreviews.length > 8 && (
                              <span className="px-2 py-1 text-xs text-gray-500 italic">
                                ...and {editAccPreviews.length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <FloatingInput
                  label="Volume"
                  value={book.volume}
                  onChange={e => setBook({ ...book, volume: e.target.value })}
                  icon={FileText}
                />
              </div>

              {/* 20. Price */}
              <FloatingInput
                label="Price (₱)"
                value={book.price}
                onChange={e => setBook({ ...book, price: e.target.value })}
                icon={Tag}
                type="number"
                step="0.01"
              />

              {/* 21. Remarks */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={book.description} // Using description for remarks
                  onChange={e => setBook({ ...book, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#020463] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-gray-900"
                  placeholder="Additional remarks..."
                />
              </div>

            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="form"
                loading={loading}
                disabled={
                  accessionStatus === 'duplicate' || accessionStatus === 'checking' ||
                  (parseInt(book.copies) > 0 && (editCopyAccStatus === 'duplicate' || editCopyAccStatus === 'checking'))
                }
                className="flex-1"
              >
                {bookToEdit ? "Save Changes" : "Save Book"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
