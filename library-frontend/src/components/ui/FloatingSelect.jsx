import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FloatingSelect({
    label,
    value,
    onChange,
    options = [],
    children,
    required = false,
    className = '',
    error,
    disabled = false,
    name,
    id
}) {
    const [isFocused, setIsFocused] = useState(false);
    const isFloating = isFocused || value;

    // Blue theme colors
    const primaryBlue = '#020463';

    return (
        <div className={`relative ${className}`}>
            {/* Select Field */}
            <div className="relative">
                <select
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    required={required}
                    disabled={disabled}
                    name={name}
                    id={id || name}
                    style={{
                        borderColor: error ? undefined : (isFocused ? primaryBlue : undefined)
                    }}
                    className={`
                        peer w-full px-4 py-4 pt-6 pr-12
                        bg-white dark:bg-slate-900 border-2 rounded-xl
                        font-semibold text-gray-900 dark:text-white
                        outline-none transition-all duration-200
                        hover:bg-white dark:hover:bg-slate-900
                        appearance-none cursor-pointer
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${error
                            ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                            : 'border-gray-200 dark:border-slate-700 focus:ring-4'
                        }
                        ${!value ? 'text-transparent dark:text-transparent' : ''}
                    `}
                >
                    <option value="" disabled></option>
                    {children}
                    {options.map(opt => (
                        <option
                            key={opt.value || opt}
                            value={opt.value || opt}
                            className="py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                        >
                            {opt.label || opt}
                        </option>
                    ))}
                </select>

                {/* Floating Label */}
                <label
                    className={`
                        absolute left-4 transition-all duration-200 pointer-events-none whitespace-nowrap
                        ${isFloating
                            ? 'top-2 text-xs font-bold'
                            : 'top-1/2 -translate-y-1/2 text-sm font-medium'
                        }
                    `}
                    style={{
                        color: error ? '#ef4444' : isFloating ? primaryBlue : '#6b7280'
                    }}
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>

                {/* Chevron Icon */}
                <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                    style={{ color: error ? '#ef4444' : isFocused ? primaryBlue : '#9ca3af' }}
                >
                    <ChevronDown
                        size={20}
                        className={`transition-transform duration-200 ${isFocused ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-1.5 mt-2 text-red-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}
        </div>
    );
}
