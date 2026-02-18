'use client';
import NextImage from 'next/image';
import { appIcons } from "@/config/icons";
import { ToolCardProps } from "@/types/tool-search";
import SearchBar from "../components/ui/SearchBar";
import ToolGrid from "../components/ui/ToolGrid";
import { useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const tools: ToolCardProps[] = [
    {
      title: "Redact Secrets",
      toolFolderName: "redact-secrets",
      icon: appIcons['redact-secrets'],
      metadata: ["security", "privacy", "text", "remove", "hide", "clean", "sanitize", "secret"]
    },
    {
      title: "JSON to Interface/Model",
      toolFolderName: "json-to-interface",
      icon: appIcons['json-to-interface'],
      metadata: ["json", "typescript", "interface", "model", "schema", "convert", "generator", "type", "definition"]
    },
    {
      title: "Magic PDF",
      toolFolderName: "magic-pdf",
      icon: appIcons['magic-pdf'],
      metadata: ["pdf", "merge", "split", "compress", "edit", "rearrange", "sign", "protect", "document"]
    },
    {
      title: "Base64 Encode/Decode",
      toolFolderName: "base64",
      icon: appIcons['b64EnDc'],
      metadata: ["base64", "encode", "decode", "string", "binary", "convert", "text", "buffer"]
    },
    {
      title: "DataLens",
      toolFolderName: "data-lens",
      icon: appIcons['data-lens'],
      metadata: ["json", "viewer", "explorer", "data", "analyze", "visualize", "structure", "tree"]
    },
    {
      title: "Ping Tester",
      toolFolderName: "ping-tester",
      icon: appIcons['ping-tester'],
      metadata: ["network", "latency", "icmp", "response time", "connectivity", "internet", "ping"]
    },
    {
      title: "Internet Speed Test",
      toolFolderName: "speed-test",
      icon: appIcons['speed-test'],
      metadata: ["download", "upload", "bandwidth", "internet speed", "connection", "network", "speed"]
    },
    {
      title: "Open Draw",
      toolFolderName: "open-draw",
      icon: appIcons['open-draw'],
      metadata: ["drawing", "sketching", "diagramming", "whiteboard", "collaboration"]
    },
    {
      title: "Pixel Axe",
      toolFolderName: "pixel-axe",
      icon: appIcons['pixel-axe'],
      metadata: ["image", "compress", "optimize", "resize", "convert", "format", "quality", "lossy", "lossless", "stego", "hide", "reveal", "upscale", "hide data in image", "extract data from image", "image info"]
    }

  ];

  return (
    <div>
      <Header />
      <div className="bg-background-light view font-display text-[#1c1c1e] min-h-screen flex flex-col selection:bg-primary/30 antialiased">
        <main className="grow px-6 md:px-20 lg:px-40 py-12 lg:py-16">
          <div className="max-w-[1200px] mx-auto">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-10 max-w-2xl mx-auto leading-snug animate-fade-up">
              The Open Build Network: Browser-based utilities for the privacy-conscious developer.
            </h3>

            <div className="animate-fade-up-delay-1 mb-12">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            <ToolGrid searchQuery={searchQuery} tools={tools} />

            <section className="sm:mt-[72px] animate-from-bottom mt-[42px] pt-[16px] border-t border-black/5 max-w-3xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8e8e93] mb-6 text-center sm:text-left">About the Platform</h2>
              <div className="space-y-6">
                <p className="text-lg md:text-xl leading-relaxed text-[#3a3a3c] font-normal text-center sm:text-left">
                  The Open Build Network (OBN) is a collection of high-performance developer utilities designed with a radical approach to security. Every tool in this suite runs <strong>entirely in your browser</strong> using WebAssembly (WASM) and local processing.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-[#3a3a3c] font-normal text-center sm:text-left">
                  By eliminating server-side requirements, we ensure that your sensitive data—whether it&apos;s source code, PDFs, or database credentials—<strong>never leaves your machine</strong>. This architecture provides the privacy of local desktop software with the accessibility of the web.
                </p>
              </div>
            </section>

            <section className="sm:mt-[72px] animate-from-bottom mt-[42px] py-16 rounded-3xl bg-black/3 border border-black/5 max-w-4xl mx-auto flex flex-col items-center text-center">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8e8e93] mb-10">Featured Tool</h2>
              <div className="flex flex-col items-center gap-8 w-full">
                <div className="icon-container w-[140px] h-[140px] bg-linear-to-br from-[#409cff] to-[#007aff] shadow-2xl">
                  <div className="icon-texture"></div>
                  <div className="premium-sheen"></div>
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <NextImage width={64} height={64} className='w-16 h-16' src="/assets/icons/pdf.svg" alt="" />
                  </div>
                </div>
                <div className="max-w-xl">
                  <h3 className="text-2xl font-bold mb-3 tracking-tight">PDF Workspace</h3>
                  <p className="text-lg text-[#3a3a3c] mb-8 leading-relaxed">
                    Securely merge, split, and optimize documents with industrial-grade tools running completely inside your browser environment.
                  </p>
                  <a className="macos-primary-button" href="#">
                    <span>Launch Tool</span>
                    <NextImage width={18} height={18} className='w-[18px] h-[18px]' src="/assets/icons/forward-white.svg" alt="" />
                  </a>
                </div>
              </div>
            </section>

            <section className="sm:mt-[72px] animate-from-bottom mt-[42px] pt-[16px] border-t border-black/5 max-w-3xl mx-auto text-center">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8e8e93] mb-6">Open Source & Community</h2>
              <div className="space-y-8">
                <p className="text-lg md:text-xl leading-relaxed text-[#3a3a3c] font-normal">
                  OBN is built by the community, for the community. Our source code is fully transparent, and we welcome contributions to help build the world&apos;s most secure toolset.
                </p>
                <div className="pt-4">
                  <a className="macos-button" href="#">
                    <NextImage width={24} height={24} className='w-6 h-6' src="/assets/icons/github.svg" alt="" />
                    <span>View Repository</span>
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>

      </div>
      <Footer />
    </div>
  );
}