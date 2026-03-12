import { useState, useEffect, useRef } from "react";
import {
    Menu, Library, Bell, LogOut,
    ChevronDown, User, Calendar
} from "lucide-react";

export default function TopNavHeader({
    userName,
    onLogout,
    onMenuToggle,
    notificationCount = 0
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef(null);

    // Update date every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-4 lg:px-6 shadow-lg"
            style={{ backgroundColor: '#020463' }}
        >
            {/* Left Side - Branding */}
            <div className="flex items-center gap-3">
                {/* Menu Toggle Button (Mobile) */}
                <button
                    onClick={onMenuToggle}
                    className="p-2 rounded-lg text-white/80 hover:text-white transition-all duration-200 lg:hidden"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1c7a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label="Toggle Menu"
                >
                    <Menu size={24} />
                </button>

                {/* Logo & Title */}
                <div className="flex items-center gap-3">
                    <div className="bg-white/15 p-2 rounded-lg backdrop-blur-sm border border-white/20">
                        <Library size={24} className="text-white" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-white font-bold text-lg leading-tight">
                            Library Management System
                        </h1>
                        <p className="text-white/80 text-xs font-medium">PCLU Admin Dashboard</p>
                    </div>
                    {/* Mobile - Only show short title */}
                    <span className="sm:hidden text-white font-bold text-base">LMS</span>
                </div>
            </div>

            {/* Right Side - User Controls */}
            <div className="flex items-center gap-2 lg:gap-4">
                {/* Date Display */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-white/90 text-sm border border-white/10">
                    <Calendar size={16} className="text-white/70" />
                    <span className="font-medium">{formatDate(currentDate)}</span>
                </div>

                {/* Notifications */}
                <button
                    className="relative p-2 rounded-lg text-white/80 hover:text-white transition-all duration-200"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1c7a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label="Notifications"
                >
                    <Bell size={22} />
                    {notificationCount > 0 && (
                        <span
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold rounded-full px-1 shadow-lg"
                            style={{ backgroundColor: '#4a4cff', color: 'white' }}
                        >
                            {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                    )}
                </button>

                {/* User Profile Dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-white transition-all duration-200"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1c7a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {/* Avatar Circle */}
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                            <User size={18} className="text-white" />
                        </div>
                        <span className="hidden sm:block font-semibold text-sm max-w-[100px] truncate text-white">
                            {userName || 'Admin'}
                        </span>
                        <ChevronDown
                            size={16}
                            className={`text-white/70 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fadeIn overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-bold text-gray-800 truncate">{userName || 'Admin'}</p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowUserMenu(false);
                                    onLogout();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                                style={{ color: '#020463' }}
                            >
                                <LogOut size={18} />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Logout Button (visible on larger screens) */}
                <button
                    onClick={onLogout}
                    className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white transition-all duration-200 border border-white/20"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1c7a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label="Logout"
                >
                    <LogOut size={20} />
                </button>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
        </header>
    );
}
