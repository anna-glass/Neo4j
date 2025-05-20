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
import FounderNode from './FounderNode';
import PartnerNode from './PartnerNode';
import FounderDetailCard from './FounderDetailCard';
import PartnerDetailCard from './PartnerDetailCard';

const nodeTypes = {
  founder: FounderNode,
  partner: PartnerNode,
};

const detailCardTypes = {
  founder: FounderDetailCard,
  partner: PartnerDetailCard,
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
          style: { stroke: '#CBCBCB', strokeWidth: 2 },
        }}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
      >
        <Background color="#eaf6fb" gap={20} />
        <Controls />
      </ReactFlow>
      {selectedNode && (() => {
        const DetailCard =
          detailCardTypes[selectedNode.type as keyof typeof detailCardTypes];
        if (!DetailCard) return null;
        return (
          <DetailCard
            open={!!selectedNode}
            person={selectedNode.data}
            onClose={() => setSelectedNode(null)}
          />
        );
      })()}
    </>
  );
}
