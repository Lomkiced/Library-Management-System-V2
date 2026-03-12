import { useEffect, useState } from 'react';
import axiosClient from '../axios-client';
import {
    Trophy, Medal, Crown, Star,
    ChevronRight, TrendingUp, Award
} from 'lucide-react';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();

        // Poll every 60 seconds (reduced from 5s to avoid 429 Too Many Requests)
        const interval = setInterval(fetchLeaderboard, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchLeaderboard = () => {
        axiosClient.get('/students/leaderboard')
            .then(({ data }) => {
                setLeaders(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch leaderboard:', err);
                setLoading(false);
            });
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <Crown className="text-yellow-500" size={24} />;
            case 2: return <Medal className="text-gray-400" size={22} />;
            case 3: return <Medal className="text-amber-600" size={22} />;
            default: return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
        }
    };

    const getRankStyle = (rank) => {
        switch (rank) {
            case 1: return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 ring-2 ring-yellow-100';
            case 2: return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
            case 3: return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
            default: return 'bg-white border-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl">
                        <Trophy className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Top Readers</h3>
                        <p className="text-sm text-gray-500">Loading leaderboard...</p>
                    </div>
                </div>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (leaders.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl">
                        <Trophy className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Top Readers</h3>
                        <p className="text-sm text-gray-500">Student leaderboard</p>
                    </div>
                </div>
                <div className="text-center py-8">
                    <TrendingUp size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">No reading activity yet</p>
                    <p className="text-gray-400 text-xs mt-1">Students will appear here after borrowing books</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Trophy className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Top Readers Leaderboard</h3>
                        <p className="text-white/80 text-sm">This month's most active students</p>
                    </div>
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="p-4 space-y-2">
                {leaders.slice(0, 3).map((student, index) => (
                    <div
                        key={student.id}
                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:shadow-md ${getRankStyle(student.rank)}`}
                    >
                        {/* Rank */}
                        <div className="w-10 flex justify-center">
                            {getRankIcon(student.rank)}
                        </div>

                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 truncate">{student.name}</span>
                                {student.badges_count > 0 && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                                        <Award size={12} />
                                        {student.badges_count}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">{student.course} • {student.student_id}</div>
                        </div>

                        {/* Stats */}
                        <div className="text-right">
                            <div className="text-lg font-bold text-primary-600">{student.books_borrowed}</div>
                            <div className="text-xs text-gray-500">books read</div>
                        </div>

                        <ChevronRight size={16} className="text-gray-300" />
                    </div>
                ))}
            </div>



            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                    🎯 Keep reading to climb the leaderboard!
                </p>
            </div>
        </div>
    );
}
