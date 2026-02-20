"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  ChatMessage,
  SendMessageRequestBody,
} from "@/lib/types";

type GetMessagesResponse = ApiSuccessResponse<{ messages: ChatMessage[] }> | ApiErrorResponse;
type SendMessageResponse = ApiSuccessResponse | ApiErrorResponse;

const POLL_INTERVAL_MS = 3000;

function senderStyle(sender: ChatMessage["sender"]): string {
  if (sender === "me") {
    return "ml-auto bg-zinc-900 text-white";
  }

  if (sender === "line") {
    return "bg-emerald-100 text-emerald-900";
  }

  return "bg-zinc-100 text-zinc-800";
}

function senderLabel(sender: ChatMessage["sender"]): string {
  if (sender === "me") {
    return "You";
  }

  if (sender === "line") {
    return "LINE";
  }

  return "System";
}

export default function ChatUI() {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages]
  );

  const loadMessages = async () => {
    try {
      const response = await fetch("/api/messages", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as GetMessagesResponse;

      if (!response.ok || !data.success) {
        const apiError = "error" in data ? data.error : "Failed to load messages";
        throw new Error(apiError);
      }

      setMessages(data.data.messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load messages";
      setErrorMessage(message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    void loadMessages();

    const intervalId = globalThis.setInterval(() => {
      void loadMessages();
    }, POLL_INTERVAL_MS);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const payload: SendMessageRequestBody = { message: text };
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as SendMessageResponse;

      if (!response.ok || !data.success) {
        const apiError =
          "error" in data ? data.error : "Failed to send message";
        throw new Error(apiError);
      }

      await loadMessages();
      setInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send message";
      setErrorMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="flex items-center justify-center h-screen px-4 bg-zinc-100">
      <div className="mx-auto flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <header className="px-5 py-4 border-b border-zinc-200">
          <h1 className="text-lg font-semibold text-zinc-900">LINE Webchat</h1>
        </header>

        <section className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
          {isLoadingMessages ? (
            <p className="text-sm text-zinc-500">Loading messages...</p>
          ) : null}

          {!isLoadingMessages && orderedMessages.length === 0 ? (
            <p className="text-sm text-zinc-500">No messages yet.</p>
          ) : null}

          {orderedMessages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${senderStyle(message.sender)}`}
            >
              <p className="mb-1 text-[11px] font-medium opacity-70">{senderLabel(message.sender)}</p>
              {message.text}
            </div>
          ))}
        </section>

        <div className="px-4 py-3 mt-auto space-y-2 bg-white border-t border-zinc-200">
          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Type a message"
              className="flex-1 px-3 text-sm transition border rounded-lg outline-none h-11 border-zinc-300 text-zinc-700 focus:border-zinc-500"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={() => {
                void handleSend();
              }}
              className="px-5 text-sm font-medium text-white transition rounded-lg h-11 bg-zinc-900 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
