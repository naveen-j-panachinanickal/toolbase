# Secret Redact Tool

## Overview

The Secret Redact Tool is a privacy-first, client-side application designed to sanitize text and files containing sensitive information. It runs entirely in the browser using a Rust + WebAssembly engine, ensuring that your secrets, PII, and sensitive logs never leave your device.

## Features

- **Partial/Full Redaction**: Choose to completely hide secrets or show partial hints (e.g., `sk_live_...1234`).
- **Custom Patterns**: Add custom Regex patterns or literal strings to redact.
- **Smart Detection**: Automatically detects common secrets (API keys, email addresses, credit cards, IP addresses, etc.).
- **File Support**: Upload `.txt`, `.log`, `.json`, `.csv` files for bulk redaction.
- **Security Audit**: Instant feedback on how many secrets were neutralized.

## Privacy Guarantee

- **No Server Uploads**: All processing happens in a Web Worker on your machine.
- **No External APIs**.
- **No Telemetry**.

## Architecture

- **Frontend**: React (Next.js)
- **Engine**: Rust (compiled to WebAssembly)
- **Worker**: `redact.worker.ts` executes the WASM redaction engine off the main thread.

## Usage

1. Paste text or upload a file.
2. Select redaction style (Partial/Full/Hash).
3. (Optional) Add custom keys or patterns to target.
4. Click "Redact Now".
5. Copy the sanitized output.
