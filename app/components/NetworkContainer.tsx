'use client';

import dynamic from 'next/dynamic';

// Since NetworkGraph uses browser APIs, we need to load it dynamically on the client side
const NetworkGraph = dynamic(() => import('./NetworkGraph'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading network visualization...</div>
});

export default function NetworkContainer() {
  return <NetworkGraph />;
} 