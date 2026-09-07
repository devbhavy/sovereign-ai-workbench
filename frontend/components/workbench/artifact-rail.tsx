"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ArtifactCard } from "@/components/workbench/artifact-card";
import type { ApiArtifact } from "@/lib/types";

/**
 * Every artifact in the conversation. GET /api/conversations/{id} scopes
 * artifacts to the conversation rather than to a message, so this panel — not
 * the per-turn cards — is the durable view of what the agent produced.
 */
export function ArtifactRail({ artifacts }: { artifacts: ApiArtifact[] }) {
  if (artifacts.length === 0) return null;

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l bg-sidebar xl:flex">
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        <span className="font-display text-lg lowercase">files.</span>
        <span className="ml-auto text-xs text-muted-foreground" data-numeric>
          {artifacts.length}
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2.5 p-3">
          {artifacts.map((artifact) => (
            <ArtifactCard key={artifact.id} artifact={artifact} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
