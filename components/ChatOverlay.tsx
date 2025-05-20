'use client';

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatOverlay({
  endpoint,
  placeholder = "Ask me anything about the YC network...",
}: {
  endpoint: string;
  placeholder?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const answer = await res.text();
      setMessages((msgs) => [
        ...msgs,
        { id: crypto.randomUUID(), role: "assistant", content: answer },
      ]);
    } catch {
      setMessages((msgs) => [
        ...msgs,
        { id: crypto.randomUUID(), role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  // Show only the last message from assistant (or empty if none)
  const lastAssistantMsg = messages.filter(m => m.role === "assistant").at(-1)?.content || "";

  return (
    <div
      className="fixed bottom-8 left-1/2 z-50"
      style={{ transform: "translateX(-50%)", width: "75vw", maxWidth: 900 }}
    >
      <div
        className="backdrop-blur-lg bg-white/30 border border-white/40 shadow-2xl rounded-2xl px-8 py-6 flex flex-col items-center"
        style={{
          width: "100%",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        }}
      >
        {lastAssistantMsg && (
          <div className="w-full mb-3">
            <div className="bg-white/60 rounded-xl px-4 py-2 text-gray-900 shadow-inner border border-white/20">
              {lastAssistantMsg}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex w-full">
          <input
            className="flex-1 px-4 py-3 rounded-l-xl border-none outline-none bg-white/40 text-gray-900 placeholder-gray-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            style={{
              backdropFilter: "blur(8px)",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-white/70 hover:bg-white/90 rounded-r-xl px-6 py-3 font-semibold text-gray-700 transition disabled:opacity-50"
            style={{ backdropFilter: "blur(8px)" }}
          >
            {loading ? <LoaderCircle className="animate-spin" /> : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
