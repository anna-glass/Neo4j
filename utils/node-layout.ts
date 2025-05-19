import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from 'reactflow';

const nodeWidth = 54;
const nodeHeight = 54;
const elk = new ELK();

export async function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const elkGraph = {
    id: "root",
    layoutOptions: { 'elk.algorithm': 'force' },
    children: nodes.map(node => ({
      id: node.id,
      width: nodeWidth,
      height: nodeHeight,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(elkGraph);

  const layoutedNodes = nodes.map(node => {
    const layoutNode = layout.children?.find(n => n.id === node.id);
    return {
      ...node,
      position: {
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
