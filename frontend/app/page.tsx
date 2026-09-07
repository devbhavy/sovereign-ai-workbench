"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Composer } from "@/components/workbench/composer";
import { DashedDecor } from "@/components/workbench/dashed-decor";
import { EmptyState } from "@/components/workbench/empty-state";
import { ThreadHeader } from "@/components/workbench/thread-header";
import { useWorkbench } from "@/components/workbench/workbench-shell";
import { createConversation } from "@/lib/api";
import { rememberTitle } from "@/lib/local-store";
import { setHandoff } from "@/lib/pending-handoff";

/**
 * The landing view. There is no draft state on the backend, so a Conversation
 * row is created only once there is something to send. The agent run itself is
 * handed to the thread page rather than awaited here — see lib/pending-handoff.
 */
export default function HomePage() {
  const router = useRouter();
  const { refreshConversations } = useWorkbench();
  const [starting, setStarting] = useState(false);

  const start = async (content: string, fileIds: string[]) => {
    setStarting(true);
    try {
      const conversation = await createConversation();
      rememberTitle(conversation.id, content);
      setHandoff(conversation.id, { content, fileIds });
      refreshConversations();
      router.push(`/c/${conversation.id}`);
    } catch (err) {
      toast.error("Could not start a conversation", {
        description: (err as Error).message,
      });
      setStarting(false);
    }
    // On success the route changes and this component unmounts, so `starting`
    // is deliberately left set to keep the composer disabled until it does.
  };

  return (
    <div className="grain relative flex h-full min-h-0 flex-col overflow-hidden">
      <ThreadHeader title="new chat" />
      <DashedDecor />

      <div className="relative flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-10">
        <div className="mx-auto w-full max-w-2xl">
          <EmptyState />

          <div className="mt-10">
            <Composer autoFocus disabled={starting} onSend={start} />
          </div>
        </div>
      </div>
    </div>
  );
}
