import type { Base64Request, Base64Response } from "@/types/base64";

/**
 * Clean up Base64 string by removing data URI prefix and whitespace
 */
function cleanBase64(s: string): string {
    if (s.startsWith("data:")) {
        const parts = s.split(",", 2);
        if (parts.length === 2) {
            s = parts[1];
        }
    }
    return s.replace(/\s/g, '');
}

/**
 * UTF-8 safe btoa
 */
function utf8_to_b64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
}

/**
 * UTF-8 safe atob
 */
function b64_to_utf8(str: string): string {
    return decodeURIComponent(escape(atob(str)));
}

/**
 * Process Base64 operations
 */
function process_data(request: Base64Request): Base64Response {
    const { mode, data, url_safe, mime_type } = request;

    try {
        let result: string | number[] = "";
        let original_size = 0;

        if (mode === 'text_encode') {
            const text = typeof data === 'string' ? data : new TextDecoder().decode(new Uint8Array(data as number[]));
            original_size = text.length;
            result = utf8_to_b64(text);
            
            if (url_safe) {
                result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }
            
            if (mime_type) {
                result = `data:${mime_type};base64,${result}`;
            }
        } 
        else if (mode === 'text_decode') {
            let encoded = typeof data === 'string' ? data : new TextDecoder().decode(new Uint8Array(data as number[]));
            encoded = cleanBase64(encoded);
            original_size = encoded.length;

            if (url_safe) {
                encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
                while (encoded.length % 4) encoded += '=';
            }

            try {
                result = b64_to_utf8(encoded);
            } catch (e) {
                // If not UTF-8, return as byte array
                const binary = atob(encoded);
                result = Array.from(new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i)));
            }
        }
        else if (mode === 'file_encode') {
            const bytes = data instanceof Uint8Array ? data : new Uint8Array(data as number[]);
            original_size = bytes.length;
            
            let binary = "";
            const chunk_size = 8192;
            for (let i = 0; i < bytes.length; i += chunk_size) {
                binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk_size)));
            }
            
            result = btoa(binary);

            if (url_safe) {
                result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }
            
            if (mime_type) {
                result = `data:${mime_type};base64,${result}`;
            }
        }
        else if (mode === 'file_decode') {
            let encoded = typeof data === 'string' ? data : new TextDecoder().decode(new Uint8Array(data as number[]));
            encoded = cleanBase64(encoded);
            original_size = encoded.length;

            if (url_safe) {
                encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
                while (encoded.length % 4) encoded += '=';
            }

            const binary = atob(encoded);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            result = Array.from(bytes);
        }

        const size = result.length;
        const is_large = size > 1048576; // 1MB
        
        // Generate preview
        let preview = "";
        if (typeof result === 'string') {
            preview = is_large ? result.substring(0, 1000) + "..." : result;
        } else if (Array.isArray(result)) {
            // It's a byte array
            try {
                const previewBytes = new Uint8Array(result.slice(0, 1000));
                preview = new TextDecoder().decode(previewBytes);
                if (size > 1000) {
                    preview += "...";
                }
            } catch (e) {
                preview = `[Binary Data: ${size} bytes]`;
            }
        }

        return {
            success: true,
            result,
            preview,
            size,
            original_size,
            is_large
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.message || String(error)
        };
    }
}

self.onmessage = (event: MessageEvent) => {
    const { type, action, data, id } = event.data;

    if (type !== "EXECUTE") return;

    if (action === "process") {
        const result = process_data(data);
        self.postMessage({ type: "RESULT", data: result, id });
    }
};

// Immediate ready signal
console.log("Worker: Base64 TS Worker Ready");
self.postMessage({ type: "READY" });
