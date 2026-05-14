# Base64 Encode/Decode Tool

## Overview

The Base64 Tool provides a fast, secure, and private way to encode and decode data using Base64 directly in your browser. Whether you're working with simple text strings, large files, or images, this tool handles it all without ever sending your data to a server.

## Features

- **Text & File Support**: Convert text strings or upload files (images, PDFs, binaries) for conversion.
- **Real-time Processing**: See results instantly as you type (for text).
- **Image Preview**: Automatically detects and previews Base64-encoded images.
- **Large File Handling**: Optimized to handle larger files (100MB+) efficiently using WebAssembly.
- **Advanced Options**:
  - **URL Safe**: Toggle URL-safe encoding (replacing `+`/`/` with `-`/`_`).
  - **MIME Headers**: Option to include Data URI schemes (e.g., `data:image/png;base64,...`).

## Privacy Guarantee

- **Client-Side Only**: All encoding and decoding logic runs locally in your browser using Python (via Pyodide) in a Web Worker.
- **Zero Uploads**: No file data is ever transmitted over the network.

## technical Details

- **Engine**: Python `base64` module running in WASM.
- **Performance**: Heavy lifting is offloaded to a dedicated Web Worker to keep the UI responsive.
