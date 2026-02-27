"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatMessage, LineUserProfile } from "@/lib/types";
import { fetchUserProfile } from "@/lib/lineProfileCache";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type MessagesResponse = ApiResponse<{
  users: string[];
  messages: ChatMessage[];
}>;

const POLL_INTERVAL_MS = 3000;

function senderStyle(sender: ChatMessage["sender"]): string {
  if (sender === "me") {
    return "ml-auto bg-blue-500 text-white rounded-lg rounded-tr-none";
  }
  if (sender === "line") {
    return "bg-gray-200 text-gray-900 rounded-lg rounded-tl-none";
  }
  return "bg-gray-100 text-gray-600 rounded-lg";
}

function senderLabel(sender: ChatMessage["sender"]): string {
  if (sender === "me") return "You";
  if (sender === "line") return "LINE User";
  return "System";
}

export default function ChatUI() {
  const [users, setUsers] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Map<string, LineUserProfile>>(
    new Map(),
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages],
  );

  // Fetch profiles for users who don't have one yet
  const fetchMissingProfiles = useCallback(
    async (userIds: string[]) => {
      const missing = userIds.filter((id) => !profiles.has(id));
      if (missing.length === 0) return;

      for (const userId of missing) {
        const profile = await fetchUserProfile(userId);
        if (profile) {
          setProfiles((prev) => new Map(prev).set(userId, profile));
        }
      }
    },
    [profiles],
  );

  // Get profile or fallback to userId
  const getUserDisplay = (userId: string): LineUserProfile => {
    if (!userId) {
      return {
        userId: "Unknown",
        displayName: "Unknown User",
        pictureUrl: "",
        statusMessage: "",
      };
    }
    return (
      profiles.get(userId) || {
        userId,
        displayName: `User ${userId.substring(0, 6)}...`,
        pictureUrl: "",
        statusMessage: "",
      }
    );
  };

  // Load users list
  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/messages", { cache: "no-store" });
      const data = (await response.json()) as MessagesResponse;

      if (!data.success) throw new Error(data.error || "Failed to load users");

      const uniqueUsers = Array.from(new Set(data.data?.users || [])).filter(
        Boolean,
      );
      setUsers(uniqueUsers);

      // Fetch profiles for any new users
      fetchMissingProfiles(uniqueUsers);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading users");
    } finally {
      setIsLoading(false);
    }
  }, [fetchMissingProfiles]);

  // Load messages for selected user
  const loadMessages = useCallback(async (userId: string | null) => {
    if (!userId) {
      setMessages([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/messages?userId=${encodeURIComponent(userId)}`,
        {
          cache: "no-store",
        },
      );
      const data = (await response.json()) as MessagesResponse;

      if (!data.success)
        throw new Error(data.error || "Failed to load messages");

      // Ensure messages are unique by ID
      const uniqueMessages = Array.from(
        new Map((data.data?.messages || []).map((m) => [m.id, m])).values(),
      );
      setMessages(uniqueMessages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading messages");
    }
  }, []);

  // Initial load of users
  useEffect(() => {
    loadUsers();

    // Poll for new users
    const usersInterval = setInterval(() => {
      loadUsers();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(usersInterval);
  }, [loadUsers]);

  // Load messages when user is selected
  useEffect(() => {
    loadMessages(selectedUserId);

    // Poll for new messages if user is selected
    if (!selectedUserId) return;

    const messagesInterval = setInterval(
      () => loadMessages(selectedUserId),
      POLL_INTERVAL_MS,
    );
    return () => clearInterval(messagesInterval);
  }, [selectedUserId, loadMessages]);

  // Handle incoming SSE message
  const handleSSEMessage = useCallback(
    (userId: string, message: ChatMessage) => {
      // Validate userId
      if (!userId) {
        console.warn("Received message with undefined userId");
        return;
      }
      // Add to users list if new
      setUsers((prev) => {
        if (prev.includes(userId)) return prev;
        return [userId, ...prev];
      });

      // Fetch profile if we don't have it
      if (!profiles.has(userId)) {
        fetchMissingProfiles([userId]);
      }

      // If this message is for the selected user, update messages
      if (userId === selectedUserId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    },
    [profiles, selectedUserId, fetchMissingProfiles],
  );

  // Connect to SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      eventSource = new EventSource("/api/stream");

      eventSource.onmessage = (event) => {
        try {
          const { userId, message } = JSON.parse(event.data);
          handleSSEMessage(userId, message);
        } catch (e) {
          console.error("Failed to parse SSE message:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after delay
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, [selectedUserId, handleSSEMessage]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedUserId || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, text }),
      });

      const data = (await response.json()) as
        | { ok: true; messageId: string; userId: string; text: string }
        | { ok: false; error: string };

      if (!data.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Clear input (message appears via SSE broadcast)
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error sending message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-3 h-screen bg-gray-100">
      {/* Left Pane: Users List (col-span-1 = 33%) */}
      <div className="bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">LINE Chat</h1>
          <p className="text-sm text-gray-600">
            {users.length} active {users.length === 1 ? "user" : "users"}
          </p>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          )}
          {!isLoading && users.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No users yet
            </div>
          )}
          {!isLoading && users.length > 0 && (
            <div className="divide-y divide-gray-200">
              {users.map((userId) => {
                const profile = getUserDisplay(userId);
                return (
                  <button
                    key={userId}
                    onClick={() => setSelectedUserId(userId)}
                    className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                      selectedUserId === userId
                        ? "bg-blue-50 text-blue-600 font-semibold"
                        : "text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {/* Profile Picture */}
                    {profile.pictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.pictureUrl}
                        alt={profile.displayName}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                        {profile.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-sm">
                        {profile.displayName}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Chat Window (col-span-2 = 66%) */}
      <div className="col-span-2 flex flex-col bg-white">
        {/* Chat Header */}
        {selectedUserId ? (
          (() => {
            const profile = getUserDisplay(selectedUserId);
            return (
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                {/* Profile Picture */}
                {profile.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.pictureUrl}
                    alt={profile.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* User Info */}
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {profile.displayName}
                  </h2>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500">Select a user to start chatting</p>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {!selectedUserId && (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400">No user selected</p>
            </div>
          )}

          {selectedUserId && orderedMessages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400">No messages yet</p>
            </div>
          )}

          {selectedUserId &&
            orderedMessages.length > 0 &&
            orderedMessages.map((msg) => (
              <div key={msg.id} className={`flex ${senderStyle(msg.sender)}`}>
                <div className="max-w-xs px-3 py-2">
                  <div className="text-xs font-semibold mb-1 opacity-75">
                    {senderLabel(msg.sender)}
                  </div>
                  <div className="text-sm">{msg.text}</div>
                  <div className="text-xs opacity-50 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Input Area */}
        {selectedUserId && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                disabled={isSending}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 placeholder:text-gray-400 text-gray-900"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
