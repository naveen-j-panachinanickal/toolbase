# Toolbase

> Every tool you need. Zero data leaves your machine.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/toolbase/toolbase/actions/workflows/ci.yml/badge.svg)](https://github.com/toolbase/toolbase/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Powered by WebAssembly](https://img.shields.io/badge/Powered%20by-WebAssembly-654ff0)](https://webassembly.org)
[![Built with Pyodide](https://img.shields.io/badge/Python-Pyodide-3776ab)](https://pyodide.org)

---

## What is Toolbase?

Toolbase is a privacy-first, browser-native toolbase — a single platform where every tool you need lives in one place, and every operation happens entirely on your machine.

No uploads. No servers. No subscriptions. No compromises.

Whether you're compressing a PDF, analyzing a dataset, redacting secrets from config files, or building a diagram — Toolbase processes everything locally using WebAssembly. Your files never leave your browser.

---

## Why Toolbase?

| Feature                   | Toolbase            | Typical Online Tools       |
| ------------------------- | ------------------- | -------------------------- |
| Files processed locally   | ✅ Always           | ❌ Uploaded to servers     |
| Free to use               | ✅ Forever          | ⚠️ Freemium / paywalled    |
| Works offline             | ✅ PWA support      | ❌ Requires internet       |
| Open source               | ✅ MIT License      | ❌ Proprietary             |
| No account required       | ✅ Never            | ⚠️ Often required          |
| No data retention         | ✅ Nothing stored   | ❌ Files stored on servers |
| Python-powered processing | ✅ Via Pyodide/WASM | N/A                        |

---

## Tools

| Tool                 | Category  | Description                                    | Engine        |
| -------------------- | --------- | ---------------------------------------------- | ------------- |
| 🔮 Magic PDF         | PDF       | Compress, merge, split, protect, sign, convert | Python + WASM |
| 🪓 Pixel Axe         | Image     | Compress, resize, upscale, steganography       | Python + WASM |
| 🔍 Data Lens         | Data      | SQL + Python analysis on CSV/JSON              | Python + WASM |
| 🔒 Redact Secrets    | Security  | Scan and redact API keys, passwords, tokens    | Python + WASM |
| 🎨 Open Draw         | Drawing   | Diagrams, flowcharts, architecture charts      | Browser JS    |
| 🔤 Base64            | Developer | Encode/decode text, files, images              | Browser JS    |
| 📐 JSON to Interface | Developer | Convert JSON to TypeScript interfaces          | Browser JS    |
| 📡 Ping Tester       | Network   | Test host latency and reachability             | Browser JS    |
| ⚡ Speed Test        | Network   | Measure download/upload speed                  | Browser JS    |

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) (TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **WebAssembly:** [Pyodide](https://pyodide.org) — Python in the browser
- **Processing:** Web Workers — heavy tasks never block the UI
- **Architecture:** 100% client-side — zero backend

---

## Getting Started

### Use it online

Visit **[toolbase.in](https://toolbase.in)** — no install needed.

### Run locally

```bash
# Clone the repo
git clone https://github.com/toolbase/toolbase.git
cd toolbase

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

```bash
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

---

## Contributing

Toolbase is open source and we welcome contributions of all kinds — new tools, bug fixes, performance improvements, documentation, and more.

Read our [Contributing Guide](CONTRIBUTING.md) to get started. It covers:

- Our philosophy and non-negotiables
- How to add a new tool (with the exact folder structure)
- Commit message conventions
- PR checklist

**Good first issues** are tagged with [`good first issue`](https://github.com/toolbase/toolbase/labels/good%20first%20issue) on GitHub.

---

## Documentation

Project docs are organized under [`docs/`](./docs/README.md):

- Architecture and standards
- Engineering workflow and quality gates
- Product catalog and operational playbooks
- Governance links (Code of Conduct, Contributing, Security, License)

---

## Security

Toolbase's security model is simple: **nothing leaves the browser.** All processing happens in your browser's sandboxed environment using WebAssembly.

If you discover a security vulnerability, please use [GitHub's private Security Advisory](https://github.com/toolbase/toolbase/security/advisories/new) to report it. See our [Security Policy](SECURITY.md) for full details.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

_Built with ❤️ for privacy, by people who believe powerful tools should be free._
