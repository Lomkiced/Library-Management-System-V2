import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';


export default function PrintLabelModal({ book, asset, onClose }) {
    const printRef = useRef(null);

    // Get the barcode/asset code to display
    const barcodeValue = asset?.asset_code || book?.assets?.[0]?.asset_code || book?.isbn || 'NO-CODE';
    const title = book?.title || 'Unknown Title';
    const author = book?.author || 'Unknown Author';

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;

        // Collect all styles from the main document
        // This includes Tailwind styles (in style tags) and any linked stylesheets
        let styleContent = '';
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(node => {
            styleContent += node.outerHTML;
        });

        // Write content to the iframe
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                ${styleContent}
                <style>
                    /* Force print styles */
                    @media print {
                        body { 
                            margin: 0; 
                            padding: 0; 
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact;
                        }
                        .print-area { visibility: visible !important; }
                    }
                    /* Hide everything else implicitly since we only write print-area content */
                </style>
            </head>
            <body>
                ${content.outerHTML}
            </body>
            </html>
        `);
        doc.close();

        // Print after a short delay to allow styles to apply
        setTimeout(() => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                console.error("Print failed:", e);
            } finally {
                // Wait for print dialog to close or just leave it for a bit
                // Removing immediately might break print in some browsers
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }
        }, 500);
    };

    // Truncate title for label
    const truncateTitle = (text, maxLength = 50) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

                {/* Header */}
                <div className="bg-[#020463] px-6 py-5 flex items-center justify-between no-print">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Printer className="text-white" size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Print Label</h2>
                            <p className="text-white/70 text-sm">Spine label with QR & Barcode</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition text-white/70 hover:text-white"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Label Preview Area */}
                <div className="p-6 bg-gray-50 flex justify-center max-h-[60vh] overflow-y-auto">
                    <div ref={printRef} className="print-area w-full">
                        {/* Grid for multiple labels */}
                        <div className="print-grid grid grid-cols-1 gap-4 w-full">
                            {(asset ? [asset] : (book?.assets?.length > 0 ? book.assets : [{ asset_code: book?.isbn || 'NO-CODE' }])).map((item, index) => (
                                <div
                                    key={index}
                                    className="print-label-container bg-white border-2 border-dashed border-gray-300 rounded-lg mx-auto page-break-avoid"
                                    style={{ width: '3in', height: '2in', position: 'relative', overflow: 'hidden' }}
                                >
                                    {/* Spine Label Layout (2x3 vertical) */}
                                    <div className="flex flex-col h-full bg-white relative">

                                        {/* HEADER: Library Initials */}
                                        <div className="bg-[#020463] text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-widest leading-none">
                                            PCLU LIB
                                        </div>

                                        {/* TOP: Call Number (Most prominent for shelving) */}
                                        <div className="pt-2 px-2 text-center">
                                            <div className="font-extrabold text-2xl font-sans text-slate-900 leading-none tracking-tight">
                                                {book?.call_number ? book.call_number.split(' ')[0] : 'REF'}
                                            </div>
                                            <div className="font-bold text-lg font-sans text-slate-800 leading-tight">
                                                {book?.call_number ? book.call_number.split(' ').slice(1).join(' ') : '000'}
                                            </div>
                                        </div>

                                        {/* MIDDLE: QR Code (Scannable) */}
                                        <div className="flex-1 flex flex-col items-center justify-center py-1">
                                            <div className="bg-white p-1 rounded-lg border-2 border-slate-900">
                                                <QRCodeSVG
                                                    value={item.asset_code || barcodeValue}
                                                    size={80}
                                                    level="M"
                                                    bgColor="#FFFFFF"
                                                    fgColor="#000000"
                                                />
                                            </div>
                                            <div className="text-[10px] font-mono font-bold mt-1 tracking-widest text-slate-600">
                                                {item.asset_code || barcodeValue}
                                            </div>
                                        </div>

                                        {/* BOTTOM: Book Metadata */}
                                        <div className="px-2 pb-2 text-center">
                                            <div className="font-bold text-[10px] leading-tight line-clamp-2 text-slate-900 mb-0.5">
                                                {truncateTitle(book?.title || 'Unknown Title', 40).toUpperCase()}
                                            </div>
                                            {book?.subtitle && (
                                                <div className="text-[8px] text-slate-700 leading-tight italic truncate mb-0.5">
                                                    {truncateTitle(book.subtitle, 30)}
                                                </div>
                                            )}
                                            <div className="text-[9px] text-slate-500 truncate leading-none">
                                                {book?.author ? book.author.split(',')[0] : 'Unknown'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="px-6 pb-4 text-center no-print">
                    <p className="text-sm text-gray-500">
                        Label size: 2" × 3" (sticky spine label)
                    </p>
                </div>

                {/* Actions */}
                <div className="p-4 border-t bg-gray-50 flex gap-3 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-[#020463] text-white py-3 rounded-xl hover:bg-[#1a1c7a] transition font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Printer size={18} /> Print Label
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
