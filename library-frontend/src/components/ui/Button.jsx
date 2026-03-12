import React from 'react';

export default function Button({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    className = '',
    disabled = false,
    loading = false,
    isLoading = false,
    icon: Icon,
    fullWidth = false,
    ...props
}) {
    const isComponentLoading = loading || isLoading;
    const baseStyles = "px-4 py-2.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    // Blue theme color palette
    const primaryBlue = '#020463';
    const primaryBlueHover = '#1a1c7a';

    const variants = {
        // Primary Blue Button
        primary: `text-white hover:shadow-lg active:scale-[0.98]`,
        // Form submit button (larger)
        form: `text-white hover:shadow-xl active:scale-[0.98] py-4 text-base`,
        // Secondary gray
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        // Danger (keep for delete actions)
        danger: "bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-200 active:scale-[0.98]",
        // Ghost (transparent)
        ghost: "text-gray-600 hover:bg-gray-100",
        // Outline
        outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400",
        // Success (for batch registration)
        success: "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98]"
    };

    const widthClass = fullWidth ? 'w-full' : '';

    // Apply inline styles for primary/form variants to use exact blue colors
    const isPrimaryOrForm = variant === 'primary' || variant === 'form';
    const inlineStyle = isPrimaryOrForm ? {
        backgroundColor: primaryBlue,
    } : {};

    const handleMouseEnter = (e) => {
        if (isPrimaryOrForm && !disabled && !isComponentLoading) {
            e.currentTarget.style.backgroundColor = primaryBlueHover;
        }
    };

    const handleMouseLeave = (e) => {
        if (isPrimaryOrForm && !disabled && !isComponentLoading) {
            e.currentTarget.style.backgroundColor = primaryBlue;
        }
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isComponentLoading}
            className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
            style={inlineStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {isComponentLoading ? (
                <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Please wait...</span>
                </>
            ) : (
                <>
                    {Icon && <Icon size={18} />}
                    {children}
                </>
            )}
        </button>
    );
}
