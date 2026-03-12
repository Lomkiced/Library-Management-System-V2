import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosClient from "../axios-client";

// Context for library-wide settings
const LibrarySettingsContext = createContext(null);

// Default settings fallback
const DEFAULT_SETTINGS = {
    library_name: "Library System",
    default_loan_days: 7,
    max_loans_per_student: 3,
    fine_per_day: 5
};

export function LibrarySettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    // Fetch settings from the public circulation endpoint
    const fetchSettings = useCallback(async (force = false) => {
        // Skip if recently fetched (within 5 minutes) unless forced
        if (!force && lastFetch && (Date.now() - lastFetch) < 300000) {
            return;
        }

        try {
            setLoading(true);
            const res = await axiosClient.get('/settings/circulation');
            if (res.data) {
                setSettings({
                    library_name: res.data.library_name || DEFAULT_SETTINGS.library_name,
                    default_loan_days: res.data.default_loan_days || DEFAULT_SETTINGS.default_loan_days,
                    max_loans_per_student: res.data.max_loans_per_student || DEFAULT_SETTINGS.max_loans_per_student,
                    fine_per_day: res.data.fine_per_day || DEFAULT_SETTINGS.fine_per_day
                });
                setLastFetch(Date.now());
                setError(null);
            }
        } catch (err) {
            console.error('Failed to fetch library settings:', err);
            setError('Failed to load settings');
            // Keep existing settings on error
        } finally {
            setLoading(false);
        }
    }, [lastFetch]);

    // Fetch on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    // Listen for settings updates (when saved from Settings page)
    // This allows real-time updates across the app
    const refreshSettings = useCallback(() => {
        fetchSettings(true);
    }, [fetchSettings]);

    // Computed values
    const libraryName = settings.library_name;
    const libraryShortName = settings.library_name?.split(' ')[0] || 'Library';

    const value = {
        settings,
        libraryName,
        libraryShortName,
        loading,
        error,
        refreshSettings
    };

    return (
        <LibrarySettingsContext.Provider value={value}>
            {children}
        </LibrarySettingsContext.Provider>
    );
}

// Custom hook for consuming the context
export function useLibrarySettings() {
    const context = useContext(LibrarySettingsContext);
    if (!context) {
        // Return defaults if used outside provider (graceful degradation)
        return {
            settings: DEFAULT_SETTINGS,
            libraryName: DEFAULT_SETTINGS.library_name,
            libraryShortName: 'Library',
            loading: false,
            error: null,
            refreshSettings: () => { }
        };
    }
    return context;
}

export default LibrarySettingsContext;
