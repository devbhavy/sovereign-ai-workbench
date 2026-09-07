"use client";

import { use, useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { ArtifactRail } from "@/components/workbench/artifact-rail";
import { ChatThread } from "@/components/workbench/chat-thread";
import { Composer } from "@/components/workbench/composer";
import { ThreadHeader } from "@/components/workbench/thread-header";
import { useWorkbench } from "@/components/workbench/workbench-shell";
import { useConversation } from "@/hooks/use-conversation";
import {
  getEmptySnapshot,
  getTitlesSnapshot,
  subscribeLocalStore,
} from "@/lib/local-store";
import { takeHandoff } from "@/lib/pending-handoff";

/** Next 16 passes `params` as a promise; unwrap it with React's `use`. */
export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { refreshConversations } = useWorkbench();

  const {
    messages,
    artifacts,
    turnArtifacts,
    loading,
    loadError,
    pending,
    failure,
    send,
    dismissFailure,
  } = useConversation(id);

  // No endpoint renames a conversation, so the label is the locally cached
  // first message, falling back to the backend's literal title.
  const titles = useSyncExternalStore(
    subscribeLocalStore,
    getTitlesSnapshot,
    getEmptySnapshot
  );
  const title = titles[id] ?? "new chat";

  const handleSend = useCallback(
    async (content: string, fileIds: string[]) => {
      try {
        await send(content, fileIds);
      } finally {
        // updated_at moves on every completed run, which reorders the sidebar.
        refreshConversations();
      }
    },
    [send, refreshConversations]
  );

  // A conversation opened straight from the landing page arrives with its
  // first message still unsent; run it here so the thread shows the optimistic
  // turn and the thinking state while the agent works.
  //
  // Keyed by id, not a boolean: this component instance is reused when
  // navigating from one conversation to another, so a boolean would block the
  // second new conversation's first message from ever being sent.
  const startedHandoffFor = useRef<string | null>(null);
  useEffect(() => {
    if (startedHandoffFor.current === id) return;
    const handoff = takeHandoff(id);
    if (!handoff) return;
    startedHandoffFor.current = id;
    void (async () => {
      try {
        await handleSend(handoff.content, handoff.fileIds);
      } catch {
        // Rendered by the thread's failure notice.
      }
    })();
  }, [id, handleSend]);

  return (
    <div className="flex h-full min-h-0">
      <div className="grain flex min-w-0 flex-1 flex-col">
        <ThreadHeader
          title={title}
          subtitle={loadError ? `could not load — ${loadError}` : undefined}
        />

        <div className="min-h-0 flex-1">
          <ChatThread
            messages={messages}
            artifacts={artifacts}
            turnArtifacts={turnArtifacts}
            pending={pending}
            failure={failure}
            loading={loading && messages.length === 0}
            onRetry={(content, fileIds) => void handleSend(content, fileIds)}
            onDismissFailure={dismissFailure}
          />
        </div>

        <div className="shrink-0 px-5 pt-1 pb-5">
          <div className="mx-auto w-full max-w-2xl">
            <Composer
              autoFocus
              disabled={Boolean(pending)}
              onSend={handleSend}
              placeholder="reply, or attach a file…"
            />
          </div>
        </div>
      </div>

      <ArtifactRail artifacts={artifacts} />
    </div>
  );
}
