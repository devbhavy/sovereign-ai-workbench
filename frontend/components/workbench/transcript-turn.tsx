"use client";

import { cn } from "cn";

import { ArtifactCard } from "@/components/workbench/artifact-card";
import { AttachmentTag } from "@/components/workbench/attachment-tag";
import { Markdown } from "@/components/workbench/markdown";
import { clockTime, parseUtc } from "@/lib/format";
import type { ApiArtifact, Role } from "@/lib/types";

interface TranscriptTurnProps {
  role: Role;
  content: string;
  createdAt?: string;
  fileIds?: string[];
  /** file id -> original filename, from the browser-local cache. */
  filenames?: Record<string, string>;
  /** Artifacts produced by this turn; only known for in-session turns. */
  artifacts?: ApiArtifact[];
  /** Dims a turn whose run has not come back yet. */
  muted?: boolean;
}

/**
 * One turn. A small label, then the content — the question sits in a white
 * card, the answer flows straight onto the paper. No bubbles either side.
 */
export function TranscriptTurn({
  role,
  content,
  createdAt,
  fileIds = [],
  filenames = {},
  artifacts = [],
  muted,
}: TranscriptTurnProps) {
  const isUser = role === "user";

  return (
    <article className={cn("rise-in flex flex-col gap-2.5", muted && "opacity-55")}>
      <div className="flex items-baseline gap-2.5">
        <span
          className={cn(
            "text-xs font-medium",
            isUser ? "text-muted-foreground" : "text-primary"
          )}
        >
          {isUser ? "you" : "sovereign"}
        </span>
        {createdAt ? (
          <time
            className="text-[0.6875rem] text-muted-foreground"
            dateTime={parseUtc(createdAt).toISOString()}
          >
            {clockTime(createdAt)}
          </time>
        ) : null}
      </div>

      {fileIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {fileIds.map((id) => (
            <AttachmentTag
              key={id}
              // No endpoint resolves a file id to a filename, so an uncached id
              // (another browser, cleared storage) shows a short form of the id
              // rather than inventing a name.
              name={filenames[id] ?? `${id.slice(0, 8)}…`}
            />
          ))}
        </div>
      ) : null}

      {isUser ? (
        <p className="rounded-xl border bg-card px-4 py-3 text-[0.9375rem] leading-relaxed break-words whitespace-pre-wrap shadow-card">
          {content}
        </p>
      ) : (
        <Markdown content={content} />
      )}

      {artifacts.length > 0 ? (
        <div className="mt-1 flex flex-col gap-2">
          {artifacts.map((artifact) => (
            <ArtifactCard key={artifact.id} artifact={artifact} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
