'use client';

import { useState } from 'react';
import { ChatWindow } from "@/components/ChatWindow";
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
            Welcome to the YC Network Explorer! This tool allows you to chat and explore the network graph.
          </span>
        </li>
        <li>
          💬
          <span className="ml-2">
            You can ask questions about the YC network or request specific Cypher queries.
          </span>
        </li>
        <li>
          📊
          <span className="ml-2">
            Click "Show Graph" to view the network visualization alongside the chat.
          </span>
        </li>
        <li className="text-l">
          👇
          <span className="ml-2">
            Try asking e.g. <code>Show me connections between founders and partners</code> below!
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
          <ChatWindow
            endpoint="api/chat/explorer"
            placeholder="Ask me about the YC network or request a graph query..."
            emoji="🔍"
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