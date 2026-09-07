"use client";

import { DownloadIcon, FileTextIcon } from "lucide-react";

import { artifactDownloadUrl } from "@/lib/api";
import { clockTime } from "@/lib/format";
import type { ApiArtifact } from "@/lib/types";

/**
 * Artifacts are produced by the `document_generator` tool in
 * backend/app/agent/graph.py and served by GET /api/artifacts/{id}/download.
 */
export function ArtifactCard({ artifact }: { artifact: ApiArtifact }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border bg-card p-3 shadow-card transition-transform duration-200 hover:-translate-y-0.5">
      <span
        className="btn-brand flex size-9 shrink-0 items-center justify-center rounded-lg"
        aria-hidden
      >
        <FileTextIcon className="size-4" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{artifact.filename}</span>
        <span className="text-xs text-muted-foreground">
          {artifact.file_type ?? "file"} · {clockTime(artifact.created_at)}
        </span>
      </div>

      {/* A plain anchor: the browser streams the FileResponse straight to disk. */}
      <a
        href={artifactDownloadUrl(artifact.id)}
        download
        aria-label={`Download ${artifact.filename}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
      >
        <DownloadIcon className="size-4" aria-hidden />
      </a>
    </div>
  );
}
