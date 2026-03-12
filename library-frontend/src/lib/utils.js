import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

import { ASSET_URL } from '../axios-client';

export const getStorageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // The path in the database is relative to the public folder (e.g., 'uploads/books/...')
    // Just append it directly to the base URL
    return `${ASSET_URL}/${path.replace(/^\/+/, '')}`;
};
