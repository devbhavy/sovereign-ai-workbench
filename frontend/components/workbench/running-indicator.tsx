"use client";

import { useEffect, useState } from "react";

import { formatElapsed } from "@/lib/format";

/**
 * The live turn.
 *
 * POST /api/conversations/{id}/messages blocks for the whole agent run and the
 * backend exposes no endpoint over the AgentEvent rows it writes, so there is
 * no step-by-step progress to report. A drifting dashed line — zerith's own
 * decorative motif — plus an honest elapsed clock says "still working" without
 * pretending to know how far along it is.
 */
export function RunningIndicator({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt);

  useEffect(() => {
    // Initial value comes from useState; the interval carries it from there.
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  return (
    <div className="flex flex-col gap-2.5" role="status" aria-live="polite">
      <div className="flex items-baseline gap-2.5">
        <span className="text-xs font-medium text-primary">sovereign</span>
        <span className="text-[0.6875rem] text-muted-foreground" data-numeric>
          {formatElapsed(elapsed)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <svg
          className="h-[2px] w-28 text-primary"
          viewBox="0 0 112 2"
          fill="none"
          aria-hidden
        >
          <line
            className="dash-animate"
            x1="0"
            y1="1"
            x2="112"
            y2="1"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="7 9"
          />
        </svg>
        <span className="soft-pulse text-sm text-muted-foreground">thinking…</span>
      </div>
    </div>
  );
}
