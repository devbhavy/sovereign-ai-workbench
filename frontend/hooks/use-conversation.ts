"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getConversation, sendMessage } from "@/lib/api";
import { rememberTitle } from "@/lib/local-store";
import type { ApiArtifact, ApiMessage, ConversationDetail } from "@/lib/types";

export interface PendingTurn {
  content: string;
  fileIds: string[];
  startedAt: number;
}

export interface RunFailure {
  message: string;
  /** Kept so the thread can offer to send the same text again. */
  content: string;
  fileIds: string[];
  /** True when the user row was confirmed persisted despite the failed run. */
  userMessagePersisted: boolean;
}

export function useConversation(conversationId: string | null) {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [artifacts, setArtifacts] = useState<ApiArtifact[]>([]);
  const [loading, setLoading] = useState(Boolean(conversationId));
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pending, setPending] = useState<PendingTurn | null>(null);
  const [failure, setFailure] = useState<RunFailure | null>(null);

  /**
   * POST /messages returns the *user* message id, never the assistant's, so a
   * turn's artifact ids are attached to the newest assistant message after the
   * post-send refetch. Session-only: the backend scopes artifacts to the
   * conversation rather than to a message, so it cannot survive a reload.
   */
  const [turnArtifacts, setTurnArtifacts] = useState<Record<string, string[]>>({});

  // Switching threads clears everything at once, during render rather than in
  // an effect, so a stale thread is never painted for a frame.
  const [trackedId, setTrackedId] = useState(conversationId);
  if (trackedId !== conversationId) {
    setTrackedId(conversationId);
    setMessages([]);
    setArtifacts([]);
    setLoadError(null);
    setPending(null);
    setFailure(null);
    setTurnArtifacts({});
    setLoading(Boolean(conversationId));
  }

  // Guards async completions that land after the user navigated away.
  const activeIdRef = useRef(conversationId);
  useEffect(() => {
    activeIdRef.current = conversationId;
  }, [conversationId]);

  const applyDetail = useCallback((detail: ConversationDetail) => {
    setMessages(detail.messages);
    setArtifacts(detail.artifacts);
  }, []);

  useEffect(() => {
    // `loading` already starts false without an id — see the reset above.
    if (!conversationId) return;

    const controller = new AbortController();

    const load = async () => {
      try {
        const detail = await getConversation(conversationId, controller.signal);
        if (controller.signal.aborted) return;
        setMessages(detail.messages);
        setArtifacts(detail.artifacts);
        setLoadError(null);
      } catch (err) {
        if (controller.signal.aborted || (err as Error).name === "AbortError") return;
        setLoadError((err as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [conversationId]);

  /**
   * Sends one turn. The request blocks for the whole agent run — see
   * backend/app/api/messages.py, which invokes LangGraph inline.
   */
  const send = useCallback(
    async (content: string, fileIds: string[]) => {
      if (!conversationId || pending) return;

      setFailure(null);
      setPending({ content, fileIds, startedAt: Date.now() });
      rememberTitle(conversationId, content);

      try {
        const result = await sendMessage(conversationId, content, fileIds);

        // Re-read the conversation so messages and artifact filenames come
        // from the database rather than being synthesised here.
        const detail = await getConversation(conversationId);
        if (activeIdRef.current !== conversationId) return;
        applyDetail(detail);

        if (result.artifact_ids.length > 0) {
          const lastAssistant = [...detail.messages]
            .reverse()
            .find((message) => message.role === "assistant");
          if (lastAssistant) {
            setTurnArtifacts((prev) => ({
              ...prev,
              [lastAssistant.id]: result.artifact_ids,
            }));
          }
        }
        return result;
      } catch (err) {
        if (activeIdRef.current !== conversationId) return;

        // messages.py commits the user row *before* running the agent, so on a
        // failed run that row still exists. Re-read to find out whether it
        // landed, which decides whether the optimistic bubble should stay.
        let persisted = false;
        try {
          applyDetail(await getConversation(conversationId));
          persisted = true;
        } catch {
          // Backend unreachable — keep showing the optimistic bubble.
        }

        setFailure({
          message: (err as Error).message,
          content,
          fileIds,
          userMessagePersisted: persisted,
        });
        throw err;
      } finally {
        if (activeIdRef.current === conversationId) setPending(null);
      }
    },
    [conversationId, pending, applyDetail]
  );

  const dismissFailure = useCallback(() => setFailure(null), []);

  return {
    messages,
    artifacts,
    turnArtifacts,
    loading,
    loadError,
    pending,
    failure,
    send,
    dismissFailure,
  };
}
