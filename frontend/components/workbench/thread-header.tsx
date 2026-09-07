"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function ThreadHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <SidebarTrigger className="size-8 shrink-0 rounded-full text-muted-foreground" />

      <div className="flex min-w-0 flex-col justify-center">
        <h1 className="truncate text-sm font-medium">{title}</h1>
        {subtitle ? (
          <p className="truncate text-xs text-destructive">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
