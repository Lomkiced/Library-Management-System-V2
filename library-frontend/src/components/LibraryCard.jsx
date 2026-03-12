import React from 'react';
import { Printer } from 'lucide-react';

const LibraryCard = ({ student }) => {
    if (!student) return null;

    const handlePrint = () => {
        // Store critical data for the print page
        // Using localStorage is simple and effectively passes data to the new window tab
        localStorage.setItem('print_student_data', JSON.stringify(student));

        // Open the print route in a new window/popup
        const width = 800;
        const height = 600;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        window.open(
            '/print/card',
            'Print Library Card',
            `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
        );
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                handlePrint();
            }}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-colors shadow-sm z-50 cursor-pointer pointer-events-auto"
            title="Print Library Card"
        >
            <Printer size={16} /> PRINT ID
        </button>
    );
};

export default LibraryCard;
