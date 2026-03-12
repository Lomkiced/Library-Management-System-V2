import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'primary', trend, description }) {
    const colorStyles = {
        primary: 'bg-primary-50 text-primary-600 border-primary-100',
        blue: 'bg-primary-50 text-primary-600 border-primary-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        orange: 'bg-amber-50 text-amber-600 border-amber-100',
        red: 'bg-red-50 text-red-600 border-red-100',
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 flex items-center justify-between transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 cursor-pointer group">
            <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                <h4 className="text-4xl font-bold text-gray-800 dark:text-white mt-2">{value}</h4>
                {description && <div className="text-sm text-gray-400 dark:text-slate-500 mt-1">{description}</div>}
                {trend && <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{trend}</div>}
            </div>
            <div className={`p-4 rounded-xl border ${colorStyles[color] || colorStyles.primary} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                {Icon && <Icon size={28} strokeWidth={1.5} />}
            </div>
        </div>
    );
}

