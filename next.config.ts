// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Toolbase Contributors

import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Set to true to disable service worker in development
  disable: false,
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Cache Pyodide WASM files aggressively — they're large and rarely change
  workboxOptions: {
    runtimeCaching: [
      // Pyodide WASM and Python packages — cache-first, very long TTL
      {
        urlPattern: /pyodide/,
        handler: "CacheFirst",
        options: {
          cacheName: "pyodide-cache",
          expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 }, // 90 days
        },
      },
      // Static assets (images, icons, fonts) — cache-first
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
        },
      },
      // Next.js JS bundles — stale-while-revalidate
      {
        urlPattern: /\/_next\//,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-chunks",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
        },
      },
      // Home/gallery page — network-first so new tools appear promptly
      {
        urlPattern: /^https?:\/\/.*\/$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "start-url",
          expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
        },
      },
      // Tool pages — network-first for fresh content, falls back to cache
      {
        urlPattern: /^https?:\/\/.*\/(?:magic-pdf|pixel-axe|data-lens|redact-secrets|base64|json-to-interface|open-draw|ping-tester|speed-test|passwordx)/,
        handler: "NetworkFirst",
        options: {
          cacheName: "tool-pages",
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Silence Next.js 16's "webpack config but no turbopack config" error.
  // @ducanh2912/next-pwa injects a webpack plugin; the app runs fine
  // under Turbopack with no additional Turbopack-specific config.
  turbopack: {},
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
      {
        source: "/imgly/(.*)",
        headers: [
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
