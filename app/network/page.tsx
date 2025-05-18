import { Metadata } from 'next';
import NetworkContainer from '../components/NetworkContainer';

export const metadata: Metadata = {
  title: 'Network Graph | YC Network',
  description: 'Explore the YC Network as an interactive organization chart'
};

export default function NetworkPage() {
  return (
    <main className="min-h-screen">
      <NetworkContainer />
    </main>
  );
} 