'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { GraphData } from '../types/graph';

// Dynamically import the BasicNvlWrapper with SSR disabled
const BasicNvlWrapper = dynamic(
  () => import('@neo4j-nvl/react').then((mod) => mod.BasicNvlWrapper),
  { ssr: false } // This prevents SSR rendering attempts
);

export default function Network() {
  const [graph, setGraph] = useState<GraphData>({ nodes: [], relationships: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/graph')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch graph data');
        return res.json();
      })
      .then((data: GraphData) => {
        setGraph(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading network...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <BasicNvlWrapper
        nodes={graph.nodes}
        rels={graph.relationships}
        nvlOptions={{
          layout: 'forceDirected',
          initialZoom: 0.8,
          disableTelemetry: true
        }}
      />
    </div>
  );
}
