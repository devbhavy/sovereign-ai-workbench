"use client";

import { useCallback, useEffect, useState } from "react";

import { listConversations } from "@/lib/api";
import { getTitlesSnapshot } from "@/lib/local-store";
import type { ConversationSummary } from "@/lib/types";

export interface SidebarConversation extends ConversationSummary {
  /** Locally cached first user message, or the backend's "New Conversation". */
  label: string;
}

function withLabels(rows: ConversationSummary[]): SidebarConversation[] {
  const titles = getTitlesSnapshot();
  return rows.map((row) => ({ ...row, label: titles[row.id] || row.title }));
}

/** GET /api/conversations, already ordered `updated_at desc` by the backend. */
export function useConversations() {
  const [conversations, setConversations] = useState<SidebarConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const rows = await listConversations(controller.signal);
        if (controller.signal.aborted) return;
        setConversations(withLabels(rows));
        setError(null);
      } catch (err) {
        if (controller.signal.aborted || (err as Error).name === "AbortError") return;
        setError((err as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, []);

  /** Manual re-read, e.g. after a new conversation or a completed run. */
  const refresh = useCallback(async () => {
    try {
      setConversations(withLabels(await listConversations()));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  return { conversations, loading, error, refresh };
}
