import { NextRequest, NextResponse } from "next/server";
import { runCypher } from "@/lib/neo4j";
import { CYPHER } from "@/constants/org-chart-cypher";
import { getNodeData } from "@/lib/get-node-data";

export async function GET(req: NextRequest) {
  try {
    const results = await runCypher(CYPHER);
    console.log("cypher results", results);
    const nodesMap = new Map();
    const edges = results.map((row: any, i: number) => {

      if (!nodesMap.has(row.person1.elementId)) {
        const { type, data } = getNodeData(row.person1);
        nodesMap.set(row.person1.elementId, {
          id: row.person1.elementId,
          type,
          data,
          position: { x: 0, y: 0 },
        });
      }

      if (!nodesMap.has(row.person2.elementId)) {
        const { type, data } = getNodeData(row.person2);
        nodesMap.set(row.person2.elementId, {
          id: row.person2.elementId,
          type,
          data,
          position: { x: 0, y: 0 },
        });
      }

      return {
        id: row.rel.elementId,
        source: row.rel.startNodeElementId,
        target: row.rel.endNodeElementId,
        label: row.rel.type,
        data: {
          companies: row.rel.properties.companies,
        },
        type: "smoothstep",
      };
      
    });

    const nodes = Array.from(nodesMap.values());

    return NextResponse.json({ nodes, edges });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
