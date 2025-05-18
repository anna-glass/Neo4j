import { Metadata } from 'next';
import NetworkContainer from './components/NetworkContainer';

export const metadata: Metadata = {
  title: 'YC Network - Organization Chart',
  description: 'Explore the YC Network as an interactive organization chart'
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <NetworkContainer />
    </main>
  );
}
