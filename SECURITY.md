# Security Policy

## Toolbase's Security Model

Toolbase is built on a fundamental principle: **your data never leaves your machine.**

Here's what that means technically:

- All file processing happens inside your browser using WebAssembly (Pyodide)
- No user files, inputs, or outputs are transmitted to any server
- No analytics that capture file content or personal data
- No third-party APIs receive your data
- Everything runs as client-side JavaScript and WASM — you can inspect every byte

This architecture means the traditional attack surface (server-side data breaches, API key leaks, database dumps) simply does not exist for Toolbase. Your files are processed in your browser's sandboxed environment and stay there.

---

## Scope

### In Scope

Security issues we want to know about:

- Client-side vulnerabilities that could allow malicious files to escape the browser sandbox
- Cross-site scripting (XSS) vulnerabilities
- Content Security Policy (CSP) bypasses
- Vulnerabilities in our WASM/Pyodide integration that could allow code execution outside the sandbox
- Supply chain vulnerabilities in our dependencies
- Any mechanism by which user data could be silently exfiltrated
- Vulnerabilities in our build pipeline that could result in tampered code being served

### Out of Scope

- Issues in third-party dependencies that are already publicly known (report to them directly)
- Vulnerabilities that require physical access to the user's machine
- Social engineering attacks against users
- Theoretical vulnerabilities without a proof of concept

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities as public GitHub issues.**

To report a vulnerability, use GitHub's private [Security Advisory](https://github.com/toolbase/toolbase/security/advisories/new) feature.

Include:
1. A description of the vulnerability
2. Steps to reproduce it
3. The potential impact
4. Any suggested fixes (optional but appreciated)

We will acknowledge your report within **48 hours** and aim to release a fix within **7 days** for critical issues.

---

## Responsible Disclosure

We follow responsible disclosure principles. If you report a valid vulnerability:

- We will work with you to understand and fix it
- We will credit you in our changelog (unless you prefer to remain anonymous)
- We ask that you give us reasonable time to fix the issue before any public disclosure

---

## Dependency Security

We use `npm audit` in our CI pipeline to catch known vulnerabilities in dependencies. If you notice an outdated or vulnerable dependency, opening a regular GitHub issue or PR is appropriate.

---

*Last updated: 2025*
