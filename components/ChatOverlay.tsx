"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { LoaderCircle } from "lucide-react";

export default function ChatOverlay({
  endpoint,
  placeholder = "Ask about the org chart...",
  emoji = "🍵",
  emptyStateComponent = <div className="text-gray-400 text-center">Ask anything about the org chart…</div>,
}: {
  endpoint: string;
  placeholder?: string;
  emoji?: string;
  emptyStateComponent?: React.ReactNode;
}) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    setLoading(true);

    // Send to your chat API
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, { role: "user", content: input }] }),
    });

    if (!res.ok) {
      setLoading(false);
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
      return;
    }

    // Stream or parse response
    const reader = res.body?.getReader();
    let assistantMsg = "";
    if (reader) {
      // Stream text (for edge runtime)
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantMsg += new TextDecoder().decode(value);
        setMessages((msgs) => [
          // Remove previous assistant message if streaming
          ...msgs.filter((m) => m.role !== "assistant"),
          { role: "assistant", content: assistantMsg },
        ]);
      }
    } else {
      const data = await res.text();
      assistantMsg = data;
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: assistantMsg },
      ]);
    }
    setInput("");
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[350px] max-w-full bg-white rounded-lg shadow-lg border flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: 400 }}>
        {messages.length === 0
          ? emptyStateComponent
          : messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${
                  msg.role === "user"
                    ? "bg-blue-100 self-end text-right"
                    : "bg-gray-100 self-start text-left flex items-center gap-1"
                }`}
              >
                {msg.role === "assistant" && (
                  <span className="text-xl" aria-label="AI">{emoji}</span>
                )}
                {msg.content}
              </div>
            ))}
      </div>
      <form onSubmit={handleSubmit} className="flex border-t">
        <input
          className="flex-1 p-2 border-none outline-none bg-transparent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()} className="m-2">
          {loading ? <LoaderCircle className="animate-spin" /> : "Send"}
        </Button>
      </form>
    </div>
  );
}
