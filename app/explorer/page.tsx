'use client';

import { useState } from 'react';
import { ExplorerChatWindow } from "@/components/ExplorerChatWindow";
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

// Since the graph component uses client-side APIs, load it dynamically
const NetworkPage = dynamic(() => import('../network/page'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading graph...</div>
});

export default function ExplorerPage() {
  const [showGraph, setShowGraph] = useState(false);
  
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          🔍
          <span className="ml-2">
            Welcome to the YC Network Explorer! I am your YC partner guide to the network.
          </span>
        </li>
        <li>
          💬
          <span className="ml-2">
            Ask me about founder-partner connections, company relationships, or potential mentorship opportunities.
          </span>
        </li>
        <li>
          📊
          <span className="ml-2">
            Click Show Graph to visualize network relationships as we discuss them.
          </span>
        </li>
        <li className="text-l">
          👇
          <span className="ml-2">
            Try asking: <code>Who are the most connected partners in this network?</code> or <code>Show me founders working on AI companies</code>
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-2 bg-secondary/50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowGraph(!showGraph)}
        >
          {showGraph ? 'Hide Graph' : 'Show Graph'}
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row h-full gap-0">
        <div className={`flex-1 transition-all ${showGraph ? 'md:w-1/2' : 'md:w-full'}`}>
          <ExplorerChatWindow
            endpoint="api/chat/explorer"
            placeholder="Ask me about YC network connections, founders, or partners..."
            emoji="🚀"
            showIntermediateStepsToggle={true}
            emptyStateComponent={InfoCard}
          />
        </div>
        
        {showGraph && (
          <div className="flex-1 h-full border-l border-input">
            <NetworkPage />
          </div>
        )}
      </div>
    </div>
  );
} 