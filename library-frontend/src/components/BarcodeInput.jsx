import { useState, useRef, useEffect } from "react";
import axiosClient from "../axios-client";
import { Scan, Check, X, Loader2 } from "lucide-react";

/**
 * BarcodeInput Component
 * Detects barcode scanner input (rapid typing) and triggers lookup
 * 
 * Props:
 * - onScan: (barcode: string) => void - Called when barcode is scanned
 * - onResult: (result: object) => void - Called with API lookup result
 * - placeholder: string - Input placeholder text
 * - disabled: boolean - Disable the input
 */
export default function BarcodeInput({
    onScan,
    onResult,
    placeholder = "Scan barcode or type manually...",
    disabled = false,
    autoFocus = false
}) {
    const [value, setValue] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const inputRef = useRef(null);
    const lastKeyTime = useRef(0);
    const keyBuffer = useRef("");

    // Auto-focus on mount if specified
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Detect rapid input (barcode scanner pattern)
    const handleKeyDown = (e) => {
        const now = Date.now();
        const timeDiff = now - lastKeyTime.current;

        // If Enter key pressed and we have buffered input
        if (e.key === "Enter") {
            e.preventDefault();
            if (value.trim()) {
                triggerScan(value.trim());
            }
            return;
        }

        // Track time between keystrokes
        // Barcode scanners typically type < 50ms between characters
        if (timeDiff < 50) {
            keyBuffer.current += e.key;
        } else {
            keyBuffer.current = e.key;
        }

        lastKeyTime.current = now;
    };

    const handleChange = (e) => {
        setValue(e.target.value);
        setLastResult(null);
    };

    const triggerScan = async (barcode) => {
        setIsScanning(true);
        setLastResult(null);

        try {
            // Call the onScan callback
            if (onScan) {
                onScan(barcode);
            }

            // Make API call for lookup using axiosClient
            const response = await axiosClient.get(`/books/lookup/${encodeURIComponent(barcode)}`);
            const data = response.data;

            setLastResult(data);

            if (onResult) {
                onResult(data);
            }

            // Clear input after successful scan
            if (data.found) {
                setValue("");
            }
        } catch (error) {
            const errorData = error.response?.data || { found: false, message: "Book not found" };
            setLastResult(errorData);
            if (onResult) {
                onResult(errorData);
            }
        } finally {
            setIsScanning(false);
        }
    };

    const handleClear = () => {
        setValue("");
        setLastResult(null);
        inputRef.current?.focus();
    };

    return (
        <div className="space-y-2">
            <div className="relative">
                <Scan
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isScanning ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`}
                    size={20}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || isScanning}
                    placeholder={placeholder}
                    className={`w-full pl-11 pr-10 py-3 border-2 rounded-xl text-lg font-mono outline-none transition-all
            ${isScanning
                            ? 'border-blue-400 bg-blue-50'
                            : lastResult?.found
                                ? 'border-green-400 bg-green-50'
                                : lastResult && !lastResult.found
                                    ? 'border-red-400 bg-red-50'
                                    : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                        }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isScanning && <Loader2 className="text-blue-500 animate-spin" size={20} />}
                    {!isScanning && lastResult?.found && <Check className="text-green-500" size={20} />}
                    {!isScanning && lastResult && !lastResult.found && <X className="text-red-500" size={20} />}
                    {!isScanning && !lastResult && value && (
                        <button onClick={handleClear} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-slate-500">
                    {isScanning ? 'Scanning...' : 'Ready to scan'}
                </span>
                <span className="text-slate-400 ml-auto">
                    Press Enter or scan barcode
                </span>
            </div>
        </div>
    );
}
