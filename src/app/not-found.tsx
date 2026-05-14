import Image from "next/image";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative isolate min-h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#b7b8eb_0%,#d6daf3_54%,#ffffff_100%)] font-display text-[#111111]">
      <Link
        href="/"
        aria-label="Go to Toolbase home"
        className="absolute left-[clamp(1.25rem,4vw,4rem)] top-[clamp(1.25rem,4vw,3.5rem)] z-30 inline-flex  px-5 py-3  transition hover:bg-white/45"
      >
        <Image
          src="/assets/images/logo-toolbase-light.png"
          alt="Toolbase"
          width={1390}
          height={355}
          priority
          className="h-auto w-[190px] object-contain sm:w-[240px]"
        />
      </Link>

      <div className="pointer-events-none absolute inset-x-0 top-[7svh] z-0 text-center text-[clamp(9rem,36vw,29rem)] font-black leading-none tracking-[0] text-white/80">
        404
      </div>

      <Image
        src="/assets/images/not-found-cat-sleeping.png"
        alt=""
        width={1024}
        height={1536}
        priority
        className="pointer-events-none absolute bottom-[2svh] left-[7vw] z-10 h-[min(72svh,620px)] w-auto select-none object-contain drop-shadow-[0_28px_30px_rgba(88,92,124,0.18)] max-md:left-1/2 max-md:top-[19svh] max-md:h-[min(48svh,420px)] max-md:-translate-x-1/2"
        draggable={false}
      />

      <section className="relative z-20 flex min-h-[100svh] items-end justify-end px-[8vw] pb-[10svh] pt-[8svh] max-md:items-end max-md:justify-center max-md:px-5 max-md:pb-8">
        <div className="flex w-full max-w-[610px] flex-col items-center text-center md:items-end md:text-right">
          <Link
            href="/"
            className="mb-9 inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/72 py-2 pl-2 pr-5 text-sm font-medium text-[#303247] shadow-sm backdrop-blur transition hover:bg-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#56597b] text-white">
              <RotateCcw size={17} aria-hidden="true" />
            </span>
            Return to Base Camp
          </Link>

          <h1 className="max-w-[650px] text-[clamp(2.1rem,4.25vw,4rem)] font-black leading-[1.08] tracking-[0]">
            Whoops! Looks Like This Page Went on Vacation!
          </h1>
          <p className="mt-5 max-w-[570px] text-sm leading-6 text-[#777984] sm:text-base">
            Uh oh! Our little toolbase friend might have accidentally scribbled out this address.
            We can&apos;t seem to find the page you&apos;re looking for.
          </p>
        </div>
      </section>
    </main>
  );
}
