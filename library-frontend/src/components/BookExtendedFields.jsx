import React from "react";
import { Tag, Hash, MapPin, Calendar, FileText } from "lucide-react";
import FloatingInput from "./ui/FloatingInput";

export default function BookExtendedFields({ book, setBook }) {
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Tag size={16} className="text-gray-500" /> Extended Catalog Fields
            </h4>

            {/* Accession, LCCN, ISSN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FloatingInput
                    label="Accession No."
                    value={book.accession_no}
                    onChange={e => setBook({ ...book, accession_no: e.target.value })}
                    icon={Hash}
                />
                <FloatingInput
                    label="LCCN"
                    value={book.lccn}
                    onChange={e => setBook({ ...book, lccn: e.target.value })}
                    icon={Hash}
                    placeholder="Library of Congress"
                />
                <FloatingInput
                    label="ISSN"
                    value={book.issn}
                    onChange={e => setBook({ ...book, issn: e.target.value })}
                    icon={Hash}
                    placeholder="Serial Number"
                />
            </div>

            {/* Place, Copyright, Edition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FloatingInput
                    label="Place of Publication"
                    value={book.place_of_publication}
                    onChange={e => setBook({ ...book, place_of_publication: e.target.value })}
                    icon={MapPin}
                    placeholder="e.g., Manila, PH"
                />
                <FloatingInput
                    label="Copyright Year"
                    value={book.copyright_year}
                    onChange={e => setBook({ ...book, copyright_year: e.target.value })}
                    icon={Calendar}
                    type="number"
                    min="1800"
                    max={new Date().getFullYear() + 1}
                />
                <FloatingInput
                    label="Edition"
                    value={book.edition}
                    onChange={e => setBook({ ...book, edition: e.target.value })}
                    icon={FileText}
                    placeholder="e.g., 2nd Edition"
                />
            </div>

            {/* Physical Description, Series, Volume */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FloatingInput
                    label="Physical Description"
                    value={book.physical_description}
                    onChange={e => setBook({ ...book, physical_description: e.target.value })}
                    icon={FileText}
                    placeholder="e.g., 200p., ill."
                />
                <FloatingInput
                    label="Series"
                    value={book.series}
                    onChange={e => setBook({ ...book, series: e.target.value })}
                    icon={FileText}
                    placeholder="e.g., Oxford Classics"
                />
                <FloatingInput
                    label="Volume"
                    value={book.volume}
                    onChange={e => setBook({ ...book, volume: e.target.value })}
                    icon={FileText}
                    placeholder="e.g., Vol. 3"
                />
            </div>

            {/* Price and Penalty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                    label="Price (₱)"
                    value={book.price}
                    onChange={e => setBook({ ...book, price: e.target.value })}
                    icon={Tag}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                />
                <FloatingInput
                    label="Penalty per Day (₱)"
                    value={book.book_penalty}
                    onChange={e => setBook({ ...book, book_penalty: e.target.value })}
                    icon={Tag}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Default: System rate"
                />
            </div>
        </div>
    );
}
