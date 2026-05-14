import qrcode, { QRCodeErrorCorrectionLevel } from 'qrcode';
import jsQR from 'jsqr';

/**
 * Parses hex color (e.g., "#RRGGBB") into RGBA numbers.
 */
function hexToRgba(hex: string): [number, number, number, number] {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255, 255];
}

async function process_generate(request: any): Promise<any> {
  const { data, text, size = 220, error_correction = 'Q', dark_color = '#000000', light_color = '#ffffff', logo_size = 22 } = request;
  
  // Create raw QR matrix
  const qr = qrcode.create(text || 'https://toolbase.app', { errorCorrectionLevel: error_correction as QRCodeErrorCorrectionLevel });
  const modules = qr.modules;
  const modSize = modules.size;
  
  // We want the final image to be `size` pixels.
  // Add quiet zone (4 modules on each side)
  const margin = 4;
  const totalModSize = modSize + margin * 2;
  const scale = Math.max(1, Math.floor(size / totalModSize));
  const finalSize = totalModSize * scale;

  const canvas = new OffscreenCanvas(finalSize, finalSize);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get OffscreenCanvas 2D context');

  const darkRgba = hexToRgba(dark_color);
  const lightRgba = hexToRgba(light_color);

  // Fill background
  ctx.fillStyle = `rgba(${lightRgba.join(',')})`;
  ctx.fillRect(0, 0, finalSize, finalSize);

  // Draw modules
  ctx.fillStyle = `rgba(${darkRgba.join(',')})`;
  for (let row = 0; row < modSize; row++) {
    for (let col = 0; col < modSize; col++) {
      if (modules.data[row * modSize + col]) {
        const x = (col + margin) * scale;
        const y = (row + margin) * scale;
        // Instead of sharp squares, optionally we can draw slightly rounded or standard squares. We do standard.
        ctx.fillRect(x, y, scale, scale);
      }
    }
  }

  // Handle Logo Overlay if data is provided and is an image (we check if it's >0 bytes, if so it might be an image)
  // Toolbase TIP payloads: data is Uint8Array
  if (data && data.length > 0) {
    try {
      const blob = new Blob([data]);
      const bitmap = await createImageBitmap(blob);
      
      const ls = Math.round(finalSize * (logo_size / 100));
      const x = Math.round((finalSize - ls) / 2);
      const y = Math.round((finalSize - ls) / 2);
      const pad = Math.round(ls * 0.13);

      // Draw white rounded rect backing
      const rx = x - pad, ry = y - pad, rw = ls + pad * 2, rh = ls + pad * 2, r = 8;
      ctx.fillStyle = `rgba(${lightRgba.join(',')})`;
      ctx.beginPath();
      ctx.moveTo(rx + r, ry);
      ctx.lineTo(rx + rw - r, ry);
      ctx.arcTo(rx + rw, ry, rx + rw, ry + r, r);
      ctx.lineTo(rx + rw, ry + rh - r);
      ctx.arcTo(rx + rw, ry + rh, rx + rw - r, ry + rh, r);
      ctx.lineTo(rx + r, ry + rh);
      ctx.arcTo(rx, ry + rh, rx, ry + rh - r, r);
      ctx.lineTo(rx, ry + r);
      ctx.arcTo(rx, ry, rx + r, ry, r);
      ctx.closePath();
      ctx.fill();

      ctx.drawImage(bitmap, x, y, ls, ls);
    } catch (e) {
      console.warn("Logo overlay failed or data wasn't an image", e);
    }
  }

  const outBlob = await canvas.convertToBlob({ type: 'image/png' });
  const outBuffer = await outBlob.arrayBuffer();
  
  return {
    success: true,
    result: Array.from(new Uint8Array(outBuffer))
  };
}

async function process_decode(request: any): Promise<any> {
  const { data } = request;
  if (!data || data.length === 0) throw new Error('No image data provided for decoding');

  const blob = new Blob([data]);
  const bitmap = await createImageBitmap(blob);
  
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  ctx.drawImage(bitmap, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });
  if (!code) {
    // Try inverted
    code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'onlyInvert' });
  }

  if (!code) {
    throw new Error('No QR code detected in image');
  }

  return {
    success: true,
    result: code.data
  };
}

self.onmessage = async (event: MessageEvent) => {
  const { type, action, data, id } = event.data;
  if (type !== "EXECUTE") return;

  try {
    let result;
    if (action === "generate") {
      result = await process_generate(data);
    } else if (action === "decode") {
      result = await process_decode(data);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
    self.postMessage({ type: "RESULT", data: result, id });
  } catch (err: any) {
    self.postMessage({ type: "RESULT", data: { success: false, error: err.message || String(err) }, id });
  }
};

console.log("Worker: QR Forge TS Worker Ready");
self.postMessage({ type: "READY" });
