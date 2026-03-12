import React from 'react';

export default function Input({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    className = '',
    error
}) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`px-3 py-2 border rounded-lg outline-none transition focus:ring-2 focus:ring-primary-400 text-slate-700 ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500'}`}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}
