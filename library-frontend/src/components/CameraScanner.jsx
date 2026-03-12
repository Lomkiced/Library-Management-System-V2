import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Loader2, AlertTriangle, RotateCcw, Keyboard } from "lucide-react";
import axiosClient from "../axios-client";

/**
 * CameraScanner Component
 * Uses device camera to scan QR codes and barcodes
 * 
 * Props:
 * - onResult: (result: object) => void - Called with API lookup result
 * - onClose: () => void - Called when scanner is closed
 */
export default function CameraScanner({ onResult, onClose }) {
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastScanned, setLastScanned] = useState(null);
    const scannerRef = useRef(null);
    const html5QrcodeRef = useRef(null);
    const isMounted = useRef(true);
    const videoRef = useRef(null); // Reference to the actual video element

    useEffect(() => {
        isMounted.current = true;

        // GLOBAL ERROR SUPPRESSION for html5-qrcode
        // The library throws an uncaught error when we force-kill the camera stream.
        // We suppress it here to prevent it from cluttering the console or triggering crash reporters.
        const suppressCameraErrors = (event) => {
            if (event && event.message && (
                event.message.includes("RenderedCameraImpl") ||
                event.message.includes("onabort")
            )) {
                event.preventDefault();
                event.stopPropagation();
                // console.debug("Suppressed camera library error");
                return true;
            }
        };
        window.addEventListener('error', suppressCameraErrors);

        // Initialize scanner on mount
        startScanner();

        // POLL for video element to capture it for cleanup
        const videoPoll = setInterval(() => {
            const video = document.querySelector('#camera-scanner-region video');
            if (video) {
                videoRef.current = video;
            }
        }, 500);

        // Cleanup on unmount
        return () => {
            isMounted.current = false;
            clearInterval(videoPoll);
            window.removeEventListener('error', suppressCameraErrors);
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        if (!isMounted.current) return;

        setError(null);
        setIsLoading(true);

        try {
            // EXPERIMENTAL: Explicitly request permission first to trigger browser prompt reliably
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // We just needed the permission, stop the stream immediately
                stream.getTracks().forEach(track => track.stop());
            } catch (permErr) {
                // If permission denied here, we catch it early
                if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
                    throw new Error("permission_denied");
                }
                // Other errors (like NotFoundError) will be caught later or below
            }

            // Ensure any previous instance is cleared
            if (html5QrcodeRef.current) {
                await stopScanner();
            }

            // Create new instance
            const html5Qrcode = new Html5Qrcode("camera-scanner-region");
            html5QrcodeRef.current = html5Qrcode;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            };

            // Attempt 1: Try environment camera (rear)
            try {
                await html5Qrcode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    onScanFailure
                );
            } catch (startErr) {
                console.warn("Retrying with default camera...", startErr);
                // Attempt 2: Fallback to any available camera (user/front)
                await html5Qrcode.start(
                    { facingMode: "user" },
                    config,
                    onScanSuccess,
                    onScanFailure
                );
            }

            if (isMounted.current) {
                setIsScanning(true);
                setIsLoading(false);

                // Immediately try to find video element
                setTimeout(() => {
                    const video = document.querySelector('#camera-scanner-region video');
                    if (video) videoRef.current = video;
                }, 100);
            } else {
                // If unmounted during start, stop immediately
                stopScanner();
            }

        } catch (err) {
            if (!isMounted.current) return;

            console.error("Camera error:", err);

            // Show user-friendly error messages
            let errorMessage = "Failed to start camera.";
            const errString = err.toString().toLowerCase();

            if (err.message === "permission_denied" || errString.includes("notallowed") || errString.includes("permission")) {
                errorMessage = "🔒 Camera permission denied. Please click the lock icon in the address bar and allow camera access.";
            } else if (errString.includes("notreadable") || errString.includes("device in use")) {
                // Auto-retry once if camera is busy (likely due to fast unmount/remount cleanup lag)
                if (!window.cameraRetryAttempted) {
                    window.cameraRetryAttempted = true;
                    // Camera busy, retrying silently
                    setTimeout(() => startScanner(), 1000);
                    return;
                }
                errorMessage = "📷 Camera is being used by another app. Please close other apps using the camera and try again.";
            } else if (errString.includes("notfound") || errString.includes("no camera")) {
                errorMessage = "❌ No camera found. Please connect a camera and try again.";
            } else if (err.message) {
                errorMessage = err.message;
            }

            window.cameraRetryAttempted = false; // Reset on final failure
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const stopScanner = async () => {
        // ... (existing stop logic) ...
        try {
            if (html5QrcodeRef.current) {
                const scanner = html5QrcodeRef.current;
                try {
                    // Check if scanning before stopping
                    // Note: getState() returns 2 for SCANNING, 3 for PAUSED
                    try {
                        if (scanner.getState() >= 2) {
                            await scanner.stop();
                        }
                    } catch (stateErr) {
                        // Fallback if getState fails
                        await scanner.stop();
                    }
                } catch (stopErr) {
                    // console.warn("Scanner stop warning:", stopErr);
                }

                try {
                    await scanner.clear();
                } catch (clearErr) {
                    // console.warn("Scanner clear warning:", clearErr);
                }
            }
        } catch (err) {
            console.error("Error stopping scanner instances:", err);
        }
        // ... (rest of function) ...
    };

    // Helper to clear retry flag on success
    const onScanSuccess = async (decodedText, decodedResult) => {
        if (!isMounted.current) return;
        window.cameraRetryAttempted = false; // Reset retry flag on success

        // Avoid duplicate scans of the same code
        if (lastScanned === decodedText) return;
        setLastScanned(decodedText);

        // Vibrate on successful scan (if supported)
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // Pause scanner while processing
        if (html5QrcodeRef.current) {
            try {
                // Only pause if actually scanning
                const state = html5QrcodeRef.current.getState();
                if (state === 2) { // Html5QrcodeScannerState.SCANNING
                    await html5QrcodeRef.current.pause(true);
                }
            } catch (e) {
                // Creating a "clean" console by ignoring expected race condition errors
                if (!e.toString().includes("not scanning")) {
                    console.warn("Pause warning:", e);
                }
            }
        }

        if (isMounted.current) setIsLoading(true);

        try {
            // Look up the scanned barcode
            const response = await axiosClient.get(`/books/lookup/${encodeURIComponent(decodedText)}`);
            const data = response.data;

            if (isMounted.current && onResult) {
                onResult(data);
            }

            // Close scanner on successful scan
            await stopScanner();
            if (isMounted.current && onClose) onClose();

        } catch (error) {
            const errorData = error.response?.data || { found: false, message: "Book not found" };

            if (isMounted.current && onResult) {
                onResult(errorData);
            }

            // Resume scanning after a short delay for failed lookups
            if (isMounted.current) {
                setTimeout(async () => {
                    if (!isMounted.current) return;
                    setLastScanned(null);
                    if (html5QrcodeRef.current) {
                        try {
                            await html5QrcodeRef.current.resume();
                        } catch (e) {
                            console.error("Resume error:", e);

                            // If resume fails, it might be stopped, try to restart or handle
                            // But usually, if it fails here, we just let it be.
                        }
                    }
                }, 2000);
            }
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    };

    const onScanFailure = (error) => {
        // Ignore scan failures (no code detected) - this is normal
    };

    const handleRetry = () => {
        setError(null);
        setLastScanned(null);
        startScanner();
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
            {/* Header */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <div className="text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Camera size={24} />
                        Camera Scanner
                    </h3>
                    <p className="text-sm text-white/70">Point camera at QR code or barcode</p>
                </div>
                <button
                    onClick={async () => {
                        await stopScanner();
                        if (onClose) onClose();
                    }}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                >
                    <CameraOff className="text-white" size={24} />
                </button>
            </div>

            {/* Scanner Container */}
            <div className="relative">
                {/* Camera Feed */}
                <div
                    id="camera-scanner-region"
                    ref={scannerRef}
                    className="w-80 h-80 bg-black rounded-lg overflow-hidden"
                />

                {/* Scanning Frame Overlay */}
                {isScanning && !isLoading && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
                            {/* Corner markers */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                        </div>
                        {/* Scan line animation */}
                        <div className="absolute inset-x-4 top-4 h-0.5 bg-green-400 animate-pulse"
                            style={{ animation: 'scanLine 2s ease-in-out infinite' }} />
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-center text-white">
                            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                            <p>Looking up book...</p>
                        </div>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg p-4">
                        <div className="text-center text-white">
                            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                            <p className="text-sm mb-4">{error}</p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleRetry}
                                    className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition w-full"
                                >
                                    <RotateCcw size={18} />
                                    Try Again
                                </button>
                                <button
                                    onClick={() => {
                                        if (onClose) onClose();
                                    }}
                                    className="flex items-center justify-center gap-2 px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition w-full"
                                >
                                    <Keyboard size={18} />
                                    Enter Code Manually
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Indicator */}
            <div className="mt-6 text-center">
                <div className="flex items-center justify-center gap-2 text-white mb-2">
                    <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span>{isScanning ? 'Camera Active' : 'Starting...'}</span>
                </div>
                <p className="text-white/60 text-sm">
                    Supports QR codes, Code128, EAN-13, and other barcode formats
                </p>
            </div>

            {/* Inline styles for scan animation */}
            <style>{`
                @keyframes scanLine {
                    0%, 100% { transform: translateY(0); opacity: 1; }
                    50% { transform: translateY(280px); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
