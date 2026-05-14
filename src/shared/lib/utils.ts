import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS classes using clsx and tailwind-merge.
 * 
 * This ensures that conflicting Tailwind classes are resolved correctly 
 * (e.g., 'p-4 p-2' becomes 'p-2').
 *
 * @param inputs - Variadic list of class values, objects, or arrays.
 * @returns A single string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a numeric byte value into a human-readable string (e.g., 1.5 KB).
 * 
 * @param bytes - The number of bytes to format.
 * @param decimals - The number of decimal places to include (default: 2).
 * @returns A formatted string with the appropriate unit (Bytes to YB).
 */
export function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
