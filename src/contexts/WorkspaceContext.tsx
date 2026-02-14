"use client";

import { createContext, useContext } from "react";

type WorkspaceContextType = {
  workspaceId: string;
  workspaceName: string;
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({
  children,
  workspaceId,
  workspaceName,
}: {
  children: React.ReactNode;
  workspaceId: string;
  workspaceName: string;
}) {
  return (
    <WorkspaceContext.Provider value={{ workspaceId, workspaceName }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}
