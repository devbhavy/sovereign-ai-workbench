"use client";

import { PaperclipIcon, XIcon } from "lucide-react";

import { formatBytes } from "@/lib/format";

interface AttachmentTagProps {
  name: string;
  size?: number | null;
  onRemove?: () => void;
  uploading?: boolean;
}

export function AttachmentTag({
  name,
  size,
  onRemove,
  uploading,
}: AttachmentTagProps) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border bg-muted py-1 pr-2 pl-3 text-xs text-muted-foreground">
      <PaperclipIcon className="size-3 shrink-0" aria-hidden />

      <span className="truncate text-foreground">
        {uploading ? "uploading…" : name}
      </span>

      {size != null && !uploading ? (
        <span className="shrink-0" data-numeric>
          {formatBytes(size)}
        </span>
      ) : null}

      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
          className="flex size-4 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <XIcon className="size-3" aria-hidden />
        </button>
      ) : (
        <span className="w-1" />
      )}
    </span>
  );
}
