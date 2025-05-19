'use client';

import { ExplorerChatWindow } from "@/components/ExplorerChatWindow";
import dynamic from "next/dynamic";
import { StickToBottom } from "use-stick-to-bottom";

// Dynamically import the Network component with SSR disabled
const Network = dynamic(() => import('@/components/Network'), { ssr: false });

export default function ExplorerPage() {
  const InfoCard = (
    <div className="p-4 bg-secondary/50 rounded-md">
      <p className="mb-2">
        Hey, this is Slate! Check out this demo of our product with YC data - ask me anything about YC founders, partners, or connections!
      </p>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 flex-col md:flex-row h-full min-h-[600px]">
        <div className="flex-1 md:w-1/2 h-full overflow-auto">
          <StickToBottom>
            <ExplorerChatWindow
              endpoint="api/chat/explorer"
              placeholder="Ask about YC network connections, founders, or partners..."
              emoji="🍵"
              emptyStateComponent={InfoCard}
            />
          </StickToBottom>
        </div>

        <div className="flex-1 md:w-1/2 h-full border-t md:border-t-0 md:border-l border-input overflow-auto">
          <Network />
        </div>
      </div>
    </div>
  );
}
