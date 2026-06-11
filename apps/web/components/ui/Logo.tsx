"use client";

import { motion } from "framer-motion";

interface LogoProps {
  isGenerating: boolean;
}

export function Logo({ isGenerating }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <motion.span
          className="absolute inset-0 rounded-2xl"
          animate={isGenerating ? { opacity: [0.2, 0.45, 0.2] } : { opacity: 0.2 }}
          transition={{ duration: 1.3, repeat: isGenerating ? Infinity : 0 }}
          style={{
            background: "#6a5b43",
          }}
        />
        <span className="relative grid h-10 w-10 place-items-center rounded-2xl border border-[var(--wm-border-strong)] bg-[#2a241c]">
          <span className="h-3.5 w-3.5 rounded-full bg-[var(--wm-accent)]" />
        </span>
      </div>

      <div className="leading-none">
        <p className="font-display text-[1.18rem] font-semibold tracking-[0.16em] text-[var(--wm-text)]">
          WEBMAKER
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[var(--wm-muted)]">
          Frontend studio
        </p>
      </div>
    </div>
  );
}
