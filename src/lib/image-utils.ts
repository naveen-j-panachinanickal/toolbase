/**
 * Utility functions for handling images purely on the frontend without relying
 * on backend workers, for simple metadata extraction.
 */

export interface ImageInfo {
    width: number;
    height: number;
    format: string;
    size_bytes: number;
}

export async function getImageInfo(file: File): Promise<ImageInfo> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            
            // Extract format from file.type (e.g., 'image/jpeg' -> 'JPEG')
            let format = file.type.split('/')[1]?.toUpperCase() || 'JPEG';
            if (format === 'JPG') format = 'JPEG';
            
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
                format: format,
                size_bytes: file.size
            });
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image into browser DOM"));
        };
        
        img.src = url;
    });
}
