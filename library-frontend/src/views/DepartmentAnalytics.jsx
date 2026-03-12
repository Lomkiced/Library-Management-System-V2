import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { Users, BookOpen, AlertCircle, Filter, PieChart } from "lucide-react";
import Pagination from "../components/ui/Pagination";

export default function DepartmentAnalytics() {
    const [stats, setStats] = useState({
        total_students: 0,
        active_borrowers: 0,
        late_returners: 0,
        pending_fines: 0
    });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filters
    const [course, setCourse] = useState("BSIT");
    const [yearLevel, setYearLevel] = useState("");
    const [section, setSection] = useState("");

    const courses = [
        "BSIT", "BSED", "BEED", "Maritime", "BSHM", "BS Criminology", "BSBA", "BS Tourism"
    ];

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 on filter change
        fetchData();
    }, [course, yearLevel, section]);

    const fetchData = () => {
        setLoading(true);
        axiosClient.get("/reports/department", {
            params: { course, year_level: yearLevel, section }
        })
            .then(({ data }) => {
                setStats(data.stats || { total_students: 0, active_borrowers: 0, late_returners: 0, pending_fines: 0 });
                setStudents(data.students || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    // Calculate Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = students.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-6 bg-gray-50 dark:bg-slate-900 p-8 min-h-screen transition-colors duration-300">
            {/* Page Header with Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
                        <PieChart size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Departmental Analytics</h2>
                        <p className="text-gray-500 dark:text-slate-400">View statistics by course and class</p>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex gap-3 flex-wrap w-full md:w-auto">
                    <select
                        value={course}
                        onChange={e => setCourse(e.target.value)}
                        className="border-2 border-primary-200 dark:border-primary-700 p-3 rounded-xl outline-none w-full md:w-auto font-bold bg-primary-50 dark:bg-slate-700 text-primary-700 dark:text-primary-300 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-600 transition-all"
                    >
                        {courses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={yearLevel}
                        onChange={e => setYearLevel(e.target.value)}
                        className="border-2 border-gray-200 dark:border-slate-600 p-3 rounded-xl outline-none w-full md:w-auto bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-white focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-600 transition-all"
                    >
                        <option value="">All Year Levels</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>

                    <input
                        placeholder="Section (e.g. A)"
                        value={section}
                        onChange={e => setSection(e.target.value)}
                        className="border-2 border-gray-200 dark:border-slate-600 p-3 rounded-xl outline-none w-full md:w-auto bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-white focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-600 transition-all"
                    />
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Total Students</div>
                    <div className="text-4xl font-bold text-gray-800 dark:text-white">{stats.total_students}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Active Borrowers</div>
                    <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active_borrowers}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Late Returners</div>
                    <div className="text-4xl font-bold text-red-600 dark:text-red-400">{stats.late_returners}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Pending Fines</div>
                    <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">₱{parseFloat(stats.pending_fines).toFixed(2)}</div>
                </div>
            </div>

            {/* DETAILED TABLE */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700">
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 font-bold text-gray-700 dark:text-white bg-gray-50 dark:bg-slate-900/50 flex items-center gap-2">
                    <Users size={18} className="text-primary-600 dark:text-primary-400" />
                    Student Breakdown: <span className="text-primary-600 dark:text-primary-400">{course}</span>
                    {yearLevel ? <span className="text-gray-500 dark:text-slate-400"> • Year {yearLevel}</span> : ''}
                    {section ? <span className="text-gray-500 dark:text-slate-400"> • Section {section}</span> : ''}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-600 dark:text-slate-400 uppercase text-xs font-bold border-b border-gray-100 dark:border-slate-700">
                            <tr>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">ID</th>
                                <th className="p-4 text-center">Year/Sec</th>
                                <th className="p-4 text-center">Active Loans</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Pending Fine</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 dark:border-primary-400"></div>
                                            Loading data...
                                        </div>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-gray-500 dark:text-slate-400">
                                        <Users size={48} className="mx-auto mb-3 opacity-20" />
                                        No students found for this filter.
                                    </td>
                                </tr>
                            ) : (
                                currentStudents.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                                        <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{s.name}</td>
                                        <td className="p-4">
                                            <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-1 rounded">{s.student_id}</span>
                                        </td>
                                        <td className="p-4 text-center text-gray-600 dark:text-slate-400">
                                            {s.year_level ? `${s.year_level}-${s.section || '?'}` : 'N/A'}
                                        </td>
                                        <td className="p-4 text-center">
                                            {s.active_loans > 0 ? (
                                                <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-xs font-bold border border-primary-200 dark:border-primary-800">
                                                    {s.active_loans}
                                                </span>
                                            ) : <span className="text-gray-400 dark:text-slate-500">-</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${s.status === 'Overdue' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' :
                                                s.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                                                    'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600'
                                                }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {s.pending_fine > 0 ? (
                                                <span className="text-red-600 dark:text-red-400 font-bold">₱{parseFloat(s.pending_fine).toFixed(2)}</span>
                                            ) : <span className="text-gray-400 dark:text-slate-500">-</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Control */}
            {!loading && students.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={students.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
}

