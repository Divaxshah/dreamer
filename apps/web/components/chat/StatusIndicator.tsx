"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  Loader2,
  Square,
} from "lucide-react";
import type { MessageStatus } from "@/lib/types";

interface StatusIndicatorProps {
  status: MessageStatus;
  errorMessage?: string;
}

export function StatusIndicator({
  status,
  errorMessage,
}: StatusIndicatorProps) {
  if (status === "thinking") {
    return (
      <div className="flex items-center gap-2 text-foreground">
        <motion.span
          className="h-2 w-2 rounded-full bg-primary"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
        <span className="text-xs">Preparing the agent workflow...</span>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-amber-500">
        <Square size={12} className="fill-current" />
        <span className="text-xs">Generation stopped</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-destructive">
      <AlertCircle size={14} className="text-destructive" />
      <span className="truncate text-xs">
        {errorMessage ?? "Generation failed"}
      </span>
      <Loader2 size={12} className="animate-spin text-destructive" />
    </div>
  );
}
