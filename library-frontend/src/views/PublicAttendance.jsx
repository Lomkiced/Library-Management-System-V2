import { useState, useEffect, useRef } from "react";
import KioskLayout from "./KioskLayout";
import axiosClient from "../axios-client";
import { CheckCircle, XCircle, Loader2, ScanLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Glass Card Helper ---
const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden ${className}`}>
        {children}
    </div>
);

export default function PublicAttendance() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null); // { success, message, student, logged_at }
    const isMounted = useRef(true);
    const lastScannedRef = useRef(null);
    const hiddenInputRef = useRef(null);

    // Keep hidden input focused at all times
    useEffect(() => {
        isMounted.current = true;

        const focusInput = () => {
            if (hiddenInputRef.current && !isLoading && !result) {
                hiddenInputRef.current.focus();
            }
        };

        // Initial focus
        focusInput();

        // Re-focus on any click anywhere on the page
        const handleClick = () => focusInput();
        const handleFocusOut = () => {
            // Small delay to allow any intentional focus changes
            setTimeout(focusInput, 50);
        };

        document.addEventListener("click", handleClick);
        document.addEventListener("focusout", handleFocusOut);

        // Also re-focus on an interval to be extra safe
        const interval = setInterval(focusInput, 500);

        return () => {
            isMounted.current = false;
            document.removeEventListener("click", handleClick);
            document.removeEventListener("focusout", handleFocusOut);
            clearInterval(interval);
        };
    }, [isLoading, result]);

    // Auto-reset after scan
    useEffect(() => {
        if (result) {
            const timer = setTimeout(() => {
                resetScanner();
            }, 3000); // 3 seconds delay
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
            @keyframes scanner-sweep {
                0% { top: 20%; opacity: 0; }
                10% { opacity: 0.6; }
                90% { opacity: 0.6; }
                100% { top: 80%; opacity: 0; }
            }
            .animate-scanner-sweep {
                animation: scanner-sweep 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Handle USB scanner input (keyboard emulation)
    const handleKeyDown = async (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();

        const scannedValue = event.target.value.trim();
        event.target.value = ''; // Clear immediately for next scan

        if (!scannedValue) return;
        if (!isMounted.current) return;
        if (lastScannedRef.current === scannedValue) return; // Prevent duplicate
        lastScannedRef.current = scannedValue;

        if (navigator.vibrate) navigator.vibrate(200);

        setIsLoading(true);

        try {
            const response = await axiosClient.post('/public/attendance', { student_id: scannedValue });
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
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
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

    const resetScanner = () => {
        setResult(null);
        lastScannedRef.current = null;
        // Focus will be restored automatically by the useEffect
    };

    const getProfileImage = (student) => {
        if (student?.profile_picture_url) return student.profile_picture_url;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'Student')}&background=00008B&color=fff&size=200&bold=true`;
    };

    return (
        <KioskLayout>
            {/* Hidden input for USB hardware scanner */}
            <input
                ref={hiddenInputRef}
                type="text"
                className="opacity-0 absolute -z-10 w-0 h-0"
                onKeyDown={handleKeyDown}
                autoFocus
                tabIndex={-1}
                aria-hidden="true"
            />

            <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600/30 to-indigo-600/30 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-6 border border-white/10 backdrop-blur-md">
                        <ScanLine className="text-blue-400" size={48} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Attendance Log</h1>
                    <p className="text-blue-200 text-lg max-w-lg mx-auto leading-relaxed">
                        Present your Library ID Code to the scanner below to check in.
                    </p>
                </motion.div>

                {/* Scanner / Result Area */}
                <GlassCard className="max-w-md w-full mx-auto relative group">
                    {/* Decorative Glow */}
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    <div className="relative p-1">
                        {/* Static Scanner Ready Graphic */}
                        <div className={`p-0 rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 relative ${result ? 'invisible' : ''} shadow-2xl border-4 border-slate-800`}>
                            <div className="w-full aspect-square flex flex-col items-center justify-center relative">
                                {/* Decorative grid background */}
                                <div className="absolute inset-0 opacity-[0.03]"
                                    style={{
                                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                        backgroundSize: '30px 30px'
                                    }}
                                />

                                {/* Corner Brackets */}
                                <div className="absolute top-6 left-6 w-16 h-16 border-t-[3px] border-l-[3px] border-blue-500/40 rounded-tl-2xl" />
                                <div className="absolute top-6 right-6 w-16 h-16 border-t-[3px] border-r-[3px] border-blue-500/40 rounded-tr-2xl" />
                                <div className="absolute bottom-6 left-6 w-16 h-16 border-b-[3px] border-l-[3px] border-blue-500/40 rounded-bl-2xl" />
                                <div className="absolute bottom-6 right-6 w-16 h-16 border-b-[3px] border-r-[3px] border-blue-500/40 rounded-br-2xl" />

                                {/* Sweeping line */}
                                {!isLoading && !result && (
                                    <div className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-scanner-sweep" />
                                )}

                                {/* Pulsing icon */}
                                <div className="animate-gentle-pulse relative z-10">
                                    <div className="w-28 h-28 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.15)]">
                                        <ScanLine className="text-blue-400" size={56} />
                                    </div>
                                </div>

                                <p className="mt-6 text-slate-300 text-base font-semibold tracking-wide relative z-10">Ready to Scan</p>
                                <p className="mt-2 text-slate-500 text-sm max-w-[250px] text-center relative z-10">
                                    Please tap your ID on the scanner below.
                                </p>

                                {/* Loading Overlay */}
                                {isLoading && (
                                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm rounded-[1.5rem] z-20">
                                        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-3" />
                                        <p className="text-blue-400 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Processing...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Result Overlay */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-30 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 rounded-[1.8rem]"
                                >
                                    {result.success ? (
                                        <div className="text-center w-full">
                                            <motion.div
                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
                                            >
                                                <CheckCircle className="text-green-400" size={48} />
                                            </motion.div>

                                            <img src={getProfileImage(result.student)} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-green-500/30 shadow-2xl" />

                                            <h2 className="text-2xl font-bold text-white mb-1">{result.student?.name}</h2>
                                            <div className="inline-block bg-white/10 px-3 py-1 rounded-full mb-6">
                                                <p className="text-slate-300 font-mono text-xs tracking-widest">{result.student?.student_id}</p>
                                            </div>

                                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-6 py-3">
                                                <p className="text-green-400 font-bold text-sm tracking-wide uppercase">✓ Logged at {result.logged_at}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center w-full">
                                            <XCircle className="text-amber-500 mx-auto mb-6" size={64} />
                                            <h2 className="text-xl font-bold text-white mb-2">{result.message}</h2>
                                            {result.student && (
                                                <div className="bg-white/5 rounded-xl p-4 mt-4">
                                                    <p className="text-slate-300 font-medium">{result.student.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-auto w-full pt-8">
                                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 3, ease: "linear" }}
                                                className="h-full bg-blue-500"
                                            />
                                        </div>
                                        <p className="text-center text-slate-500 text-xs mt-3 font-mono">Auto-resetting...</p>
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
