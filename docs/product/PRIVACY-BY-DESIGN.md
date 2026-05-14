# Privacy by Design Architecture

## Overview
Toolbase is built on the principle of **Zero-Trust Computing**. We believe that your data should never leave your browser. This document explains the technical implementation of our privacy guarantees.

## 1. Local-Only Processing
Unlike traditional "cloud" tools, Toolbase does not have a processing backend. 
- **The Browser is the Server**: Your data is loaded into the browser's RAM, processed by WASM/Python engines, and returned directly to the UI.
- **Zero Storage**: Once you close the tab, the in-memory data is purged. We do not use databases for your files.

## 2. Worker Isolation
Every heavy-compute tool runs in a dedicated **Web Worker**.
- **Sandbox Environment**: Workers run in a separate thread from the main UI, preventing scripts from accessing cookies or session storage of other sites.
- **No Network Policy**: Toolbase workers are designed to never make outgoing `fetch` or `XHR` requests. 

## 3. The "Privacy Proof" Panel
We provide users with a "Privacy Proof" badge on every tool page. This isn't just a label—it's a transparency portal that shows:
- **Engine Type**: Whether the tool is using WebAssembly (compiled Rust) or Python (Pyodide).
- **Bytes Sent**: A live monitor confirming 0 bytes have been transmitted to any network during processing.
- **DevTools Verification**: Instructions on how users can verify these claims themselves using the browser's Network tab.

## 4. Encryption & Persistence
For tools that require persistence (like `PasswordX` or `NoteVault`):
- **AES-256 Encryption**: All data is encrypted using a user-provided master key before being saved to `localStorage`.
- **No Key Storage**: Master keys are never stored. If you lose your key, the data is unrecoverable even by us.

## 5. Third-Party Dependencies
- **Strict Auditing**: We minimize the use of third-party libraries that require external connections.
- **Local Assets**: All fonts, icons, and scripts are served from our own domain to prevent cross-site tracking.

## 6. Telemetry & Tracking
- **No Personal Data**: We do not collect names, emails, or IP addresses.
- **Privacy-Friendly Analytics**: If analytics are used, they are strictly for site performance (LCP/TBT) and do not track individual user behavior or file content.

---
*Created: May 2026*
*Part of the Toolbase Product Standards*
