import { cn } from "@/utils/cn";
import type { Message } from "ai/react";

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  sources?: any[];
}) {
  const { message, aiEmoji, sources } = props;

  return (
    <div
      className={cn(
        "rounded-[24px] max-w-[80%] mb-8 flex items-start gap-4",
        message.role === "user"
          ? "bg-secondary text-secondary-foreground px-4 py-2 ml-auto"
          : "bg-muted text-muted-foreground px-4 py-2 mr-auto"
      )}
    >
      {message.role !== "user" && (
        <div
          className="border bg-secondary rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center"
          role="img"
          aria-label="AI"
        >
          {aiEmoji}
        </div>
      )}

      <div className="whitespace-pre-wrap flex flex-col">
        <span>{message.content}</span>

        {sources && sources.length > 0 && (
          <section className="mt-4 text-xs">
            <div className="font-semibold mb-1">🔍 Sources:</div>
            <ul className="space-y-2">
              {sources.map((source, i) => (
                <li key={"source:" + i} className="bg-primary px-2 py-1 rounded">
                  <div>
                    {i + 1}. &quot;{source.pageContent}&quot;
                  </div>
                  {source.metadata?.loc?.lines !== undefined && (
                    <div>
                      Lines {source.metadata?.loc?.lines?.from} to{" "}
                      {source.metadata?.loc?.lines?.to}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
