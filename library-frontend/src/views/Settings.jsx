import { useState, useEffect, useCallback } from "react";
import {
    Settings as SettingsIcon,
    Save,
    Database,
    Activity,
    Wifi,
    WifiOff,
    Server,
    CheckCircle,
    RefreshCw,
    Info,
    Clock,
    DollarSign,
    BookOpen,
    Users,
    Zap,
    BarChart3,
    TrendingUp,
    AlertCircle,
    FileText,
    History,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RotateCcw,
} from "lucide-react";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";
import axiosClient from "../axios-client";
import { useLibrarySettings } from "../context/LibrarySettingsContext";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import Pagination from "../components/ui/Pagination";

export default function Settings() {
    const toast = useToast();
    const { refreshSettings: refreshGlobalSettings } = useLibrarySettings();
    const [activeSection, setActiveSection] = useState("library");
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    // System Health State
    const [systemHealth, setSystemHealth] = useState({
        overall: 0,
        api: { status: 'checking', latency: 0, lastCheck: null },
        database: { status: 'checking', tables: 0 },
        uptime: 0
    });

    // Library Statistics
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalCopies: 0,
        availableCopies: 0,
        borrowedCopies: 0,
        totalStudents: 0,
        activeLoans: 0,
        overdueLoans: 0,
        pendingFines: 0,
        paidFines: 0,
        todayLoans: 0,
        todayReturns: 0
    });

    // Activity Log
    const [recentActivity, setRecentActivity] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Library Settings - Now fetched from API
    const [librarySettings, setLibrarySettings] = useState({
        library_name: "PCLU Library System",
        default_loan_days: 7,
        max_loans_per_student: 3,
        fine_per_day: 5
    });
    const [originalSettings, setOriginalSettings] = useState(null);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsChanged, setSettingsChanged] = useState(false);

    // Statistics Range State
    const [newRange, setNewRange] = useState({ start: '', end: '', label: '' });
    const [statsPage, setStatsPage] = useState(1);
    const statsPerPage = 10;

    // Deletion Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, index: null });

    const handleStartChange = (e) => {
        const startVal = e.target.value;
        const updates = { start: startVal };

        // Auto-fill End and Label logic
        if (startVal && !isNaN(startVal) && startVal.trim() !== '') {
            const startNum = parseInt(startVal);
            // Default to 100-block size (e.g. 1000 -> 1099)
            updates.end = startNum + 99;
            updates.label = `${String(startNum).padStart(3, '0')}-${String(startNum + 99).padStart(3, '0')}`;
        }

        setNewRange(prev => ({ ...prev, ...updates }));
    };

    const handleAddRange = () => {
        if (!newRange.start || !newRange.end || !newRange.label) {
            toast.error("Please fill in all fields");
            return;
        }

        const start = parseInt(newRange.start);
        const end = parseInt(newRange.end);

        if (isNaN(start) || isNaN(end)) {
            toast.error("Invalid numbers");
            return;
        }

        if (start > end) {
            toast.error("Start cannot be greater than End");
            return;
        }

        const currentRanges = librarySettings.statistics_ranges || [];

        // Overlap Validation
        const hasOverlap = currentRanges.some(r =>
            (start >= r.start && start <= r.end) ||
            (end >= r.start && end <= r.end) ||
            (start <= r.start && end >= r.end)
        );

        if (hasOverlap) {
            toast.error("Range overlaps with an existing range");
            return;
        }

        const updatedRanges = [...currentRanges, {
            start,
            end,
            label: newRange.label
        }].sort((a, b) => a.start - b.start);

        updateSetting('statistics_ranges', updatedRanges);
        setNewRange({ start: '', end: '', label: '' });
        toast.success("Range added");
    };

    const handleRemoveRange = (index) => {
        setDeleteModal({ isOpen: true, index });
    };

    const confirmDeleteRange = () => {
        if (deleteModal.index === null) return;

        const currentRanges = librarySettings.statistics_ranges || [];
        const updatedRanges = currentRanges.filter((_, i) => i !== deleteModal.index);
        updateSetting('statistics_ranges', updatedRanges);
        toast.success("Range removed");
        setDeleteModal({ isOpen: false, index: null });
    };



    const handleQuickAdd = () => {
        const currentRanges = librarySettings.statistics_ranges || [];
        let nextStart = 0;

        if (currentRanges.length > 0) {
            const maxEnd = Math.max(...currentRanges.map(r => r.end));
            nextStart = maxEnd + 1;
        }

        const nextEnd = nextStart + 99;
        setNewRange({
            start: nextStart.toString(),
            end: nextEnd.toString(),
            label: `${String(nextStart).padStart(3, '0')}-${String(nextEnd).padStart(3, '0')}`
        });
    };

    // Fetch settings from API on mount
    const fetchSettings = useCallback(async () => {
        setSettingsLoading(true);
        try {
            const res = await axiosClient.get('/settings');
            if (res.data?.success && res.data?.settings) {
                const settings = res.data.settings;
                setLibrarySettings(settings);
                setOriginalSettings(settings);
                setSettingsChanged(false);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings. Using defaults.');
        } finally {
            setSettingsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Removed toast dependency - it was causing infinite re-renders

    // Fetch all data on mount and setup auto-refresh
    useEffect(() => {
        fetchSettings();
        refreshAllData();
        const interval = setInterval(refreshAllData, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount - fetchSettings is stable now

    const refreshAllData = useCallback(async () => {
        await Promise.all([
            checkSystemHealth(),
            fetchDetailedStats(),
            fetchRecentActivity()
        ]);
        setLastRefresh(new Date());
    }, []);

    const checkSystemHealth = async () => {
        const startTime = Date.now();
        let healthScore = 0;
        let apiStatus = 'offline';
        let dbStatus = 'offline';
        let latency = 0;
        let tableCount = 0;

        try {
            const res = await axiosClient.get('/books');
            latency = Date.now() - startTime;

            if (latency < 300) {
                apiStatus = 'excellent';
                healthScore += 35;
            } else if (latency < 800) {
                apiStatus = 'good';
                healthScore += 30;
            } else {
                apiStatus = 'slow';
                healthScore += 20;
            }

            dbStatus = 'connected';
            tableCount = 8;
            healthScore += 35;

            const booksData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            if (booksData.length > 0) {
                healthScore += 30;
            } else {
                healthScore += 15;
            }

        } catch (error) {
            if (error.code === 'ERR_NETWORK') {
                apiStatus = 'offline';
                dbStatus = 'unknown';
            } else if (error.response) {
                apiStatus = 'error';
                dbStatus = 'connected';
                healthScore += 20;
            }
        }

        setSystemHealth({
            overall: Math.min(healthScore, 100),
            api: {
                status: apiStatus,
                latency,
                lastCheck: new Date().toLocaleTimeString()
            },
            database: { status: dbStatus, tables: tableCount },
            uptime: Math.floor((Date.now() - window.performance.timing.navigationStart) / 1000 / 60)
        });
    };

    const fetchDetailedStats = async () => {
        try {
            const [booksRes, studentsCountRes, transactionsRes] = await Promise.all([
                axiosClient.get('/books').catch(() => ({ data: [] })),
                axiosClient.get('/students/count').catch(() => ({ data: { count: 0 } })),
                axiosClient.get('/transactions').catch(() => ({ data: [] }))
            ]);

            const books = Array.isArray(booksRes.data) ? booksRes.data : (booksRes.data?.data || []);
            const studentCount = studentsCountRes.data?.count || 0;
            const transactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : (transactionsRes.data?.data || []);

            const today = new Date().toDateString();

            const totalCopies = books.reduce((sum, b) => sum + (b.total_copies || 1), 0);
            const availableCopies = books.reduce((sum, b) => sum + (b.available_copies || 0), 0);

            const activeLoans = transactions.filter(t => !t.returned_at);
            const overdueLoans = activeLoans.filter(t => {
                if (!t.due_date) return false;
                return new Date(t.due_date) < new Date();
            });

            const finesData = transactions.filter(t => t.penalty_amount && parseFloat(t.penalty_amount) > 0);
            const pendingFines = finesData
                .filter(t => t.payment_status === 'pending')
                .reduce((sum, t) => sum + parseFloat(t.penalty_amount || 0), 0);
            const paidFines = finesData
                .filter(t => t.payment_status === 'paid')
                .reduce((sum, t) => sum + parseFloat(t.penalty_amount || 0), 0);

            const todayLoans = transactions.filter(t =>
                new Date(t.borrowed_at).toDateString() === today
            ).length;

            const todayReturns = transactions.filter(t =>
                t.returned_at && new Date(t.returned_at).toDateString() === today
            ).length;

            setStats({
                totalBooks: books.length,
                totalCopies,
                availableCopies,
                borrowedCopies: totalCopies - availableCopies,
                totalStudents: studentCount,
                activeLoans: activeLoans.length,
                overdueLoans: overdueLoans.length,
                pendingFines,
                paidFines,
                todayLoans,
                todayReturns
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchRecentActivity = async () => {
        try {
            const res = await axiosClient.get('/transactions');
            const transactions = Array.isArray(res.data) ? res.data : (res.data?.data || []);

            const recent = transactions
                .sort((a, b) => new Date(b.updated_at || b.borrowed_at) - new Date(a.updated_at || a.borrowed_at))
                .map(t => ({
                    id: t.id,
                    type: t.returned_at ? 'return' : 'borrow',
                    book: t.book_asset?.book_title?.title || 'Unknown Book',
                    user: t.user?.name || 'Unknown',
                    date: t.returned_at || t.borrowed_at,
                    hasOverdue: t.penalty_amount && parseFloat(t.penalty_amount) > 0
                }));

            setRecentActivity(recent);
        } catch (error) {
            console.error('Failed to fetch activity:', error);
        }
    };

    const handleSaveSettings = async () => {
        setSettingsSaving(true);
        try {
            const res = await axiosClient.put('/settings', librarySettings);
            if (res.data?.success) {
                toast.success("Settings saved successfully! Changes apply immediately.");
                setOriginalSettings(librarySettings);
                setSettingsChanged(false);
                // Refresh global settings context so sidebar/kiosk update immediately
                refreshGlobalSettings();
            } else {
                throw new Error(res.data?.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            const msg = error.response?.data?.message || error.response?.data?.errors || "Failed to save settings";
            toast.error(typeof msg === 'object' ? JSON.stringify(msg) : msg);
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleResetSettings = async () => {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) return;

        setSettingsSaving(true);
        try {
            const res = await axiosClient.post('/settings/reset');
            if (res.data?.success && res.data?.settings) {
                setLibrarySettings(res.data.settings);
                setOriginalSettings(res.data.settings);
                setSettingsChanged(false);
                // Refresh global settings context
                refreshGlobalSettings();
            }
            toast.success("Settings reset to defaults");
        } catch (error) {
            toast.error("Failed to reset settings");
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleCancelChanges = () => {
        if (originalSettings) {
            setLibrarySettings(originalSettings);
            setSettingsChanged(false);
        }
    };

    const updateSetting = (key, value) => {
        setLibrarySettings(prev => ({ ...prev, [key]: value }));
        setSettingsChanged(true);
    };

    const handleExportCSV = async (type) => {
        setLoading(true);
        try {
            const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
            const res = await axiosClient.get(`/reports/export/${type}`, {
                responseType: 'blob',
            });

            if (!res.data || res.data.size === 0) {
                toast.warning('No data available to export');
                setLoading(false);
                return;
            }

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success(`${type} export downloaded successfully`);
        } catch (error) {
            toast.error(`Failed to export ${type}`);
        }
        setLoading(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'excellent': return 'text-emerald-500';
            case 'good': return 'text-green-500';
            case 'connected': return 'text-emerald-500';
            case 'slow': return 'text-amber-500';
            case 'checking': return 'text-blue-500';
            default: return 'text-red-500';
        }
    };

    const getStatusBg = (status) => {
        switch (status) {
            case 'excellent': case 'good': case 'connected': return 'bg-emerald-100';
            case 'slow': return 'bg-amber-100';
            case 'checking': return 'bg-blue-100';
            default: return 'bg-red-100';
        }
    };

    const getHealthGradient = (score) => {
        if (score >= 80) return 'from-emerald-500 to-green-400';
        if (score >= 50) return 'from-amber-500 to-yellow-400';
        return 'from-red-500 to-orange-400';
    };

    const SectionButton = ({ id, label, icon: Icon, badge }) => (
        <button
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left
        ${activeSection === id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} />
                {label}
            </div>
            {badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeSection === id ? 'bg-white/20 text-white' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    }`}>
                    {badge}
                </span>
            )}
        </button>
    );

    const StatCard = ({ icon: Icon, label, value, subValue, color = 'blue' }) => {
        const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
            emerald: 'from-emerald-500 to-emerald-600',
            amber: 'from-amber-500 to-amber-600',
            red: 'from-red-500 to-red-600',
            purple: 'from-purple-500 to-purple-600',
            indigo: 'from-indigo-500 to-indigo-600'
        };

        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{label}</p>
                        <p className="text-3xl font-black text-gray-800 dark:text-white mt-1">{value}</p>
                        {subValue && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{subValue}</p>}
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
                        <Icon size={22} className="text-white" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 bg-gray-50 dark:bg-slate-900 p-8 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg shadow-primary-600/30">
                        <SettingsIcon size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white">System Settings</h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={refreshAllData}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium text-sm shadow-lg shadow-primary-600/30"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full lg:w-56 flex-shrink-0">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 space-y-1">
                        <SectionButton id="library" label="Configuration" icon={BookOpen} />
                        <SectionButton id="statistics" label="Statistics Ranges" icon={BarChart3} />
                        <SectionButton id="data" label="Data Export" icon={Database} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 min-h-[650px]">

                        {/* LIBRARY CONFIG */}

                        {activeSection === "library" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <BookOpen size={20} className="text-primary-500" />
                                        Library Configuration
                                    </h3>
                                    {settingsChanged && (
                                        <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full font-medium animate-pulse">
                                            Unsaved changes
                                        </span>
                                    )}
                                </div>

                                {settingsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 size={32} className="animate-spin text-primary-500" />
                                        <span className="ml-3 text-gray-500">Loading settings...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Info Banner */}
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                                    <p className="font-medium">These settings control library operations</p>
                                                    <p className="text-blue-600 dark:text-blue-300 mt-1">Student and Faculty settings are managed separately. Changes apply to new transactions only.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Library Name - Shared Setting */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Library Name</label>
                                            <input
                                                type="text"
                                                value={librarySettings.library_name || ''}
                                                onChange={(e) => updateSetting('library_name', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        {/* Role-Based Settings Tabs */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Student Settings */}
                                            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50">
                                                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                                                    <Users size={18} />
                                                    Student Settings
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                                            <Clock size={14} /> Loan Period (days)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1" max="365"
                                                            value={librarySettings.default_loan_days || 7}
                                                            onChange={(e) => updateSetting('default_loan_days', parseInt(e.target.value) || 7)}
                                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                                            <BookOpen size={14} /> Max Loans
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1" max="20"
                                                            value={librarySettings.max_loans_per_student || 3}
                                                            onChange={(e) => updateSetting('max_loans_per_student', parseInt(e.target.value) || 3)}
                                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                                            <DollarSign size={14} /> Fine Per Day (₱)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0" max="1000"
                                                            value={librarySettings.fine_per_day || 5}
                                                            onChange={(e) => updateSetting('fine_per_day', parseInt(e.target.value) || 5)}
                                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Faculty Settings */}
                                            <div className="p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50">
                                                <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-4 flex items-center gap-2">
                                                    <Users size={18} />
                                                    Faculty Settings
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                                            <Clock size={14} /> Loan Period (days)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1" max="365"
                                                            value={librarySettings.faculty_loan_days || 14}
                                                            onChange={(e) => updateSetting('faculty_loan_days', parseInt(e.target.value) || 14)}
                                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                                            <BookOpen size={14} /> Max Loans
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1" max="20"
                                                            value={librarySettings.max_loans_per_faculty || 5}
                                                            onChange={(e) => updateSetting('max_loans_per_faculty', parseInt(e.target.value) || 5)}
                                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Current Active Settings Summary */}
                                        <div className="mt-6 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                                            <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
                                                <CheckCircle size={16} />
                                                Active Settings Summary
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-center">
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                    <div className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate">
                                                        {librarySettings.library_name || 'Library'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Library</div>
                                                </div>
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow-sm">
                                                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                        {librarySettings.default_loan_days || 7}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Student Days</div>
                                                </div>
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow-sm">
                                                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                        {librarySettings.max_loans_per_student || 3}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Student Max</div>
                                                </div>
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow-sm">
                                                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                        ₱{librarySettings.fine_per_day || 5}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Student Fine</div>
                                                </div>
                                                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg shadow-sm">
                                                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                                        {librarySettings.faculty_loan_days || 14}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Faculty Days</div>
                                                </div>
                                                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg shadow-sm">
                                                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                                        {librarySettings.max_loans_per_faculty || 5}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Faculty Max</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                                            <Button
                                                onClick={handleSaveSettings}
                                                icon={settingsSaving ? Loader2 : Save}
                                                disabled={settingsSaving || !settingsChanged}
                                                className={settingsSaving ? 'opacity-75' : ''}
                                            >
                                                {settingsSaving ? 'Saving...' : 'Save Configuration'}
                                            </Button>
                                            {settingsChanged && (
                                                <button
                                                    onClick={handleCancelChanges}
                                                    disabled={settingsSaving}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-gray-200 dark:border-slate-600"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button
                                                onClick={handleResetSettings}
                                                disabled={settingsSaving}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                <RotateCcw size={16} />
                                                Reset to Defaults
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* STATISTICS RANGES CONFIG */}
                        {activeSection === "statistics" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <BarChart3 size={20} className="text-primary-500" />
                                        Statistics Ranges
                                    </h3>
                                    {settingsChanged && (
                                        <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full font-medium animate-pulse">
                                            Unsaved changes
                                        </span>
                                    )}
                                </div>

                                {/* Info Banner */}
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <Info size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-purple-800 dark:text-purple-200">
                                            <p className="font-medium">Configure call number ranges for reports</p>
                                            <p className="text-purple-600 dark:text-purple-300 mt-1">
                                                Define how borrowed books are categorized in the "Borrowing Trends" report.
                                                Ranges should not overlap. Example: 0-99, 100-199, etc.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Add New Range */}
                                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-200 dark:border-slate-600">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Add New Range</h4>
                                        <button
                                            onClick={handleQuickAdd}
                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                        >
                                            <TrendingUp size={14} />
                                            Quick Add Next
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <input
                                            type="number"
                                            placeholder="Start (e.g. 1000)"
                                            value={newRange.start}
                                            onChange={handleStartChange}
                                            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-sm"
                                        />
                                        <input
                                            type="number"
                                            placeholder="End (e.g. 1099)"
                                            value={newRange.end}
                                            onChange={(e) => setNewRange({ ...newRange, end: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Label (e.g. 1000-1099)"
                                            value={newRange.label}
                                            onChange={(e) => setNewRange({ ...newRange, label: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-sm"
                                        />
                                        <button
                                            onClick={handleAddRange}
                                            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                                        >
                                            Add Range
                                        </button>
                                    </div>
                                </div>

                                {/* Range List */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Active Ranges</h4>

                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(librarySettings.statistics_ranges || [])
                                            .slice((statsPage - 1) * statsPerPage, statsPage * statsPerPage)
                                            .map((range, index) => {
                                                // Calculate actual index in the full array for deletion
                                                const actualIndex = (statsPage - 1) * statsPerPage + index;
                                                return (
                                                    <div key={actualIndex} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm group">
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-white">{range.label}</p>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                                Call Numbers: {range.start} - {range.end}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveRange(actualIndex)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                        >
                                                            <AlertCircle size={16} className="rotate-45" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    {(librarySettings.statistics_ranges || []).length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-slate-400 italic">
                                            No ranges configured. Reports will be empty.
                                        </div>
                                    ) : (
                                        <Pagination
                                            currentPage={statsPage}
                                            totalItems={(librarySettings.statistics_ranges || []).length}
                                            itemsPerPage={statsPerPage}
                                            onPageChange={setStatsPage}
                                        />
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                                    <Button
                                        onClick={handleSaveSettings}
                                        icon={settingsSaving ? Loader2 : Save}
                                        disabled={settingsSaving || !settingsChanged}
                                        className={settingsSaving ? 'opacity-75' : ''}
                                    >
                                        {settingsSaving ? 'Saving...' : 'Save Configuration'}
                                    </Button>
                                    {settingsChanged && (
                                        <button
                                            onClick={handleCancelChanges}
                                            disabled={settingsSaving}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-gray-200 dark:border-slate-600"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* DATA EXPORT */}
                        {activeSection === "data" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Database size={20} className="text-primary-500" />
                                    Data Export
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => handleExportCSV('books')}
                                        disabled={loading}
                                        className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-200 dark:border-blue-700/50 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        <BookOpen size={36} className="text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-blue-800 text-lg">Export Books</p>
                                        <p className="text-sm text-blue-600 mt-1">{stats.totalBooks} records</p>
                                    </button>

                                    <button
                                        onClick={() => handleExportCSV('students')}
                                        disabled={loading}
                                        className="group p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        <Users size={36} className="text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-emerald-800 text-lg">Export Students</p>
                                        <p className="text-sm text-emerald-600 mt-1">{stats.totalStudents} records</p>
                                    </button>

                                    <button
                                        onClick={() => handleExportCSV('transactions')}
                                        disabled={loading}
                                        className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-2 border-purple-200 dark:border-purple-700/50 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        <FileText size={36} className="text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-purple-800 text-lg">Export Transactions</p>
                                        <p className="text-sm text-purple-600 mt-1">All history</p>
                                    </button>
                                </div>

                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-sm text-amber-800 dark:text-amber-200">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                        <p>Exports are generated as CSV files. Large datasets may take a moment to download.</p>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, index: null })}
                onConfirm={confirmDeleteRange}
                title="Delete Statistic Range"
                message="Are you sure you want to delete this range? This will affect how future reports are categorized."
                confirmText="Delete Range"
                isDanger={true}
            />
        </div>
    );
}
