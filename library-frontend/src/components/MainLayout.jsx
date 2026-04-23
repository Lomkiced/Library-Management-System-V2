import { AnimatePresence, motion } from "framer-motion";
import {
    BookOpen,
    Building2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileBarChart,
    History as HistoryIcon,
    LayoutDashboard,
    LogOut,
    Moon,
    PieChart,
    Repeat,
    Search,
    Settings as SettingsIcon,
    Sun,
    User,
    UserPlus,
    Users,
    X
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLibrarySettings } from "../context/LibrarySettingsContext";
import { useTheme } from "../context/ThemeContext";
import CommandPalette from "./CommandPalette";

// Digital Clock - Minimalist Typographic
function DigitalClock({ collapsed }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        return { time: `${hours}:${minutesStr}`, ampm };
    };

    const formatDate = (date) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const { time: timeStr, ampm } = formatTime(time);

    return (
        <div className={`flex items-center justify-center transition-all duration-300 ${collapsed ? 'py-4' : 'px-4 py-4'} border-b border-gray-100 dark:border-gray-800`}>
            {collapsed ? (
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-executive-accent tracking-tighter">{timeStr}</span>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">{ampm}</span>
                </div>
            ) : (
                <div className="w-full flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-gray-800 dark:text-white tracking-tighter leading-none">{timeStr} <span className="text-xs font-medium text-gray-400 uppercase ml-1">{ampm}</span></div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wide">{formatDate(time)}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MainLayout({ children, activeTab, setActiveTab, onLogout, userName, userRole = "Administrator" }) {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const { isDark, toggleTheme } = useTheme();
    const { libraryName, libraryShortName } = useLibrarySettings();

    // Determine initial section based on activeTab
    const getInitialSection = (tab) => {
        if (['dashboard', 'circulation', 'faculty-circulation'].includes(tab)) return 'workspace';
        if (['books', 'students', 'faculty', 'user-management'].includes(tab)) return 'management';
        if (['attendance-log', 'history', 'reports', 'department-analytics'].includes(tab)) return 'reports';
        return 'workspace';
    };

    const [openSection, setOpenSection] = useState(() => getInitialSection(activeTab));

    // Automatically open the section containing the active tab
    useEffect(() => {
        setOpenSection(getInitialSection(activeTab));
    }, [activeTab]);

    // Persist collapsed state
    useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState) setCollapsed(JSON.parse(savedState));
    }, []);

    const toggleSidebar = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    }

    const NavItem = ({ id, label, icon: Icon, isAction = false, onClick = null }) => (
        <button
            onClick={() => {
                if (onClick) onClick();
                else {
                    setActiveTab(id);
                    setMobileSidebarOpen(false);
                }
            }}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 mx-auto rounded-lg text-sm font-medium transition-all duration-200 group overflow-hidden whitespace-nowrap
            ${collapsed ? 'justify-center w-10 h-10 px-0' : ''}
            ${activeTab === id && !isAction
                    ? 'bg-executive-accent/10 text-executive-accent'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
            title={collapsed ? label : ''}
        >
            <div className={`relative z-10 flex-shrink-0 transition-colors duration-200 ${activeTab === id && !isAction ? 'text-executive-accent' : 'text-current'}`}>
                <Icon size={20} strokeWidth={1.5} />
            </div>

            {!collapsed && (
                <span className="relative z-10 truncate font-inter">
                    {label}
                </span>
            )}

            {/* Subtle Left Border for Active Item (Clean Look) */}
            {activeTab === id && !isAction && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-executive-accent rounded-r-full" />
            )}
        </button>
    );

    const NavGroup = ({ id, label, children }) => {
        const isOpen = openSection === id;
        
        return (
            <div className="space-y-0.5">
                {!collapsed ? (
                    <button 
                        onClick={() => setOpenSection(isOpen ? null : id)}
                        className="w-full flex items-center justify-between px-3 py-2 mb-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 uppercase tracking-widest transition-colors">
                            {label}
                        </span>
                        <motion.div
                            initial={false}
                            animate={{ rotate: isOpen ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-gray-400"
                        >
                            <ChevronRight size={14} />
                        </motion.div>
                    </button>
                ) : (
                    <div className="w-8 h-px bg-gray-200 dark:bg-gray-800 my-4 mx-auto" />
                )}
                
                <AnimatePresence initial={false}>
                    {(isOpen || collapsed) && (
                        <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden space-y-0.5"
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Sidebar Content Component
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-executive-800 border-r border-gray-200 dark:border-gray-800 relative z-20">
            {/* Header with Logo */}
            <div className={`h-16 flex items-center ${collapsed ? 'justify-center' : 'px-5'} border-b border-gray-100 dark:border-gray-800 transition-all duration-300`}>
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        <img src="/pclu-logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none tracking-tight truncate" title={libraryName}>{libraryName}</h1>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-semibold">College Library</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Digital Clock */}
            <DigitalClock collapsed={collapsed} />

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 px-3 space-y-6">
                <NavGroup id="workspace" label="Workspace">
                    <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
                    <NavItem id="circulation" label="Student Circulation" icon={Repeat} />
                    <NavItem id="faculty-circulation" label="Faculty Circulation" icon={Repeat} />
                </NavGroup>

                <NavGroup id="management" label="Management">
                    <NavItem id="books" label="Inventory" icon={BookOpen} />
                    <NavItem id="students" label="Students" icon={Users} />
                    <NavItem id="faculty" label="Faculty" icon={Building2} />
                    <NavItem id="user-management" label="Add User" icon={UserPlus} />
                </NavGroup>

                <NavGroup id="reports" label="Reports">
                    <NavItem id="attendance-log" label="Attendance Log" icon={ClipboardList} />
                    <NavItem id="history" label="Activity Logs" icon={HistoryIcon} />
                    <NavItem id="reports" label="Statistics" icon={FileBarChart} />
                    <NavItem id="department-analytics" label="Departments" icon={PieChart} />
                </NavGroup>
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-executive-900/50">
                <div className="space-y-1">
                    <NavItem id="settings" label="System Settings" icon={SettingsIcon} />

                    {/* Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        {!collapsed && <span>Collapse Sidebar</span>}
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${collapsed ? 'justify-center' : ''}`}
                        title="Toggle Theme"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-2 mx-1" />

                    {/* User Profile */}
                    <div className={`flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-executive-accent text-white flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-executive-800">
                            {userName ? userName.charAt(0).toUpperCase() : <User size={14} />}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{userName || 'Administrator'}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{userRole}</p>
                            </div>
                        )}
                        {!collapsed && (
                            <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Sign Out">
                                <LogOut size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-executive-50 dark:bg-executive-900 font-sans text-gray-900 dark:text-white transition-colors duration-300">
            <CommandPalette isOpen={commandOpen} setIsOpen={setCommandOpen} setActiveTab={setActiveTab} />

            <div className="flex w-full h-screen overflow-hidden">
                {/* SIDEBAR - Desktop (always visible) */}
                <motion.aside
                    initial={false}
                    animate={{ width: collapsed ? 72 : 260 }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                    className="hidden lg:block h-full shadow-xl shadow-gray-200/50 dark:shadow-none z-30"
                >
                    <SidebarContent />
                </motion.aside>

                {/* SIDEBAR - Mobile Overlay */}
                <AnimatePresence>
                    {mobileSidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="lg:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40"
                                onClick={() => setMobileSidebarOpen(false)}
                            />
                            <motion.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "tween", ease: "circOut", duration: 0.3 }}
                                className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 shadow-2xl"
                            >
                                <button
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className="absolute top-4 right-4 p-2 text-white bg-black/20 rounded-lg backdrop-blur-md z-50"
                                >
                                    <X size={20} />
                                </button>
                                <SidebarContent />
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 flex flex-col items-center justify-start overflow-hidden relative">
                    {/* Top Bar for Search Trigger (Desktop) */}
                    <div className="w-full h-16 bg-white/80 dark:bg-executive-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-10">
                        {/* Mobile Menu Trigger */}
                        <div className="lg:hidden flex items-center gap-3">
                            <button onClick={() => setMobileSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
                                <LayoutDashboard size={24} />
                            </button>
                            <span className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{libraryName}</span>
                        </div>

                        {/* Search Bar (Fake) */}
                        <button
                            onClick={() => setCommandOpen(true)}
                            className="hidden lg:flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-executive-900 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors w-96 border border-transparent hover:border-gray-300 dark:hover:border-gray-700"
                        >
                            <Search size={16} />
                            <span>Type to search...</span>
                            <div className="flex-1" />
                            <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-mono shadow-sm">Ctrl + K</kbd>
                        </button>

                        <div className="flex items-center gap-4">
                            {/* Add top-right actions here if needed */}
                        </div>
                    </div>

                    <div className="w-full flex-1 overflow-auto p-6 scroll-smooth">
                        <div className="max-w-7xl mx-auto w-full pb-16 relative">
                            {children}

                            {/* System Developer Watermark */}
                            <div className="absolute bottom-5 right-6 z-10 pointer-events-auto flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity duration-300 select-none">
                                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">System Developers</span>
                                <div className="w-px h-3 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 tracking-wider">MIKE CEDRICK DAÑOCUP &amp; JOHN VINCENT JOAQUIN</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
