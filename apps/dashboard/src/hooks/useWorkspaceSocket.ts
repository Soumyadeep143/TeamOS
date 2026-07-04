import { useEffect, useRef, useState } from "react";
import { connectWorkspaceSocket } from "@teamos/sdk";
import type { WorkspaceEvent } from "@teamos/types";

// Single demo workspace for the hackathon MVP — no auth/session yet (see AGENT.md Non-Goals).
export const DEMO_WORKSPACE_ID = "demo-workspace-123";

export type SocketStatus = "connecting" | "open" | "closed" | "error";

/**
 * Subscribes to the live workspace event stream (NFR-2) for the lifetime of
 * the component and exposes the raw connection status for UI display.
 */
export function useWorkspaceSocket(onEvent: (message: WorkspaceEvent) => void) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;
  const [status, setStatus] = useState<SocketStatus>("connecting");

  useEffect(() => {
    const socket = connectWorkspaceSocket(
      DEMO_WORKSPACE_ID,
      (message) => handlerRef.current(message),
      setStatus
    );
    return () => socket.close();
  }, []);

  return status;
}
