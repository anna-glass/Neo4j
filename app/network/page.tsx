'use client';

import { useEffect, useRef, useState } from 'react';
import { NVL } from '@neo4j-nvl/base';
import type { GraphData } from '../types/graph';

type ClickedNodeInfo = {
  node: any;
  x: number;
  y: number;
};

export default function Network() {
  const [graph, setGraph] = useState<GraphData>({ nodes: [], relationships: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickedNode, setClickedNode] = useState<ClickedNodeInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nvlRef = useRef<any>(null);

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

  useEffect(() => {
    if (!loading && graph.nodes.length > 0 && containerRef.current) {
      // Clean up previous NVL instance
      if (nvlRef.current) {
        nvlRef.current.destroy();
        nvlRef.current = null;
      }

      // Create new NVL instance
      nvlRef.current = new NVL(
        containerRef.current,
        graph.nodes,
        graph.relationships,
        {
          layout: 'forceDirected',
          initialZoom: 0.2,
          disableTelemetry: true,
        }
      );

      // Add nodeClick event handler
      nvlRef.current.on('nodeClick', (node: any, event: any) => {
        const rect = containerRef.current!.getBoundingClientRect();
        const x = event.domEvent.clientX - rect.left;
        const y = event.domEvent.clientY - rect.top;
        setClickedNode({ node, x, y });
      });

      // Clean up on unmount
      return () => {
        nvlRef.current?.destroy();
      };
    }
  }, [loading, graph]);

  if (loading)
    return (
      <div className="flex items-center justify-center w-full h-full">
        Loading network data...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center w-full h-full text-red-500">
        Error: {error}
      </div>
    );
  if (graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        No network data available. Try asking a question about the network.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ minHeight: '500px' }}
    >
      {clickedNode && (
        <div
          className="absolute z-20 bg-white border rounded shadow-lg p-3 text-xs"
          style={{
            left: clickedNode.x + 10,
            top: clickedNode.y + 10,
            minWidth: 180,
            maxWidth: 260,
            pointerEvents: 'auto',
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold">Node Data</span>
            <button
              className="ml-2 text-gray-500 hover:text-black"
              onClick={() => setClickedNode(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(clickedNode.node, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
