# Pixels

## Overview

A powerful image processing toolbase running entirely in your browser. Compress, resize, upscale images and hide secret messages using steganography — no uploads, no waiting, no privacy risk.

## Features

- **Compress**: Reduce image file size without visible quality loss (JPEG, PNG, WebP)
- **Resize**: Resize to exact pixel dimensions with smart aspect-ratio controls
- **Upscale**: Increase image resolution using advanced interpolation algorithms
- **Steganography**: Hide secret text messages inside images; extract hidden messages
- **File Locking**: Password-encrypt images for secure sharing
- **Format Conversion**: Convert between PNG, JPEG, and WebP

## How to Use

1. Drop an image onto the tool (or click to pick a file)
2. Select an operation from the toolbar
3. Adjust settings as needed
4. Download the result

## Privacy Guarantee

- **No uploads** — all processing happens inside your browser using Python (Pyodide/WASM)
- **No server** — your images never leave your machine
- **No account** — open and use, instantly

## Technical Details

- **Core**: Python via Pyodide — uses Pillow for image manipulation
- **Worker**: `pixels.worker.ts` offloads processing to a Web Worker
- **Bundle**: `pixels.bundle.ts` contains the pre-compiled Python WASM bundle

## Limits

- Very large images (>50 MB) may be slow on lower-end devices due to WASM memory constraints
- Upscaling beyond 4× may have reduced quality depending on source resolution
