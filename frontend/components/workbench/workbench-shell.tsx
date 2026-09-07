"use client";

import { createContext, useContext, useMemo } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/workbench/app-sidebar";
import { useConversations } from "@/hooks/use-conversations";

interface WorkbenchContextValue {
  /** Re-read GET /api/conversations, e.g. after a new thread is started. */
  refreshConversations: () => void;
}

const WorkbenchContext = createContext<WorkbenchContextValue>({
  refreshConversations: () => {},
});

export function useWorkbench() {
  return useContext(WorkbenchContext);
}

export function WorkbenchShell({ children }: { children: React.ReactNode }) {
  const { conversations, loading, error, refresh } = useConversations();

  // Stable identity: consumers put this in useCallback/useEffect dependencies.
  const value = useMemo(
    () => ({ refreshConversations: () => void refresh() }),
    [refresh]
  );

  return (
    <WorkbenchContext.Provider value={value}>
      <SidebarProvider>
        <AppSidebar conversations={conversations} loading={loading} error={error} />
        <SidebarInset className="h-svh min-w-0 overflow-hidden">{children}</SidebarInset>
      </SidebarProvider>
    </WorkbenchContext.Provider>
  );
}
