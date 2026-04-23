import { Clock, Library, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useLibrarySettings } from "../context/LibrarySettingsContext";

// --- Kiosk Clock Component ---
function KioskClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutesStr} ${ampm}`;
    };

    return (
        <div className="flex items-center gap-2 text-blue-100 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
            <Clock size={16} className="text-blue-400" />
            <span className="font-bold font-mono tracking-wide text-sm">{formatTime(time)}</span>
        </div>
    );
}

// --- Animated Background Component (Reused from Login) ---
const KioskBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#0f172a]">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-cyan-500/10 rounded-full blur-[80px]" />
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
    </div>
);

const LibrarianAvatar = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleSpeak = () => {
        // Create audio object pointing to the file in public folder
        const audio = new Audio('/shush.mp3');

        // Handle visualization state
        setIsSpeaking(true);
        audio.play().catch(e => console.error("Audio play failed:", e));

        // Reset state when audio finishes
        audio.onended = () => setIsSpeaking(false);
    };

    return (
        <div className="fixed bottom-0 right-0 z-50 pointer-events-none">
            <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 80, damping: 15 }}
                className="relative w-64 h-64 md:w-80 md:h-80 mr-[-2rem] mb-[-2rem]" // Increased size & positioning
            >
                {/* Shared Floating Container */}
                <motion.div
                    animate={isSpeaking ? {
                        y: [0, -5, 0],
                        scale: [1, 1.05, 1]
                    } : {
                        y: [0, -10, 0]
                    }}
                    transition={isSpeaking ? {
                        duration: 0.3,
                        repeat: Infinity
                    } : {
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-full h-full relative"
                >
                    {/* Speech Bubble - Visible when speaking or initially */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0, x: 20, rotate: 10 }}
                        animate={{
                            opacity: 1,
                            scale: isSpeaking ? 1.1 : 1,
                            x: 0,
                            rotate: isSpeaking ? [0, -2, 2, 0] : 0
                        }}
                        transition={{
                            delay: isSpeaking ? 0 : 1.5,
                            type: "spring",
                            stiffness: 120
                        }}
                        className={`absolute -top-6 left-0 md:left-4 transform -translate-x-full bg-white text-slate-900 px-5 py-3 rounded-2xl rounded-br-sm shadow-[0_10px_30px_rgba(0,0,0,0.2)] border-2 ${isSpeaking ? 'border-red-400' : 'border-blue-100'} z-50 min-w-[140px] text-center pointer-events-auto transition-colors duration-300`}
                    >
                        <p className={`font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r ${isSpeaking ? 'from-red-600 to-orange-600' : 'from-blue-600 to-indigo-600'}`}>
                            {isSpeaking ? "SHHHHHH!" : "Please be quiet!"}
                        </p>
                        <div className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1">Library Zone</div>

                        {/* Bubble Triangle */}
                        <div className={`absolute -right-2 bottom-0 w-4 h-4 bg-white transform rotate-45 border-r border-b ${isSpeaking ? 'border-red-400' : 'border-blue-100'} transition-colors duration-300`}></div>
                    </motion.div>

                    {/* Avatar Image */}
                    <img
                        src="/librarian-avatar.png"
                        alt="Librarian"
                        onClick={handleSpeak}
                        className="w-full h-full object-contain filter drop-shadow-2xl hover:brightness-110 transition-all duration-300 cursor-pointer pointer-events-auto active:scale-95"
                        title="Click to Shush!"
                    />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default function KioskLayout({ children }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const currentPath = location.pathname;
    const { libraryName } = useLibrarySettings();

    // Mock User for Kiosk Demo removed

    return (
        <div className="min-h-screen font-sans flex flex-col relative overflow-x-hidden text-slate-200">
            {/* Background */}
            <KioskBackground />

            {/* Librarian Avatar (Fixed Right) */}
            <LibrarianAvatar />

            {/* FLOATING HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 md:px-8">
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl flex items-center justify-between"
                >
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="p-1 rounded-full group-hover:scale-105 transition-transform duration-300">
                            <img src="/pclu-logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        </div>
                        <div className="hidden md:block">
                            <h1 className="text-base lg:text-lg font-bold leading-tight text-white tracking-tight" title={libraryName}>{libraryName}</h1>
                            <p className="text-blue-300/70 text-[10px] font-bold tracking-widest uppercase">Student Kiosk</p>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-2">
                        <Link
                            to="/catalog"
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${currentPath === '/catalog'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Catalog
                        </Link>
                        <Link
                            to="/attendance"
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${currentPath === '/attendance'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Attendance
                        </Link>
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <KioskClock />



                        {/* Mobile Menu Toggle */}
                        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </motion.div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-24 relative z-10">
                {children}
            </main>

            {/* GLASS FOOTER */}
            <footer className="relative z-10 border-t border-white/5 bg-slate-900/40 backdrop-blur-md py-6 flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
                <p>{libraryName} • Secure Kiosk Environment</p>

                {/* System Developer Watermark */}
                <div className="mt-5 flex items-center justify-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-300 select-none">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">System Developers</span>
                    <div className="w-1 h-1 rounded-full bg-slate-500"></div>
                    <span className="text-[10px] font-bold text-slate-300 tracking-[0.1em]">MIKE CEDRICK DAÑOCUP &amp; JOHN VINCENT JOAQUIN</span>
                </div>
            </footer>
        </div>
    );
}
