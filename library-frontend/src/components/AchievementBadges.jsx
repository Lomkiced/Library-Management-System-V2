import { useEffect, useState } from 'react';
import axiosClient from '../axios-client';
import {
    BookOpen, Star, Trophy, Crown, Atom, BookMarked,
    Laptop, Scroll, Clock, Layers, Lock, Award, Sparkles
} from 'lucide-react';

// Icon mapping for badges
const BADGE_ICONS = {
    BookOpen: BookOpen,
    Star: Star,
    Trophy: Trophy,
    Crown: Crown,
    Atom: Atom,
    BookMarked: BookMarked,
    Laptop: Laptop,
    Scroll: Scroll,
    Clock: Clock,
    Layers: Layers
};

// Color mapping for badges
const BADGE_COLORS = {
    blue: { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-600', icon: 'text-blue-500' },
    yellow: { bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-500' },
    gold: { bg: 'bg-gradient-to-br from-yellow-100 to-amber-100', border: 'border-yellow-300', text: 'text-amber-700', icon: 'text-amber-500' },
    purple: { bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500' },
    cyan: { bg: 'bg-cyan-100', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'text-cyan-500' },
    pink: { bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-700', icon: 'text-pink-500' },
    green: { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' },
    amber: { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' },
    emerald: { bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
    indigo: { bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-500' },
    violet: { bg: 'bg-violet-100', border: 'border-violet-200', text: 'text-violet-700', icon: 'text-violet-500' }
};

export default function AchievementBadges({ studentId, compact = false }) {
    const [achievements, setAchievements] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (studentId) {
            fetchAchievements();
        }
    }, [studentId]);

    const fetchAchievements = () => {
        axiosClient.get(`/students/${studentId}/achievements`)
            .then(({ data }) => {
                setAchievements(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch achievements:', err);
                setLoading(false);
            });
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!achievements) {
        return null;
    }

    const { badges, unlocked_count, total_count } = achievements;

    // Compact mode - just show unlocked badges inline
    if (compact) {
        const unlockedBadges = badges.filter(b => b.unlocked);
        if (unlockedBadges.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-1">
                {unlockedBadges.slice(0, 5).map(badge => {
                    const Icon = BADGE_ICONS[badge.icon] || Award;
                    const colors = BADGE_COLORS[badge.color] || BADGE_COLORS.blue;
                    return (
                        <div
                            key={badge.id}
                            className={`p-1.5 ${colors.bg} ${colors.border} border rounded-lg`}
                            title={badge.name}
                        >
                            <Icon size={14} className={colors.icon} />
                        </div>
                    );
                })}
                {unlockedBadges.length > 5 && (
                    <span className="text-xs text-gray-500 self-center">+{unlockedBadges.length - 5}</span>
                )}
            </div>
        );
    }

    // Full mode - show all badges with details
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Achievement Badges</h3>
                            <p className="text-white/80 text-sm">{achievements.student.name}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">{unlocked_count}/{total_count}</div>
                        <div className="text-white/70 text-xs">Unlocked</div>
                    </div>
                </div>
            </div>

            {/* Badges Grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {badges.map(badge => {
                    const Icon = BADGE_ICONS[badge.icon] || Award;
                    const colors = BADGE_COLORS[badge.color] || BADGE_COLORS.blue;

                    return (
                        <div
                            key={badge.id}
                            className={`relative p-4 rounded-xl border-2 transition-all ${badge.unlocked
                                ? `${colors.bg} ${colors.border} hover:scale-105 cursor-pointer`
                                : 'bg-gray-50 border-gray-200 opacity-50'
                                }`}
                        >
                            {/* Lock overlay for locked badges */}
                            {!badge.unlocked && (
                                <div className="absolute top-2 right-2">
                                    <Lock size={12} className="text-gray-400" />
                                </div>
                            )}

                            {/* Badge Icon */}
                            <div className={`w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded-lg ${badge.unlocked ? 'bg-white shadow-sm' : 'bg-gray-100'
                                }`}>
                                <Icon size={24} className={badge.unlocked ? colors.icon : 'text-gray-400'} />
                            </div>

                            {/* Badge Name */}
                            <div className={`text-xs font-bold text-center ${badge.unlocked ? colors.text : 'text-gray-400'}`}>
                                {badge.name}
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${badge.unlocked ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                    style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                                />
                            </div>
                            <div className="text-xs text-center text-gray-500 mt-1">
                                {badge.progress}/{badge.target}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
