# Tool Catalog

This is the product-level inventory of tools and owners.

## Current Tools
1. Magic PDF
2. Pixel Axe
3. Data Lens
4. Redact Secrets
5. Open Draw
6. Base64
7. JSON to Interface
8. Ping Tester
9. Speed Test
10. PasswordX
11. OmniParse
12. Data Forge
13. Archive Kit

## Source of Truth
- Runtime tool metadata and route registry:
  - `src/config/tools.registry.ts`

## Governance Rule
Any tool addition, rename, or route change must update:
1. `src/config/tools.registry.ts`
2. Tool route under `src/app/(tools)/<tool>`
3. This catalog and relevant product docs
