"use client";

import { cn } from "cn";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/workbench/theme-toggle";
import { useHealth } from "@/hooks/use-health";
import type { SidebarConversation } from "@/hooks/use-conversations";
import { relativeTime } from "@/lib/format";

interface AppSidebarProps {
  conversations: SidebarConversation[];
  loading: boolean;
  error: string | null;
}

const HEALTH = {
  checking: { label: "connecting", dot: "bg-muted-foreground", pulse: true },
  online: { label: "connected", dot: "bg-[var(--success)]", pulse: false },
  offline: { label: "backend offline", dot: "bg-destructive", pulse: true },
} as const;

function BackendDot() {
  const { state } = useHealth();
  const health = HEALTH[state];

  return (
    <span
      className="flex items-center gap-2"
      title={
        state === "offline"
          ? "No response from /health. Is uvicorn running on port 8000?"
          : undefined
      }
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          health.dot,
          health.pulse && "soft-pulse"
        )}
        aria-hidden
      />
      <span className="text-xs text-muted-foreground">{health.label}</span>
    </span>
  );
}

export function AppSidebar({ conversations, loading, error }: AppSidebarProps) {
  const params = useParams<{ id?: string }>();
  const activeId = params?.id;

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="gap-4 px-4 pt-5 pb-3">
        <Link href="/" className="font-display text-2xl leading-none lowercase">
          sovereign.
        </Link>

        <Link
          href="/"
          className="btn-brand flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all"
        >
          <PlusIcon className="size-4" aria-hidden />
          new chat
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2">
        <p className="px-2 pt-3 pb-2 text-xs text-muted-foreground">recent</p>

        {loading ? (
          <div className="flex flex-col gap-1.5 px-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="px-2 text-xs text-destructive">{error}</p>
        ) : conversations.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">nothing here yet</p>
        ) : (
          <nav className="flex flex-col gap-0.5">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeId;
              return (
                <Link
                  key={conversation.id}
                  href={`/c/${conversation.id}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg px-2.5 py-2 transition-colors",
                    isActive
                      ? "bg-sidebar-accent"
                      : "hover:bg-sidebar-accent/60"
                  )}
                >
                  <span className="truncate text-[0.8125rem] leading-snug">
                    {conversation.label}
                  </span>
                  <time
                    className="text-[0.6875rem] text-muted-foreground"
                    dateTime={conversation.updated_at}
                  >
                    {relativeTime(conversation.updated_at)}
                  </time>
                </Link>
              );
            })}
          </nav>
        )}
      </SidebarContent>

      <SidebarFooter className="flex-row items-center justify-between border-t px-4 py-3">
        <BackendDot />
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
