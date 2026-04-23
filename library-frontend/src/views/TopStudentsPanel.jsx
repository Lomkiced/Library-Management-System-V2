import { useState } from "react";
import { Users, Search, X, Download, ChevronLeft, ChevronRight, Medal, Award, BookOpen, Star, Activity, GraduationCap, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

// ─── Helpers ────────────────────────────────────────────────────────────────

const RANK_CONFIG = [
  { gradient: "from-yellow-400 to-amber-500",   ring: "ring-yellow-400",  bg: "bg-yellow-50 dark:bg-yellow-900/20",  text: "text-yellow-700 dark:text-yellow-300",  label: "Gold",   podiumH: "h-36", order: 2 },
  { gradient: "from-slate-400 to-slate-500",    ring: "ring-slate-400",   bg: "bg-slate-50 dark:bg-slate-800",       text: "text-slate-600 dark:text-slate-300",   label: "Silver", podiumH: "h-24", order: 1 },
  { gradient: "from-orange-400 to-orange-500",  ring: "ring-orange-400",  bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-300", label: "Bronze", podiumH: "h-20", order: 3 },
];

const BAR_COLORS = [
  "#f59e0b","#94a3b8","#f97316",
  "#6366f1","#10b981","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f43f5e",
  "#84cc16","#06b6d4","#a855f7","#fb923c","#22d3ee",
];

function Avatar({ student, size = "md" }) {
  const s = size === "lg" ? "w-16 h-16 text-xl" : size === "sm" ? "w-9 h-9 text-sm" : "w-11 h-11 text-base";
  if (student.profile_picture) {
    return <img src={student.profile_picture} alt={student.name} className={`${s} rounded-full object-cover ring-2 ring-white dark:ring-slate-700`} />;
  }
  const initials = student.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const colors = ["from-violet-500 to-purple-600","from-emerald-500 to-teal-600","from-blue-500 to-indigo-600","from-rose-500 to-pink-600","from-amber-500 to-orange-600"];
  const color = colors[(student.id || 0) % colors.length];
  return (
    <div className={`${s} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-slate-700 flex-shrink-0`}>
      {initials}
    </div>
  );
}

function ReturnRateBar({ rate }) {
  const color = rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${rate}%` }} />
      </div>
      <span className={`text-xs font-bold w-9 text-right ${rate >= 80 ? "text-emerald-600 dark:text-emerald-400" : rate >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>{rate}%</span>
    </div>
  );
}

function CategoryChip({ category }) {
  if (!category || category === "General" || category === "N/A") return <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>;
  const colors = { Technology:"bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", Science:"bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300", Fiction:"bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300", History:"bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", Mathematics:"bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" };
  const cls = colors[category] || "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls} whitespace-nowrap`}>{category}</span>;
}

function RankBadge({ rank }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md shadow-yellow-400/30"><Medal size={14} className="text-white" /></div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shadow-md"><Medal size={14} className="text-white" /></div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-400/30"><Medal size={14} className="text-white" /></div>;
  return <div className="w-8 h-8 flex items-center justify-center"><span className="text-sm font-bold text-gray-400 dark:text-slate-500">#{rank}</span></div>;
}

// ─── Podium Card ─────────────────────────────────────────────────────────────

function PodiumCard({ student, rankIdx }) {
  const cfg = RANK_CONFIG[rankIdx];
  if (!student) return <div className={`flex flex-col items-center order-${cfg.order}`}><div className={`${cfg.podiumH} w-full rounded-t-2xl bg-gray-100 dark:bg-slate-700/50 border-2 border-dashed border-gray-200 dark:border-slate-600`} /></div>;

  return (
    <div className={`flex flex-col items-center order-${cfg.order} group`} style={{ animationDelay: `${rankIdx * 120}ms` }}>
      {/* Crown / medal */}
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg mb-2`}>
        {rankIdx === 0 ? <Award size={20} className="text-white" /> : <Medal size={18} className="text-white" />}
      </div>

      {/* Avatar */}
      <div className={`ring-4 ${cfg.ring} ring-offset-2 dark:ring-offset-slate-900 rounded-full mb-3`}>
        <Avatar student={student} size="lg" />
      </div>

      {/* Info */}
      <div className="text-center mb-3 px-2">
        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1">{student.name}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 font-mono mt-0.5">{student.student_id}</p>
        <CategoryChip category={student.favorite_category} />
      </div>

      {/* Borrow count pill */}
      <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${cfg.gradient} shadow-lg mb-3`}>
        <span className="text-white font-bold text-lg">{student.borrow_count}</span>
        <span className="text-white/80 text-xs ml-1">books</span>
      </div>

      {/* Podium block */}
      <div className={`w-full ${cfg.podiumH} rounded-t-2xl bg-gradient-to-b ${cfg.gradient} opacity-90 shadow-inner flex items-start justify-center pt-3`}>
        <span className="text-white/60 font-black text-3xl">#{rankIdx + 1}</span>
      </div>
    </div>
  );
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="font-bold text-gray-800 dark:text-white mb-1">{payload[0]?.payload?.name?.split(" ")[0]}</p>
      <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{payload[0]?.value} books borrowed</p>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export default function TopStudentsPanel({ topStudents, studentSummary, studentSearch, studentPage, onSearch, onClearSearch, onPageChange, onExportCsv }) {
  const students = topStudents.data || [];
  const top3 = [students[0], students[1], students[2]];
  const chartData = students.slice(0, 15).map(s => ({ name: s.name, borrow_count: s.borrow_count }));

  const summaryCards = [
    { label: "Active Readers",       value: studentSummary.total_active_readers,   icon: Users,         gradient: "from-violet-500 to-purple-600",  light: "bg-violet-50 dark:bg-violet-900/20",  iconBg: "bg-violet-100 dark:bg-violet-900/40",  text: "text-violet-700 dark:text-violet-300" },
    { label: "Books Circulated",     value: studentSummary.total_books_circulated, icon: BookOpen,      gradient: "from-emerald-500 to-teal-600",    light: "bg-emerald-50 dark:bg-emerald-900/20",iconBg: "bg-emerald-100 dark:bg-emerald-900/40",text: "text-emerald-700 dark:text-emerald-300" },
    { label: "Avg Books / Student",  value: studentSummary.avg_books_per_student,  icon: TrendingUp,    gradient: "from-blue-500 to-indigo-600",     light: "bg-blue-50 dark:bg-blue-900/20",      iconBg: "bg-blue-100 dark:bg-blue-900/40",      text: "text-blue-700 dark:text-blue-300" },
    { label: "Top Category",         value: studentSummary.most_popular_category,  icon: Star,          gradient: "from-amber-500 to-orange-500",    light: "bg-amber-50 dark:bg-amber-900/20",    iconBg: "bg-amber-100 dark:bg-amber-900/40",    text: "text-amber-700 dark:text-amber-300" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Summary Stats Banner ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`relative overflow-hidden rounded-2xl p-5 ${card.light} border border-white/60 dark:border-slate-700 shadow-sm group hover:shadow-md transition-shadow`}>
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
                <Icon size={20} className={card.text} />
              </div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <p className={`text-2xl font-black ${card.text}`}>{card.value ?? "—"}</p>
              <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
            </div>
          );
        })}
      </div>

      {/* ── Podium + Chart row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Podium */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md shadow-amber-400/30">
              <Award size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hall of Fame</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500">Top 3 all-time readers</p>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-300 dark:text-slate-600 py-12">
              <GraduationCap size={48} />
              <p className="font-medium text-sm">No borrowing data yet</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-end">
              {/* Podium grid: silver | gold | bronze */}
              <div className="grid grid-cols-3 gap-3 items-end">
                <PodiumCard student={top3[1]} rankIdx={1} />
                <PodiumCard student={top3[0]} rankIdx={0} />
                <PodiumCard student={top3[2]} rankIdx={2} />
              </div>
              {/* Base */}
              <div className="mt-0 h-3 rounded-b-2xl bg-gradient-to-r from-slate-200 via-amber-200 to-slate-200 dark:from-slate-700 dark:via-amber-900/40 dark:to-slate-700" />
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/30">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reading Activity</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500">Top readers by borrow count</p>
              </div>
            </div>
            <button onClick={onExportCsv} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 transition-colors" title="Export CSV">
              <Download size={18} />
            </button>
          </div>
          <div className="h-[300px]">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-slate-600 gap-3">
                <Activity size={40} />
                <p className="text-sm font-medium">No data to display</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={v => v.split(" ")[0]} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9", opacity: 0.6 }} />
                  <Bar dataKey="borrow_count" radius={[6, 6, 0, 0]} barSize={32}>
                    {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    <LabelList dataKey="borrow_count" position="top" fontSize={11} fontWeight="bold" fill="#64748b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Full Leaderboard Table ── */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">

        {/* Table header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap size={20} className="text-indigo-500" /> Full Leaderboard
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {topStudents.total} student{topStudents.total !== 1 ? "s" : ""} ranked by all-time borrows
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or ID…"
              value={studentSearch}
              onChange={onSearch}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {studentSearch && (
              <button onClick={onClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider w-12">Rank</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider hidden md:table-cell">Course / Year</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider hidden lg:table-cell">Fav. Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider hidden lg:table-cell">Return Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center">Active</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-right">Borrows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <GraduationCap size={40} className="mx-auto mb-3 text-gray-200 dark:text-slate-600" />
                    <p className="text-gray-400 dark:text-slate-500 font-medium">No students found</p>
                    {studentSearch && <p className="text-gray-300 dark:text-slate-600 text-sm mt-1">Try a different search term</p>}
                  </td>
                </tr>
              )}
              {students.map((student, i) => (
                <tr key={`${student.id}-${i}`}
                  className={`group hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors ${student.rank <= 3 ? "bg-amber-50/30 dark:bg-amber-900/5" : ""}`}>
                  <td className="px-6 py-4">
                    <RankBadge rank={student.rank} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar student={student} size="sm" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{student.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{student.student_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{student.course}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Year {student.year_level} · {student.section}</p>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <CategoryChip category={student.favorite_category} />
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell min-w-[140px]">
                    <ReturnRateBar rate={student.return_rate ?? 0} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student.active_loans > 0
                      ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{student.active_loans}</span>
                      : <span className="text-gray-300 dark:text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{student.borrow_count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {topStudents.last_page > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/40 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Showing <span className="font-bold text-gray-700 dark:text-white">{(topStudents.current_page - 1) * topStudents.per_page + 1}</span>–<span className="font-bold text-gray-700 dark:text-white">{Math.min(topStudents.current_page * topStudents.per_page, topStudents.total)}</span> of <span className="font-bold text-gray-700 dark:text-white">{topStudents.total}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => onPageChange(studentPage - 1)} disabled={studentPage <= 1}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: topStudents.last_page }, (_, i) => i + 1)
                .filter(p => topStudents.last_page <= 5 || p === 1 || p === topStudents.last_page || Math.abs(p - studentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center gap-1">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-400 text-xs px-1">…</span>}
                    <button onClick={() => onPageChange(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${p === studentPage ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600"}`}>
                      {p}
                    </button>
                  </span>
                ))}
              <button onClick={() => onPageChange(studentPage + 1)} disabled={studentPage >= topStudents.last_page}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
