import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Context for Toast
const ToastContext = createContext(null);

// Toast Provider Component
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-remove after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, duration);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Toast Container Component
function ToastContainer({ toasts, removeToast }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

// Individual Toast Component
function Toast({ id, message, type, onClose }) {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 200);
    };

    const config = {
        success: {
            icon: CheckCircle,
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-800',
            iconColor: 'text-emerald-500',
        },
        error: {
            icon: XCircle,
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            iconColor: 'text-red-500',
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-800',
            iconColor: 'text-amber-500',
        },
        info: {
            icon: Info,
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            iconColor: 'text-blue-500',
        },
    };

    const { icon: Icon, bg, border, text, iconColor } = config[type] || config.info;

    return (
        <div
            className={`
                flex items-start gap-3 p-4 rounded-xl shadow-lg border-2
                ${bg} ${border} ${text}
                transform transition-all duration-200 ease-out
                ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                animate-slideIn
            `}
            role="alert"
        >
            <Icon size={20} className={`${iconColor} flex-shrink-0 mt-0.5`} />
            <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
            <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
                <X size={16} className="opacity-60" />
            </button>
        </div>
    );
}

// Add animation to global CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    .animate-slideIn {
        animation: slideIn 0.3s ease-out;
    }
`;
document.head.appendChild(style);

export default Toast;
