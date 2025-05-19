'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { GraphData } from '../types/graph';

// Dynamically import the BasicNvlWrapper with SSR disabled
const BasicNvlWrapper = dynamic(
  () => import('@neo4j-nvl/react').then((mod) => mod.BasicNvlWrapper),
);

export default function Network() {
  const [graph, setGraph] = useState<GraphData>({ nodes: [], relationships: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Network component mounted');
    fetch('/api/graph')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch graph data');
        return res.json();
      })
      .then((data: GraphData) => {
        console.log('Graph data received:', data);
        setGraph(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching graph data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // This useEffect ensures the graph visualization resizes properly
  useEffect(() => {
    if (!loading && graph.nodes.length > 0 && containerRef.current) {
      console.log('Container dimensions:', containerRef.current.offsetWidth, 'x', containerRef.current.offsetHeight);
      // Force a resize event to ensure the graph visualization properly fills the container
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
    }
  }, [loading, graph.nodes.length]);

  if (loading) return <div className="flex items-center justify-center w-full h-full">Loading network data...</div>;
  if (error) return <div className="flex items-center justify-center w-full h-full text-red-500">Error: {error}</div>;
  
  if (graph.nodes.length === 0) {
    return <div className="flex items-center justify-center w-full h-full">No network data available. Try asking a question about the network.</div>;
  }

  console.log('Rendering graph with:', graph.nodes.length, 'nodes and', graph.relationships.length, 'relationships');

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full" 
      style={{ minHeight: '500px', position: 'relative' }}
    >
      <BasicNvlWrapper
        nodes={graph.nodes}
        rels={graph.relationships}
        nvlOptions={{
          layout: 'forceDirected',
          initialZoom: 0.2,
          disableTelemetry: true
        }}
      />
    </div>
  );
}
