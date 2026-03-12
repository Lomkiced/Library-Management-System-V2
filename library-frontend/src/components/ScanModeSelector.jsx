import { BookOpen, BookPlus, RotateCcw, X } from "lucide-react";

/**
 * ScanModeSelector Component
 * A modal that appears before the camera scanner opens, allowing the user
 * to select the purpose of the scan: Borrow, Register, or Return.
 *
 * Props:
 * - onSelectMode: (mode: 'borrow' | 'register' | 'return') => void
 * - onClose: () => void
 */
export default function ScanModeSelector({ onSelectMode, onClose }) {
    const modes = [
        {
            id: 'borrow',
            label: 'Borrow Book',
            description: 'Scan a book to issue it to a student',
            icon: BookOpen,
            bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            hoverColor: 'hover:from-emerald-600 hover:to-emerald-700',
            shadowColor: 'shadow-emerald-200',
            iconBg: 'bg-white/20'
        },
        {
            id: 'register',
            label: 'Register Book',
            description: 'Scan a new book to add it to inventory',
            icon: BookPlus,
            bgColor: 'bg-gradient-to-br from-primary-600 to-primary-700',
            hoverColor: 'hover:from-primary-700 hover:to-primary-800',
            shadowColor: 'shadow-primary-200',
            iconBg: 'bg-white/20'
        },
        {
            id: 'return',
            label: 'Return Book',
            description: 'Scan a borrowed book to return it',
            icon: RotateCcw,
            bgColor: 'bg-gradient-to-br from-amber-500 to-orange-500',
            hoverColor: 'hover:from-amber-600 hover:to-orange-600',
            shadowColor: 'shadow-amber-200',
            iconBg: 'bg-white/20'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Select Action</h2>
                        <p className="text-white/70 text-sm">What would you like to do?</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                    >
                        <X className="text-white" size={20} />
                    </button>
                </div>

                {/* Mode Buttons */}
                <div className="p-6 space-y-4">
                    {modes.map((mode) => {
                        const IconComponent = mode.icon;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => onSelectMode(mode.id)}
                                className={`
                                    w-full p-5 rounded-2xl text-left text-white 
                                    ${mode.bgColor} ${mode.hoverColor}
                                    shadow-lg ${mode.shadowColor}
                                    transform transition-all duration-200
                                    hover:scale-[1.02] hover:shadow-xl
                                    active:scale-[0.98]
                                    flex items-center gap-4
                                `}
                            >
                                <div className={`p-3 ${mode.iconBg} rounded-xl`}>
                                    <IconComponent size={28} />
                                </div>
                                <div>
                                    <div className="font-bold text-lg">{mode.label}</div>
                                    <div className="text-white/80 text-sm">{mode.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer hint */}
                <div className="px-6 pb-6">
                    <p className="text-center text-gray-400 text-xs">
                        The camera will open after you select an action
                    </p>
                </div>
            </div>
        </div>
    );
}
