export interface NvlNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface NvlRelationship {
  id: string;
  from: string;
  to: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: NvlNode[];
  relationships: NvlRelationship[];
}
  