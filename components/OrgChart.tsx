'use client';

import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { getLayoutedElements } from '@/utils/node-layout'; // Should return a Promise
import Neo4jsNode from './Neo4jsNode';

const nodeTypes = {
  founder: Neo4jsNode,
  partner: Neo4jsNode,
};

interface OrgChartProps {
  initialNodes: Node[];
  initialEdges: Edge[];
}

export default function OrgChart({ initialNodes, initialEdges }: OrgChartProps) {
  // Start with empty state; layout will populate it
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Layout nodes and edges whenever initialNodes/initialEdges change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        await getLayoutedElements(initialNodes, initialEdges);
      if (!cancelled) {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'straight',
          style: { stroke: '#black', strokeWidth: 2 },
        }}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
      >
        <Background color="#eaf6fb" gap={20} />
        <Controls />
      </ReactFlow>
      {selectedNode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px] relative">
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={() => setSelectedNode(null)}
            >
              ✕
            </button>
            <img
              src={selectedNode.data.image}
              alt={selectedNode.data.name}
              className="mx-auto w-20 h-20 rounded-full object-cover mb-2"
            />
            <h2 className="text-lg font-bold text-center">{selectedNode.data.name}</h2>
            {selectedNode.data.title && (
              <div className="text-center text-gray-500">{selectedNode.data.title}</div>
            )}
            {selectedNode.data.role && (
              <div className="text-center text-gray-500">{selectedNode.data.role}</div>
            )}
            {selectedNode.data.bio && (
              <div className="mt-2 text-center text-sm">{selectedNode.data.bio}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
