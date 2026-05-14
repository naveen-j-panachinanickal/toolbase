# Magic PDF Workspace

## Overview

A comprehensive set of PDF utilities running natively in your browser. Merge, split, compress, and organize PDF documents with the security of a local desktop application.

## Features

- **Merge PDFs**: Combine multiple PDF files into a single document.
- **Split PDFs**: Extract specific pages or split documents into individual pages.
- **Compress**: Reduce file size while maintaining quality.
- **Organize**: Rotate, reorder, or delete pages.
- **Privacy First**: No file uploads. Everything is processed locally.

## Privacy Guarantee

- **Local PDF Engine**: Uses advanced WASM-based PDF libraries to manipulate files directly in memory.
- **No data leaks**: Your sensitive documents never leave your computer.

## Technical Details

- **Core**: Python-based PDF manipulation capabilities (e.g., `pypdf`, `pdfminer`) running on Pyodide.
- **Performance**: Optimized for handling standard business documents efficiently.
