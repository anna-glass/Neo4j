'use client';

import { useState, useEffect } from 'react';
import { ExplorerChatWindow } from "@/components/ExplorerChatWindow";
import dynamic from 'next/dynamic';

// Since the graph component uses client-side APIs, load it dynamically
const NetworkPage = dynamic(() => import('../network/page'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading graph visualization...</div>
});

export default function ExplorerPage() {
  const InfoCard = (
    <div className="p-4 bg-secondary/50 rounded-md">
      <p className="mb-2">
        Hi, I'm Slate! This is a demo of our product with YC data - ask me anything about founders and partners (even latest insights from podcasts or Twitter!)
      </p>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row h-full gap-0">
        <div className="flex-1 md:w-1/2">
          <ExplorerChatWindow
            endpoint="api/chat/explorer"
            placeholder="Ask about YC network connections, founders, or partners..."
            emoji="🚀"
            emptyStateComponent={InfoCard}
          />
        </div>
        
        <div className="flex-1 h-full border-l border-input">
          <NetworkPage />
        </div>
      </div>
    </div>
  );
} 