import { useState, useEffect, useRef, useCallback } from "react";
import KioskLayout from "./KioskLayout";
import axiosClient from "../axios-client";
import { CheckCircle, XCircle, Loader2, ScanLine, Delete, ArrowRight, Hash, AlertCircle, Wifi, ArrowUp, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Glass Card Helper ---
const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden ${className}`}>
        {children}
    </div>
);

// --- Advanced Virtual Keyboard Component ---
const VirtualKeyboard = ({ onInput, onBackspace, onSubmit, disabled, inputLength }) => {
    const [mode, setMode] = useState("alpha"); // "alpha", "numeric", "symbol"
    const [isShift, setIsShift] = useState(true); // Default uppercase for IDs

    const alphaRows = [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"],
        ["?123", "-", "space", "Submit"]
    ];

    const numericRows = [
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        ["-", "/", ":", ";", "(", ")", "$", "&", "@", "\""],
        ["#+=", ".", ",", "?", "!", "'", "⌫"],
        ["ABC", "-", "space", "Submit"]
    ];

    const symbolRows = [
        ["[", "]", "{", "}", "#", "%", "^", "*", "+", "="],
        ["_", "\\", "|", "~", "<", ">", "€", "£", "¥", "•"],
        ["?123", ".", ",", "?", "!", "'", "⌫"],
        ["ABC", "-", "space", "Submit"]
    ];

    const handleKey = (key) => {
        if (disabled) return;
        
        if (key === "⌫") {
            onBackspace();
            if (navigator.vibrate) navigator.vibrate(40);
        } else if (key === "⇧") {
            setIsShift(!isShift);
            if (navigator.vibrate) navigator.vibrate(30);
        } else if (key === "?123") {
            setMode("numeric");
            if (navigator.vibrate) navigator.vibrate(30);
        } else if (key === "ABC") {
            setMode("alpha");
            if (navigator.vibrate) navigator.vibrate(30);
        } else if (key === "#+=") {
            setMode("symbol");
            if (navigator.vibrate) navigator.vibrate(30);
        } else if (key === "space") {
            onInput(" ");
            if (navigator.vibrate) navigator.vibrate(30);
        } else if (key === "Submit") {
            onSubmit();
            if (navigator.vibrate) navigator.vibrate(50);
        } else {
            const char = isShift && mode === "alpha" ? key.toUpperCase() : key;
            onInput(char);
            if (navigator.vibrate) navigator.vibrate(30);
        }
    };

    const rows = mode === "alpha" ? alphaRows : mode === "numeric" ? numericRows : symbolRows;

    return (
        <div className="w-full flex flex-col gap-2 mx-auto pt-2">
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1.5 md:gap-2">
                    {row.map((key, keyIndex) => {
                        let content = key;
                        let widthClass = "flex-1 max-w-[40px] md:max-w-[48px]"; 
                        let colorClass = "bg-white/5 border-white/10 text-white hover:bg-white/10 active:bg-white/20";

                        if (key === "⌫") {
                            content = <Delete size={20} className="mx-auto" />;
                            widthClass = "flex-[1.5] max-w-[64px]";
                            colorClass = "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20";
                        } else if (key === "⇧") {
                            content = <ArrowUp size={20} className="mx-auto" />;
                            widthClass = "flex-[1.5] max-w-[64px]";
                            colorClass = isShift ? "bg-white text-slate-900" : "bg-slate-700/50 border-slate-600/50 text-slate-300";
                        } else if (key === "?123" || key === "ABC" || key === "#+=") {
                            widthClass = "flex-[1.5] max-w-[64px] text-xs md:text-sm font-semibold";
                            colorClass = "bg-slate-700/50 border-slate-600/50 text-slate-300";
                        } else if (key === "space") {
                            content = "";
                            widthClass = "flex-[4]"; // Spacebar width
                            colorClass = "bg-white/5 border-white/10 hover:bg-white/10 active:bg-white/20";
                        } else if (key === "Submit") {
                            content = disabled ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                inputLength >= 3 ? <span className="font-bold flex items-center justify-center gap-1">Enter<CornerDownLeft size={16}/></span> : "Enter"
                            );
                            widthClass = "flex-[2] max-w-[90px] text-sm";
                            colorClass = inputLength >= 3 && !disabled
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500/30 text-white shadow-[0_4px_0_rgba(37,99,235,0.4)] active:shadow-[0_0px_0_rgba(37,99,235,0.4)]"
                                : "bg-slate-800/80 border-white/5 text-slate-500 cursor-not-allowed";
                        } else {
                            content = isShift && mode === "alpha" ? key.toUpperCase() : key;
                            colorClass += " font-medium text-lg md:text-xl shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-[0_0px_0_rgba(0,0,0,0.2)]";
                        }

                        // Add shared button transition styles
                        if (key !== "Submit" || disabled) {
                           colorClass += " active:translate-y-1";
                        } else if (!disabled) {
                           colorClass += " active:translate-y-1";
                        }

                        return (
                            <motion.button
                                key={`${rowIndex}-${keyIndex}`}
                                whileTap={disabled && key === "Submit" ? {} : { scale: 0.95 }}
                                onClick={() => handleKey(key)}
                                disabled={disabled && key !== "Submit"}
                                className={`h-11 md:h-14 rounded-xl border flex items-center justify-center transition-all select-none ${widthClass} ${colorClass}`}
                            >
                                {content}
                            </motion.button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};


export default function PublicAttendance() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null); // { success, message, student, logged_at }
    const [manualId, setManualId] = useState("");
    const [validationError, setValidationError] = useState("");
    const [scannerFlash, setScannerFlash] = useState(false); // flash when QR scan is detected
    const isMounted = useRef(true);
    const lastScannedRef = useRef(null);
    const hiddenInputRef = useRef(null);
    const manualInputRef = useRef(null);

    // Keep hidden input focused at all times for QR/barcode scanner
    useEffect(() => {
        isMounted.current = true;

        const focusHiddenInput = () => {
            // Only steal focus if user is NOT focused on the manual input
            if (hiddenInputRef.current && !isLoading && !result) {
                const active = document.activeElement;
                if (active !== manualInputRef.current) {
                    hiddenInputRef.current.focus();
                }
            }
        };

        focusHiddenInput();

        const handleClick = (e) => {
            // Don't steal focus if user clicked on the manual input area
            const isManualArea = e.target.closest('[data-manual-input-area]');
            if (!isManualArea) {
                focusHiddenInput();
            }
        };

        document.addEventListener("click", handleClick);

        // Periodic re-focus, but respect manual input focus
        const interval = setInterval(() => {
            const active = document.activeElement;
            if (active !== manualInputRef.current) {
                focusHiddenInput();
            }
        }, 1000);

        return () => {
            isMounted.current = false;
            document.removeEventListener("click", handleClick);
            clearInterval(interval);
        };
    }, [isLoading, result]);

    // Auto-reset after scan/submit result
    useEffect(() => {
        if (result) {
            const timer = setTimeout(() => {
                resetState();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [result]);

    // Inject custom animations
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes gentle-pulse {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
            }
            .animate-gentle-pulse {
                animation: gentle-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes scanner-dot-pulse {
                0%, 100% { opacity: 0.5; box-shadow: 0 0 4px rgba(34, 197, 94, 0.3); }
                50% { opacity: 1; box-shadow: 0 0 12px rgba(34, 197, 94, 0.6); }
            }
            .animate-scanner-dot {
                animation: scanner-dot-pulse 2s ease-in-out infinite;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // --- Shared Attendance Submit Logic ---
    const submitAttendance = useCallback(async (studentId, source = "manual") => {
        const trimmed = studentId.trim();
        if (!trimmed) return;
        if (!isMounted.current) return;

        if (navigator.vibrate) navigator.vibrate(200);
        setIsLoading(true);
        setValidationError("");

        // Flash the scanner indicator when QR scan is detected
        if (source === "scan") {
            setScannerFlash(true);
            setTimeout(() => setScannerFlash(false), 800);
        }

        try {
            const response = await axiosClient.post('/public/attendance', { student_id: trimmed });
            if (isMounted.current) {
                setResult(response.data);
                playSound('success');
            }
        } catch (err) {
            console.error("Attendance error:", err);
            if (isMounted.current) {
                const errorData = err.response?.data || { success: false, message: "Failed to log attendance." };
                setResult(errorData);
                playSound(errorData.student ? 'warning' : 'error');
            }
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    // Handle USB scanner input (keyboard emulation)
    const handleScannerKeyDown = async (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();

        const scannedValue = event.target.value.trim();
        event.target.value = '';

        if (!scannedValue) return;
        if (!isMounted.current) return;
        if (lastScannedRef.current === scannedValue) return;
        lastScannedRef.current = scannedValue;

        await submitAttendance(scannedValue, "scan");
    };

    // Handle manual ID submission
    const handleManualSubmit = async () => {
        if (manualId.trim().length < 3) {
            setValidationError("Please enter at least 3 characters.");
            return;
        }
        if (lastScannedRef.current === manualId.trim()) {
            setValidationError("Already submitted. Please wait.");
            return;
        }
        lastScannedRef.current = manualId.trim();
        await submitAttendance(manualId, "manual");
    };

    const handleManualKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleManualSubmit();
        }
    };

    // Numpad handlers
    const handleNumpadInput = (char) => {
        setValidationError("");
        setManualId((prev) => prev + char);
    };
    const handleNumpadBackspace = () => {
        setValidationError("");
        setManualId((prev) => prev.slice(0, -1));
    };

    // Simple sound feedback using Web Audio API
    const playSound = (type) => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (type === 'success') {
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
            } else if (type === 'warning') {
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
            } else {
                oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }
        } catch (e) { console.warn('Audio playback failed:', e); }
    };

    const resetState = () => {
        setResult(null);
        setManualId("");
        setValidationError("");
        lastScannedRef.current = null;
    };

    const getProfileImage = (student) => {
        if (student?.profile_picture_url) return student.profile_picture_url;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'Student')}&background=00008B&color=fff&size=200&bold=true`;
    };

    return (
        <KioskLayout>
            {/* Hidden input for USB hardware scanner — always active in background */}
            <input
                ref={hiddenInputRef}
                type="text"
                className="opacity-0 absolute -z-10 w-0 h-0"
                onKeyDown={handleScannerKeyDown}
                autoFocus
                tabIndex={-1}
                aria-hidden="true"
            />

            <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600/30 to-indigo-600/30 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-6 border border-white/10 backdrop-blur-md">
                        <ScanLine className="text-blue-400" size={48} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Attendance Log</h1>
                    <p className="text-blue-200 text-lg max-w-lg mx-auto leading-relaxed">
                        Scan your QR code or enter your Student ID to check in.
                    </p>
                </motion.div>

                {/* Unified Attendance Card */}
                <GlassCard className="max-w-2xl w-full mx-auto relative group">
                    {/* Decorative Glow Lines */}
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    <div className="relative p-1" style={{ minHeight: "540px" }}>

                        {/* ============ MAIN CONTENT (visible when no result) ============ */}
                        {!result && (
                            <div className="p-6 rounded-[1.8rem] bg-gradient-to-br from-slate-900 to-slate-800 border-4 border-slate-800 shadow-2xl relative">

                                {/* --- QR Scanner Status Indicator --- */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 mb-6 ${
                                        scannerFlash
                                            ? "bg-blue-500/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                            : "bg-white/[0.03] border-white/[0.06]"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                                                scannerFlash
                                                    ? "bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                                                    : "bg-white/5"
                                            }`}>
                                                <ScanLine size={20} className={`transition-colors duration-300 ${scannerFlash ? "text-blue-300" : "text-slate-400"}`} />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-tight">QR / Barcode Scanner</p>
                                            <p className="text-xs text-slate-500 leading-tight mt-0.5">Hardware scanner is always ready</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-scanner-dot" />
                                        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Active</span>
                                    </div>
                                </motion.div>

                                {/* --- OR Divider --- */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                                    <span className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] px-2">or enter manually</span>
                                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
                                </div>

                                {/* --- Manual Student ID Input --- */}
                                <div className="mb-6" data-manual-input-area>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">
                                        Student ID Number
                                    </label>
                                    <div className="relative group/input">
                                        {/* Input Glow */}
                                        <div className={`absolute -inset-0.5 rounded-2xl transition-all duration-500 ${
                                            manualId.length >= 3
                                                ? "bg-gradient-to-r from-blue-600/40 to-indigo-600/40 blur-sm opacity-100"
                                                : "bg-transparent opacity-0"
                                        }`} />

                                        <div className="relative flex items-center bg-slate-800/80 border-2 border-white/10 rounded-2xl overflow-hidden transition-all duration-300 focus-within:border-blue-500/50 group-hover/input:border-white/20">
                                            <div className="flex items-center justify-center w-14 h-14 border-r border-white/5">
                                                <Hash size={20} className="text-blue-400" />
                                            </div>
                                            <input
                                                ref={manualInputRef}
                                                type="text"
                                                value={manualId}
                                                onChange={(e) => {
                                                    setManualId(e.target.value);
                                                    setValidationError("");
                                                }}
                                                onKeyDown={handleManualKeyDown}
                                                placeholder="e.g. 2024-00123"
                                                disabled={isLoading}
                                                className="flex-1 bg-transparent text-white text-xl font-bold tracking-wider px-4 py-4 h-14 placeholder:text-slate-600 placeholder:font-normal placeholder:tracking-normal focus:outline-none disabled:opacity-50"
                                                autoComplete="off"
                                            />
                                            {manualId && !isLoading && (
                                                <motion.button
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    onClick={() => { setManualId(""); setValidationError(""); }}
                                                    className="flex items-center justify-center w-10 h-10 mr-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                                >
                                                    <XCircle size={18} />
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Validation Error */}
                                    <AnimatePresence>
                                        {validationError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                className="flex items-center gap-2 mt-3 text-red-400 text-sm font-medium"
                                            >
                                                <AlertCircle size={14} />
                                                <span>{validationError}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Character Counter */}
                                    <div className="flex items-center justify-between mt-3">
                                        <p className="text-slate-600 text-xs">
                                            {manualId.length > 0
                                                ? <span className={manualId.length >= 3 ? "text-emerald-400" : "text-amber-400"}>{manualId.length} characters entered</span>
                                                : "Use the numpad or keyboard to type"
                                            }
                                        </p>
                                        {manualId.length > 0 && manualId.length < 3 && (
                                            <span className="text-amber-400/60 text-xs font-medium">Min 3 chars</span>
                                        )}
                                    </div>
                                </div>

                                {/* --- Keyboard Divider --- */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                                    <span className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">Virtual Keyboard</span>
                                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
                                </div>

                                {/* --- Virtual Keyboard --- */}
                                <VirtualKeyboard
                                    onInput={handleNumpadInput}
                                    onBackspace={handleNumpadBackspace}
                                    onSubmit={handleManualSubmit}
                                    disabled={isLoading}
                                    inputLength={manualId.trim().length}
                                />

                                {/* --- Loading Overlay --- */}
                                <AnimatePresence>
                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center backdrop-blur-md rounded-[1.8rem] z-20"
                                        >
                                            <motion.div
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
                                                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                                </div>
                                                <p className="text-white font-bold text-lg mb-1">Verifying Student ID</p>
                                                <p className="text-blue-400 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Please wait...</p>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* ============ RESULT OVERLAY ============ */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="rounded-[1.8rem] bg-gradient-to-br from-slate-900 to-slate-800 border-4 border-slate-800 shadow-2xl"
                                    style={{ minHeight: "530px" }}
                                >
                                    <div className="flex flex-col items-center justify-center p-8 h-full" style={{ minHeight: "530px" }}>
                                        {result.success ? (
                                            <div className="text-center w-full">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                                                    className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5"
                                                >
                                                    <CheckCircle className="text-green-400" size={48} />
                                                </motion.div>

                                                <motion.img
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    src={getProfileImage(result.student)}
                                                    alt="Profile"
                                                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-green-500/30 shadow-2xl"
                                                />

                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.25 }}
                                                >
                                                    <h2 className="text-2xl font-bold text-white mb-1">{result.student?.name}</h2>
                                                    <div className="inline-block bg-white/10 px-3 py-1 rounded-full mb-5">
                                                        <p className="text-slate-300 font-mono text-xs tracking-widest">{result.student?.student_id}</p>
                                                    </div>
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="bg-green-500/10 border border-green-500/20 rounded-xl px-6 py-3"
                                                >
                                                    <p className="text-green-400 font-bold text-sm tracking-wide uppercase">✓ Logged at {result.logged_at}</p>
                                                </motion.div>
                                            </div>
                                        ) : (
                                            <div className="text-center w-full">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                >
                                                    <XCircle className="text-amber-500 mx-auto mb-6" size={64} />
                                                </motion.div>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.15 }}
                                                >
                                                    <h2 className="text-xl font-bold text-white mb-2">{result.message}</h2>
                                                    {result.student && (
                                                        <div className="bg-white/5 rounded-xl p-4 mt-4">
                                                            <p className="text-slate-300 font-medium">{result.student.name}</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </div>
                                        )}

                                        {/* Progress bar & auto-reset countdown */}
                                        <div className="mt-auto w-full pt-6">
                                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: "100%" }}
                                                    animate={{ width: "0%" }}
                                                    transition={{ duration: 3, ease: "linear" }}
                                                    className="h-full bg-blue-500 rounded-full"
                                                />
                                            </div>
                                            <p className="text-center text-slate-500 text-xs mt-3 font-mono">Auto-resetting...</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </GlassCard>
            </div>
        </KioskLayout>
    );
}
