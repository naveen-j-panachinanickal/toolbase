# Contributing to Toolbase

First off — thank you for being here. Toolbase exists because people like you believe that powerful tools should be free, private, and open.

---

## Our Philosophy (Read This First)

Before writing a single line of code, understand what makes Toolbase different:

1. **Zero data leaves the user's machine.** Every tool must process everything in the browser. No exceptions.
2. **No external API calls.** Tools cannot call third-party APIs with user data.
3. **No server-side processing.** We use WebAssembly (Pyodide) for heavy computation — not servers.
4. **Free forever.** No features are locked behind a subscription. Ever.
5. **Privacy is not a feature. It's the foundation.**

If your contribution violates any of these principles, it will not be merged — no matter how useful it seems.

---

## Ways to Contribute

- 🐛 **Bug fixes** — found something broken? Fix it.
- 🛠️ **New tools** — have a tool idea that fits our philosophy? Build it.
- 📝 **Documentation** — improve READMEs, add examples, fix typos.
- 🎨 **UI/UX improvements** — make the experience more premium.
- ⚡ **Performance** — make existing tools faster.
- ♿ **Accessibility** — make tools usable for everyone.
- 🌍 **Translations** — help us reach more people.

---

## Development Setup

### Prerequisites

- Node.js 20+
- npm 9+
- Git

### Clone and Run

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/toolbase.git
cd toolbase

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:3000
```

### Type Check

```bash
npm run type-check
```

### Lint

```bash
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

### Build

```bash
npm run build
```

---

## How to Add a New Tool

### Step 1 — Open an Issue First

Before building, open a **"New Tool Proposal"** issue using our template. This lets the community give feedback before you invest time building. We'll approve or suggest changes quickly.

### Step 2 — Follow the Tool Contract

Every tool in Toolbase follows this exact folder structure. Do not deviate from it.

```
src/app/tools/[your-tool-name]/
    page.tsx          ← Tool page (Next.js route)
    layout.tsx        ← Tool layout with title, meta description
    README.md         ← What it does, how it works, privacy notes

src/components/features/[your-tool-name]/
    [Feature].tsx     ← One or more feature components

src/types/
    [your-tool-name].ts   ← All TypeScript types for your tool

src/hooks/
    use[YourToolName].ts  ← Tool state and logic hook
```

If your tool uses WebAssembly/Python:
```
src/workers/
    [your-tool-name].worker.ts   ← Web Worker for heavy processing

src/python/tools/[your_tool_name]/
    main.py           ← Python entry point
    __init__.py

src/python/bundles/
    [your_tool_name].bundle.ts   ← Pre-compiled WASM bundle
```

### Step 3 — Register Your Tool

Add your tool to `src/config/tools.registry.ts`. This is the single source of truth for all tool metadata.

```typescript
{
  id: 'your-tool-name',
  name: 'Your Tool Name',
  description: 'One sentence describing what it does.',
  category: 'developer', // see ToolCategory type
  route: '/tools/your-tool-name',
  thumbnail: '/assets/thumbnails/your-tool-name.png',
  tags: ['tag1', 'tag2'],
  wasmPowered: false,
  pythonPowered: false,
  status: 'beta',
  addedAt: '2025-01-01',
  author: 'your-github-username',
}
```

### Step 4 — Write Your Tool's README.md

Every tool must have a `README.md` at `src/app/tools/[your-tool-name]/README.md` that covers:

- What the tool does
- How to use it
- Technical implementation notes
- Privacy notes (what data stays local, what never leaves the machine)

### Step 5 — Write Tests

See our testing guide below. At minimum, write unit tests for your tool's core logic.

---

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/).

```
feat: add image watermark tool
fix: correct base64 padding for binary files
docs: update contributing guide with WASM setup
chore: clean up unused dependencies
test: add unit tests for pdf compression
refactor: migrate tool grid to use registry
```

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `style`

---

## Pull Request Checklist

Before opening a PR, make sure:

- [ ] My code follows the tool folder contract
- [ ] I've registered my tool in `tools.registry.ts` (if adding a tool)
- [ ] I've written a `README.md` for my tool
- [ ] I've added TypeScript types to `src/types/`
- [ ] I've written tests for core logic
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run build` succeeds
- [ ] My tool processes everything in the browser — no external API calls
- [ ] No test data files (CSV, JSON, etc.) are committed to the repo

---

## Code Style

- TypeScript strict mode — no `any` types without justification
- Tailwind for all styling — no inline styles, no CSS modules
- Functional components only — no class components
- Named exports for components — no default exports except for Next.js pages
- Snake_case for Python files, camelCase for TypeScript

---

## Getting Help

- Open a [Discussion](https://github.com/toolbase/toolbase/discussions) for questions
- Join our community (link coming soon)
- Tag your issue with `good first issue` if you're new

---

## Recognition

Every contributor is credited in our repository. When you add a tool, your GitHub username appears in the tool registry as the `author`. We believe in recognizing the humans who make this possible.

---

*By contributing to Toolbase, you agree that your contributions will be licensed under the MIT License.*
