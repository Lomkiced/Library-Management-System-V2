import React from 'react';

export default function Card({ children, className = '', title, actions }) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
            {(title || actions) && (
                <div className="flex items-center justify-between mb-4">
                    {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
