import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Since NetworkGraph uses browser APIs, we need to load it dynamically on the client side
const NetworkGraph = dynamic(() => import('../components/NetworkGraph'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading network visualization...</div>
});

export const metadata: Metadata = {
  title: 'Network Graph | YC Network',
  description: 'Explore the YC Network as an interactive organization chart'
};

export default function NetworkPage() {
  return (
    <main className="min-h-screen">
      <NetworkGraph />
    </main>
  );
} 