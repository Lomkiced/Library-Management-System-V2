import { motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowRight, BookOpen, CheckCircle, ClipboardList, Copy, DollarSign, LayoutDashboard, Package, Repeat, Users } from "lucide-react";
import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import FlipBookCard from "../components/FlipBookCard";
import Leaderboard from "../components/Leaderboard";
import MostPopularBooks from "../components/MostPopularBooks";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import GlassCard from "../components/ui/GlassCard";
import Pagination from "../components/ui/Pagination";

// ... (imports remain the same)

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    titles: 0,
    copies: 0,
    copies_breakdown: null, // Initialize breakdown
    loans: 0,
    students: 0,
    todayAttendance: 0
  });

  const [availableBooks, setAvailableBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = () => {
      // Fetch stats
      axiosClient.get("/dashboard/stats")
        .then(({ data }) => setStats(prev => ({ ...prev, ...data })))
        .catch(err => console.error(err));

      // Fetch dashboard books
      axiosClient.get("/dashboard/books")
        .then(({ data }) => setAvailableBooks(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));

      // Fetch today's attendance count
      axiosClient.get("/attendance/today")
        .then(({ data }) => setStats(prev => ({ ...prev, todayAttendance: data.count || 0 })))
        .catch(err => console.debug("Attendance fetch:", err));
    };

    // Initial fetch
    fetchData();

    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 p-8 min-h-screen pb-24"
    >
      {/* Page Header is same */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg shadow-primary-900/20">
          <LayoutDashboard size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-slate-400">
            Dashboard
          </h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Overview of the library inventory and activities.</p>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title="Total Book Titles"
          value={stats.titles}
          icon={BookOpen}
          color="bg-blue-500"
          delay={0}
        />
        <DashboardStatCard
          title="Physical Copies"
          value={stats.copies}
          icon={Copy}
          color="bg-indigo-500"
          delay={0.1}
        />
        <DashboardStatCard
          title="Active Loans"
          value={stats.loans}
          icon={Repeat}
          color="bg-orange-500"
          delay={0.2}
          breakdown={stats.loans_breakdown} // Pass breakdown here
        />
        <DashboardStatCard
          title="Overdue Books"
          value={stats.overdue || 0}
          icon={AlertTriangle}
          color="bg-red-500"
          delay={0.3}
        />
        <DashboardStatCard
          title="Reg. Students"
          value={stats.students}
          icon={Users}
          color="bg-emerald-500"
          delay={0.4}
        />
        <DashboardStatCard
          title="Revenue Collected"
          value={`₱${Number(stats.collected_fines || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="bg-yellow-500"
          delay={0.5}
        />
        <DashboardStatCard
          title="Today's Visitors"
          value={stats.todayAttendance}
          icon={ClipboardList}
          color="bg-purple-500"
          delay={0.4}
        />
      </div>

      {/* PHYSICAL COPIES  BREAKDOWN — 4 Separate Status Boxes */}
      <PhysicalCopiesSection breakdown={stats.copies_breakdown} />

      {/* ... (rest of main content grid remains same) ... */}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <MostPopularBooks />
          <motion.div variants={itemVariants}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-slate-400">
                Recently Available Books
              </h3>
              <button onClick={() => setActiveTab && setActiveTab('books')} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 hover:scale-105 transition-transform flex items-center gap-1">
                View All Inventory <ArrowRight size={16} />
              </button>
            </div>

            {availableBooks.length === 0 ? (
              <GlassCard className="p-12 text-center text-gray-500 dark:text-slate-400 flex flex-col items-center justify-center">
                <BookOpen className="mb-4 opacity-20" size={56} />
                <p className="text-lg">No books currently available to display.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {availableBooks.map((book, index) => (
                  <FlipBookCard key={book.id} book={book} index={index} />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white"
          >
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Welcome Back!</h3>
              <p className="text-primary-100/90 text-sm leading-relaxed">
                You are logged in as Administrator. Use this command center to oversee library operations.
              </p>
            </div>
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          </motion.div>

          <Leaderboard />

          <GlassCard className="p-6 h-80">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Category Distribution</h3>
            <CategoryPieChart />
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardStatCard({ title, value, icon: Icon, color, delay, breakdown }) {
  // Check if this is the Active Loans card (has student/faculty breakdown)
  const isActiveLoans = breakdown && breakdown.student !== undefined && breakdown.faculty !== undefined;

  return (
    <GlassCard className="p-6 relative group overflow-hidden" delay={delay} hoverEffect={true}>
      <div className="flex items-center gap-4 relative z-10">
        <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-${color.replace('bg-', '')} shadow-sm transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{title}</p>

          {/* Custom Display for Active Loans (Student / Faculty) */}
          {isActiveLoans ? (
            <div className="flex items-baseline gap-3 mt-1">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{breakdown.student}</span>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Student</span>
              </div>
              <div className="text-gray-300 text-xl font-light">/</div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{breakdown.faculty}</span>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Faculty</span>
              </div>
            </div>
          ) : (
            /* Default Value Display */
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
              {value !== undefined ? value : "-"}
            </h3>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Physical Copies Section — 4 dedicated status boxes
 * Separates AVAIL, BORROWED, DAMAGED, LOST into distinct cards.
 */
function PhysicalCopiesSection({ breakdown }) {
  const bd = breakdown || {};

  const statuses = [
    {
      key: 'available',
      label: 'Available Copies',
      count: bd.available || 0,
      icon: CheckCircle,
      borderColor: 'border-l-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
      iconColor: 'text-emerald-500',
      countColor: 'text-emerald-700 dark:text-emerald-400',
      headerColor: 'text-emerald-800 dark:text-emerald-300',
      emptyMsg: 'No copies currently available.',
    },
    {
      key: 'borrowed',
      label: 'Currently Borrowed',
      count: bd.borrowed || 0,
      icon: Repeat,
      borderColor: 'border-l-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/10',
      iconColor: 'text-amber-500',
      countColor: 'text-amber-700 dark:text-amber-400',
      headerColor: 'text-amber-800 dark:text-amber-300',
      emptyMsg: 'No copies are currently borrowed.',
    },
    {
      key: 'damaged',
      label: 'Damaged',
      count: bd.damaged || 0,
      icon: AlertTriangle,
      borderColor: 'border-l-rose-500',
      bgColor: 'bg-rose-50 dark:bg-rose-900/10',
      iconColor: 'text-rose-500',
      countColor: 'text-rose-700 dark:text-rose-400',
      headerColor: 'text-rose-800 dark:text-rose-300',
      emptyMsg: 'No damaged copies recorded.',
    },
    {
      key: 'lost',
      label: 'Lost',
      count: bd.lost || 0,
      icon: Package,
      borderColor: 'border-l-slate-500',
      bgColor: 'bg-slate-50 dark:bg-slate-800/40',
      iconColor: 'text-slate-500',
      countColor: 'text-slate-700 dark:text-slate-300',
      headerColor: 'text-slate-800 dark:text-slate-300',
      emptyMsg: 'No lost copies recorded.',
    },
  ];

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <Activity size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Physical Copies  Live Breakdown</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">Status overview of all physical copies in the library</p>
        </div>
      </div>

      {/* 4-Column Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statuses.map((s) => {
          const StatusIcon = s.icon;
          return (
            <div
              key={s.key}
              className={`rounded-2xl border border-gray-100 dark:border-slate-700 border-l-4 ${s.borderColor} ${s.bgColor} p-5 shadow-sm hover:shadow-md transition-shadow duration-200`}
            >
              {/* Card Header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm`}>
                  <StatusIcon size={18} className={s.iconColor} />
                </div>
                <h4 className={`text-sm font-bold ${s.headerColor} uppercase tracking-wide`}>
                  {s.label}
                </h4>
              </div>

              {/* Count */}
              <p className={`text-4xl font-extrabold ${s.countColor} leading-none`}>
                {s.count}
              </p>

              {/* Empty State Message */}
              {s.count === 0 && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-3 italic">
                  {s.emptyMsg}
                </p>
              )}

              {/* Decorative count label */}
              {s.count > 0 && (
                <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider mt-2">
                  {s.count === 1 ? 'copy' : 'copies'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
