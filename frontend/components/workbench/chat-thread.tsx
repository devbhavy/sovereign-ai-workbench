"use client";

import { RotateCcwIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { RunningIndicator } from "@/components/workbench/running-indicator";
import { TranscriptTurn } from "@/components/workbench/transcript-turn";
import type { PendingTurn, RunFailure } from "@/hooks/use-conversation";
import {
  getEmptySnapshot,
  getFilenamesSnapshot,
  subscribeLocalStore,
} from "@/lib/local-store";
import type { ApiArtifact, ApiMessage } from "@/lib/types";

interface ChatThreadProps {
  messages: ApiMessage[];
  artifacts: ApiArtifact[];
  turnArtifacts: Record<string, string[]>;
  pending: PendingTurn | null;
  failure: RunFailure | null;
  loading: boolean;
  onRetry: (content: string, fileIds: string[]) => void;
  onDismissFailure: () => void;
}

export function ChatThread({
  messages,
  artifacts,
  turnArtifacts,
  pending,
  failure,
  loading,
  onRetry,
  onDismissFailure,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // localStorage is unavailable during SSR, so it is read as an external
  // store: empty on the server, live on the client, and updated in place when
  // the composer caches a newly uploaded filename.
  const filenames = useSyncExternalStore(
    subscribeLocalStore,
    getFilenamesSnapshot,
    getEmptySnapshot
  );

  const artifactsById = useMemo(
    () => new Map(artifacts.map((artifact) => [artifact.id, artifact])),
    [artifacts]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending, failure]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-8">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-col gap-2.5">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-8">
        {messages.length === 0 && !pending && !failure ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            nothing here yet.
          </p>
        ) : null}

        {messages.map((message) => (
          <TranscriptTurn
            key={message.id}
            role={message.role}
            content={message.content}
            createdAt={message.created_at}
            fileIds={message.file_ids}
            filenames={filenames}
            artifacts={(turnArtifacts[message.id] ?? [])
              .map((id) => artifactsById.get(id))
              .filter((artifact): artifact is ApiArtifact => Boolean(artifact))}
          />
        ))}

        {pending ? (
          <>
            {/* The user row is committed by the backend before the agent runs,
                but is not readable until the run returns — so show it here. */}
            <TranscriptTurn
              role="user"
              content={pending.content}
              fileIds={pending.fileIds}
              filenames={filenames}
              muted
            />
            <RunningIndicator startedAt={pending.startedAt} />
          </>
        ) : null}

        {failure ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-xl border border-destructive/25 bg-card p-4 shadow-card"
          >
            <div className="flex w-full items-start justify-between gap-3">
              <p className="text-sm font-medium text-destructive">
                that didn&apos;t work
              </p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={onDismissFailure}
                className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <XIcon className="size-4" aria-hidden />
              </button>
            </div>

            <p className="text-xs break-words text-muted-foreground">
              {failure.message}
            </p>

            {failure.userMessagePersisted ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your message was saved before the run started, so sending it
                again will store a second copy of it.
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => onRetry(failure.content, failure.fileIds)}
              className="btn-dark flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
            >
              <RotateCcwIcon className="size-3" aria-hidden />
              try again
            </button>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
