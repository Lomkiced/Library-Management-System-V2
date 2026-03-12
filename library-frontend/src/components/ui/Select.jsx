import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
    label,
    value,
    onChange,
    options = [],
    children,
    required = false,
    className = '',
    error,
    placeholder = "Select an option"
}) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`w-full px-3 py-2 border rounded-lg outline-none transition focus:ring-2 focus:ring-primary-400 text-slate-700 bg-white appearance-none pr-10 ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500'}`}
                >
                    {placeholder && <option value="" disabled>{placeholder}</option>}
                    {children}
                    {options.map(opt => (
                        <option key={opt.value || opt} value={opt.value || opt}>
                            {opt.label || opt}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                </div>
            </div>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}
