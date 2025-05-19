import { useState } from "react";
import { Button } from "./ui/button";
import { LoaderCircle } from "lucide-react";
import { ChatMessageBubble } from "./ChatMessageBubble"; 
import type { Message } from "ai/react";

type ChatMessage = Message & { sources?: any[] };

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userId = crypto.randomUUID();
    const userMsg: ChatMessage = { id: userId, role: "user", content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setLoading(true);

    // Send to your chat API (use the same ID for the user message)
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
    });

    if (!res.ok) {
      setLoading(false);
      setMessages((msgs) => [
        ...msgs,
        { id: crypto.randomUUID(), role: "assistant", content: "Sorry, something went wrong." },
      ]);
      return;
    }

    // Generate assistant message ID once
    const assistantId = crypto.randomUUID();
    let assistantMsg = "";
    const reader = res.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantMsg += new TextDecoder().decode(value);
        setMessages((msgs) => {
          // Remove any previous assistant message with this id, then add/update
          const msgsWithoutAssistant = msgs.filter((m) => m.id !== assistantId);
          return [
            ...msgsWithoutAssistant,
            { id: assistantId, role: "assistant", content: assistantMsg },
          ];
        });
      }
    } else {
      const data = await res.text();
      assistantMsg = data;
      setMessages((msgs) => [
        ...msgs,
        { id: assistantId, role: "assistant", content: assistantMsg },
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
          : messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                aiEmoji={emoji}
                sources={msg.sources || []}
              />
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
