"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { m, useScroll, useTransform, Variants } from "framer-motion";
import {
  Shield, Zap, Cpu, Lock, Globe, Heart, ArrowLeft,
  Braces, Code2, Users, GitBranch, Layers,
  MousePointer2, Binary, Workflow, ExternalLink, Sparkles
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/ui/Footer";


const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.23, 1, 0.32, 1] },
  }),
};

const stats = [
  { value: "100%", label: "Client-side", sub: "Nothing leaves your browser" },
  { value: "0", label: "Servers", sub: "Zero cloud infrastructure" },
  { value: "∞", label: "Privacy", sub: "Your data stays yours" },
  { value: "Free", label: "Forever", sub: "No paywalls, no accounts" },
];

const pillars = [
  {
    icon: Lock,
    title: "Privacy by Architecture",
    desc: "Not a policy — a technical guarantee. Our architecture physically cannot send your data anywhere. There are no servers to receive it.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: Zap,
    title: "Zero Friction",
    desc: "Open a tool. Drop your file. Get your result. No sign-ups, no installations, no configuration. Maximum 3 clicks to get anything done.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    desc: "Offline-first, works in air-gapped environments, on any device. Once loaded, toolbase never needs the internet again.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
];

const techStack = [
  {
    icon: Cpu,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    title: "WebAssembly (WASM)",
    badge: "Native Speed",
    desc: "Heavy-duty compute — PDF parsing, image processing, cryptography — runs via WASM engines compiled from Rust and C++. Desktop-grade performance, zero server cost.",
  },
  {
    icon: Braces,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    title: "Python via Pyodide",
    badge: "Full Ecosystem",
    desc: "The entire Python data science ecosystem runs client-side through Pyodide. NumPy, Pandas, and hundreds of mature libraries — all inside your browser tab.",
  },
  {
    icon: Code2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "Web Workers",
    badge: "Always Responsive",
    desc: "All computation is offloaded to background threads. The UI stays buttery smooth at 60fps even while processing gigabyte-scale files.",
  },
  {
    icon: Layers,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    title: "Next.js & TypeScript",
    badge: "Type Safe",
    desc: "Strict TypeScript across every file. Modular architecture, code-split by tool, so you only load what you use. Fast by default.",
  },
];

const manifesto = [
  {
    number: "01",
    title: "Your data is yours.",
    body: "We believe privacy isn't a feature — it's a right. Every tool in toolbase is built so your files, secrets, and data never travel beyond your own browser tab. Not now. Not ever.",
  },
  {
    number: "02",
    title: "Tools should be universal.",
    body: "toolbase isn't built for developers alone. It's built for writers, designers, analysts, students, and anyone who needs a reliable utility without installing software or trusting a stranger's server.",
  },
  {
    number: "03",
    title: "Open contributions change everything.",
    body: "The best tools are built by curious people. We invite anyone — seasoned engineers or first-time contributors — to add tools, improve existing ones, and take toolbase somewhere we haven't imagined yet.",
  },
];

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div
      className="min-h-screen text-(--text-primary) font-display flex flex-col selection:bg-primary/30 antialiased overflow-x-hidden"
    >
      {/* Sticky header */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between backdrop-blur-xl border-b border-(--border-subtle)" style={{ background: "var(--surface-overlay)" }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="group p-2 rounded-xl hover:bg-(--surface-active) transition-colors">
            <ArrowLeft className="w-4 h-4 text-(--text-muted) group-hover:text-(--text-primary) transition-colors" />
          </Link>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>About toolbase</span>
        </div>
        <a
          href="https://github.com/openbuildnetwork/toolbase"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
          style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
        >
          <GitBranch className="w-4 h-4" />
          <span className="hidden sm:inline">Contribute</span>
        </a>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">

        <m.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-4xl mx-auto space-y-8">
          {/* OBN Logo + Name */}
          <m.div custom={0} initial="hidden" animate="visible" variants={fadeUp}
            className="flex flex-col items-center gap-2"
          >
            {/* Light mode logo */}
            <Image
              src="/assets/images/logo-dark.png"
              alt="Open Build Network"
              width={372}
              height={136}
              className="h-10 w-auto theme-logo-light"
              priority
            />
            {/* Dark mode logo */}
            <Image
              src="/assets/images/logo-light.png"
              alt="Open Build Network"
              width={479}
              height={183}
              className="h-10 w-auto theme-logo-dark"
              priority
            />
            <span
              className="text-[11px] font-black uppercase tracking-[0.3em]"
              style={{ color: "var(--text-muted)" }}
            >
              Open Build Network
            </span>
          </m.div>

          {/* Headline */}
          <m.h1 custom={1} initial="hidden" animate="visible" variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[0.95]"
          >
            The browser is<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-400 to-cyan-400">
              your computer.
            </span>
          </m.h1>

          {/* Sub */}
          <m.p custom={2} initial="hidden" animate="visible" variants={fadeUp}
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            toolbase is a growing suite of professional utilities that run <em>entirely</em> inside your browser.
            No servers. No uploads. No accounts. Just powerful tools that respect your privacy by design.
          </m.p>

          {/* CTAs */}
          <m.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/"
              className="px-8 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: "var(--text-primary)", color: "var(--background)" }}
            >
              Explore Tools
            </Link>
            <a href="https://github.com/openbuildnetwork/toolbase" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm border transition-all hover:bg-(--surface-hover)"
              style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)" }}
            >
              <GitBranch className="w-4 h-4" />
              View Source
            </a>
          </m.div>

          {/* Scroll cue */}
          <m.div custom={4} initial="hidden" animate="visible" variants={fadeUp}
            className="flex flex-col items-center gap-1 pt-8"
            style={{ color: "var(--text-muted)" }}
          >
            <MousePointer2 className="w-4 h-4 animate-bounce" />
            <span className="text-[11px] uppercase tracking-widest">scroll to explore</span>
          </m.div>
        </m.div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <m.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-6 rounded-3xl border text-center space-y-1 group hover:scale-[1.02] transition-transform"
              style={{ borderColor: "var(--border-medium)", background: "var(--surface-overlay)" }}
            >
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-blue-400">{s.value}</div>
              <div className="text-sm font-bold">{s.label}</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.sub}</div>
            </m.div>
          ))}
        </div>
      </section>

      {/* ── MANIFESTO ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 w-full space-y-6">
        <m.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-12">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#3457D5" }}>Our Beliefs</p>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">What we stand for.</h2>
        </m.div>

        {manifesto.map((item, i) => (
          <m.div
            key={i}
            custom={i + 1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="group flex gap-6 md:gap-10 items-start p-8 rounded-3xl border transition-all hover:border-(--border-medium)"
            style={{ borderColor: "var(--border-subtle)", background: "var(--surface-overlay)" }}
          >
            <span className="text-4xl font-black shrink-0 text-transparent bg-clip-text bg-gradient-to-b from-primary/40 to-primary/10">
              {item.number}
            </span>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.body}</p>
            </div>
          </m.div>
        ))}
      </section>

      {/* ── CORE PILLARS ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 w-full">
        <m.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#3457D5" }}>Core Principles</p>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Built different.</h2>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <m.div
              key={i}
              custom={i + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className={`p-8 rounded-3xl border ${p.border} group hover:scale-[1.02] transition-all space-y-5`}
              style={{ background: "var(--surface-overlay)" }}
            >
              <div className={`w-12 h-12 rounded-2xl ${p.bg} ${p.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <p.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">{p.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{p.desc}</p>
            </m.div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 w-full">
        <m.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#3457D5" }}>Under The Hood</p>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">How it actually works.</h2>
          <p className="max-w-xl mx-auto text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            We push the boundaries of browser technology to deliver native-quality performance without cloud risks.
          </p>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {techStack.map((t, i) => (
            <m.div
              key={i}
              custom={i + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-8 rounded-3xl border group hover:border-(--border-medium) transition-all space-y-4"
              style={{ borderColor: "var(--border-subtle)", background: "var(--surface-overlay)" }}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${t.bg} ${t.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${t.bg} ${t.color}`}>
                  {t.badge}
                </span>
              </div>
              <h4 className="font-bold text-lg">{t.title}</h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{t.desc}</p>
            </m.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS FLOW ────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 w-full">
        <m.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#3457D5" }}>Privacy Model</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Your data never moves.</h2>
        </m.div>

        <div className="flex flex-col md:flex-row items-stretch gap-4">
          {[
            { icon: Binary, label: "Your File", desc: "Stays on your device", color: "text-sky-400", bg: "bg-sky-500/10" },
            { icon: Workflow, label: "Browser Engine", desc: "WASM + Web Workers process it", color: "text-violet-400", bg: "bg-violet-500/10" },
            { icon: Sparkles, label: "Your Result", desc: "Downloaded locally", color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <m.div
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex-1 p-8 rounded-3xl border text-center space-y-4"
                style={{ borderColor: "var(--border-medium)", background: "var(--surface-overlay)" }}
              >
                <div className={`w-14 h-14 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center mx-auto`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-bold text-lg">{step.label}</div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{step.desc}</div>
                </div>
              </m.div>
              {i < 2 && (
                <div className="flex items-center justify-center text-2xl font-bold md:rotate-0 rotate-90" style={{ color: "var(--text-muted)" }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>
        <m.p
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center text-sm mt-6"
          style={{ color: "var(--text-muted)" }}
        >
          The internet is only needed once — to load the app. After that, it's all you.
        </m.p>
      </section>

      {/* ── CONTRIBUTE CTA ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 pb-32 w-full">
        <m.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative rounded-[40px] overflow-hidden p-12 md:p-20 text-center space-y-8"
          style={{ background: "var(--surface-overlay)", border: "1px solid var(--border-medium)" }}
        >
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] blur-[120px] opacity-20 -z-0"
            style={{ background: "radial-gradient(circle, #3457D5 0%, transparent 70%)" }} />

          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-center gap-3">
              <Users className="w-10 h-10 text-primary" />
              <Heart className="w-8 h-8 text-red-500 animate-pulse" />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Built by the curious.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">For everyone.</span>
              </h2>
              <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
                toolbase is maintained by the Open Build Network and shaped by contributors from all walks of life.
                Whether you're a seasoned engineer, a student, or just someone with a great idea for a tool —
                you're welcome here. Let's build something the world actually needs.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://github.com/openbuildnetwork/toolbase"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: "var(--text-primary)", color: "var(--background)" }}
              >
                <GitBranch className="w-4 h-4" />
                Contribute on GitHub
              </a>
              <Link
                href="/"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm border transition-all hover:bg-(--surface-hover)"
                style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)" }}
              >
                <ExternalLink className="w-4 h-4" />
                Explore Tools
              </Link>
            </div>

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Open source · Free forever · No sign-up required
            </p>
          </div>
        </m.div>
      </section>

      <Footer />
    </div>
  );
}
