"use client";

import { useEffect, useState } from "react";

import { getHealth } from "@/lib/api";

export type HealthState = "checking" | "online" | "offline";

/**
 * Polls GET /health so the sidebar can say plainly whether uvicorn is up —
 * without it, a dead backend just looks like a hung request.
 */
export function useHealth(intervalMs = 20_000) {
  const [state, setState] = useState<HealthState>("checking");
  const [service, setService] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const check = async () => {
      try {
        const health = await getHealth(controller.signal);
        if (cancelled) return;
        setService(health.service);
        setState(health.status === "ok" ? "online" : "offline");
      } catch {
        if (!cancelled) setState("offline");
      }
    };

    void check();
    const timer = setInterval(check, intervalMs);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [intervalMs]);

  return { state, service };
}
