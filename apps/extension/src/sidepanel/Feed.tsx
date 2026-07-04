import React, { useCallback, useEffect, useState } from "react";
import { getContextFeed, shareContext } from "@teamos/sdk";
import type { SharedContext } from "@teamos/types";
import { useWorkspaceSocket } from "../hooks/useWorkspaceSocket";

const FEED_EVENTS = new Set(["PAGE_SHARED", "DOCUMENT_SHARED", "HIGHLIGHT_SHARED", "NEW_CONTEXT", "SUMMARY_READY"]);

export function Feed() {
  const [feedItems, setFeedItems] = useState<SharedContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareText, setShareText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const data = await getContextFeed();
      setFeedItems(data);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    // Safety-net poll in case the WebSocket drops (FR-67 auto-reconnect).
    const interval = setInterval(fetchFeed, 20000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  useWorkspaceSocket((message) => {
    if (FEED_EVENTS.has(message.event)) {
      fetchFeed();
    }
  });

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareText.trim()) return;

    setSubmitting(true);
    // Detect if input is a URL
    let type: "page" | "highlight" = "highlight";
    let title = "Shared Note";
    let url = "";

    if (shareText.startsWith("http://") || shareText.startsWith("https://")) {
      type = "page";
      url = shareText;
      try {
        title = new URL(shareText).hostname;
      } catch {
        title = "Shared Link";
      }
    }

    try {
      await shareContext({
        type,
        title,
        url: url || undefined,
        text_content: shareText
      });
      setShareText("");
      fetchFeed();
    } catch (error) {
      console.error("Error sharing to feed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const past = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      return past.toLocaleDateString();
    } catch {
      return "some time ago";
    }
  };

  if (loading && feedItems.length === 0) {
    return <div style={{ color: "#94a3b8", textAlign: "center", padding: "16px" }}>Loading feed...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Share Box Form */}
      <form onSubmit={handleShare} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <textarea
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
          placeholder="Paste URL or type a text note to share with team..."
          style={{
            width: "100%",
            height: "64px",
            backgroundColor: "#1e293b",
            color: "white",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "8px",
            fontSize: "13px",
            fontFamily: "inherit",
            resize: "none",
            boxSizing: "border-box"
          }}
        />
        <button
          type="submit"
          disabled={submitting || !shareText.trim()}
          style={{
            alignSelf: "flex-end",
            backgroundColor: submitting || !shareText.trim() ? "#475569" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 16px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: shareText.trim() ? "pointer" : "default",
            transition: "background-color 0.2s"
          }}>
          {submitting ? "Sharing..." : "Share to Feed"}
        </button>
      </form>

      {/* Feed list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {feedItems.map((item) => {
          const typeIcons: Record<string, string> = {
            page: "🌐",
            highlight: "📝",
            document: "📄"
          };
          const currentIcon = typeIcons[item.type] || "📌";
          const screenshot = item.metadata?.screenshot as string | undefined;

          return (
            <div
              key={item.context_id}
              style={{
                backgroundColor: "#1e293b",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #334155",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{currentIcon}</span>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#38bdf8", textDecoration: "none" }}>
                      {item.title}
                    </a>
                  ) : (
                    <span>{item.title}</span>
                  )}
                </span>
                <span style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap" }}>
                  {formatRelativeTime(item.created_at)}
                </span>
              </div>

              {screenshot && (
                <img
                  src={screenshot}
                  alt={`Screenshot of ${item.title}`}
                  style={{ width: "100%", borderRadius: "6px", border: "1px solid #334155" }}
                />
              )}

              {/* AI generated summary */}
              {item.summary && (
                <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.4", paddingLeft: "4px", borderLeft: "2px solid #3b82f6" }}>
                  {item.summary}
                </div>
              )}

              {/* Author / creator badge */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "10px", color: "#cbd5e1", backgroundColor: "#334155", padding: "2px 6px", borderRadius: "10px" }}>
                  👤 {item.created_by}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
