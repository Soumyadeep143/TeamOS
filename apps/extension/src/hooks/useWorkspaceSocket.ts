import { useEffect, useRef } from "react";
import { connectWorkspaceSocket } from "@teamos/sdk";
import type { WorkspaceEvent } from "@teamos/types";

// Single demo workspace for the hackathon MVP — no auth/session yet (see AGENT.md Non-Goals).
export const DEMO_WORKSPACE_ID = "demo-workspace-123";

/**
 * Subscribes to the live workspace event stream (NFR-2) for the lifetime of
 * the component. Callers should still keep a long-interval fallback poll in
 * case the socket drops, per FR-67 auto-reconnect expectations.
 */
export function useWorkspaceSocket(onEvent: (message: WorkspaceEvent) => void) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const socket = connectWorkspaceSocket(DEMO_WORKSPACE_ID, (message) => handlerRef.current(message));
    return () => socket.close();
  }, []);
}
