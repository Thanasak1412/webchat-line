"use client";

import { useState } from "react";

type ChatMessage = {
  id: number;
  text: string;
  sender: "me" | "system";
};

type SendMessageApiSuccess = {
  success: true;
};

type SendMessageApiError = {
  success: false;
  error: string;
};

type SendMessageApiResponse = SendMessageApiSuccess | SendMessageApiError;

export default function ChatUI() {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "This is your LINE webchat starter.",
      sender: "system",
    },
  ]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      const data = (await response.json()) as SendMessageApiResponse;

      if (!response.ok || !data.success) {
        const apiError = "error" in data ? data.error : "Failed to send message";
        throw new Error(apiError);
      }

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now(),
          text,
          sender: "me",
        },
      ]);
      setInput("");
    } catch {
      setErrorMessage("Unable to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="flex h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="mx-auto flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <header className="border-b border-zinc-200 px-5 py-4">
          <h1 className="text-lg font-semibold text-zinc-900">LINE Webchat</h1>
        </header>

        <section className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                message.sender === "me"
                  ? "ml-auto bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-800"
              }`}
            >
              {message.text}
            </div>
          ))}
        </section>

        <div className="mt-auto space-y-2 border-t border-zinc-200 bg-white px-4 py-3">
          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message"
              className="h-11 flex-1 rounded-lg border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-500"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={() => {
                void handleSend();
              }}
              className="h-11 rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
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