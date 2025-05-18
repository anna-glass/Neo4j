import { NextRequest, NextResponse } from "next/server";
import neo4j from "neo4j-driver";
import type { NvlNode, NvlRelationship, GraphData } from '../../types/graph';

export const runtime = "edge";

// Sample data to return if no data is found in Neo4j
const SAMPLE_DATA: GraphData = {
  nodes: [
    {
      id: "sample-founder-1",
      labels: ["Founder"],
      properties: { name: "Sample Founder 1", company: "AI Startup" }
    },
    {
      id: "sample-founder-2",
      labels: ["Founder"],
      properties: { name: "Sample Founder 2", company: "Data Insights" }
    },
    {
      id: "sample-partner",
      labels: ["Partner"],
      properties: { name: "Sample YC Partner", expertise: "AI/ML" }
    }
  ],
  relationships: [
    {
      id: "sample-rel-1",
      from: "sample-founder-1",
      to: "sample-partner",
      type: "SHARES_COMPANY_WITH",
      properties: { companies: ["AI Startup"] }
    },
    {
      id: "sample-rel-2",
      from: "sample-founder-1",
      to: "sample-founder-2",
      type: "COFOUNDER_AT",
      properties: { companies: ["Previous Startup"] }
    }
  ]
};

export async function GET(req: NextRequest) {
  let session = null;
  let driver = null;
  
  try {
    console.log("Graph API called");
    const neo4jUrl = process.env.NEO4J_URL;
    const neo4jUsername = process.env.NEO4J_USERNAME;
    const neo4jPassword = process.env.NEO4J_PASSWORD;
    
    if (!neo4jUrl || !neo4jUsername || !neo4jPassword) {
      console.log("Missing Neo4j credentials, returning sample data");
      return NextResponse.json(SAMPLE_DATA);
    }
    
    driver = neo4j.driver(
      neo4jUrl,
      neo4j.auth.basic(neo4jUsername, neo4jPassword)
    );
    
    session = driver.session();
    console.log("Neo4j session created");

    // Run your union Cypher query to get all connections
    const result = await session.run(`
      // Founder–Partner connections
      MATCH (f:Founder)-[:EMPLOYEES_AT]->(c:Company)-[:HAS_PARTNER]->(p:Partner)
      WITH f, p, collect(c.name) AS shared_companies
      RETURN f AS person1, p AS person2, apoc.create.vRelationship(f, 'SHARES_COMPANY_WITH', {companies: shared_companies}, p) AS rel

      UNION ALL

      // Founder–Founder connections
      MATCH (f1:Founder)-[:EMPLOYEES_AT]->(c:Company)<-[:EMPLOYEES_AT]-(f2:Founder)
      WHERE elementId(f1) < elementId(f2)
      WITH f1, f2, collect(c.name) AS shared_companies
      RETURN f1 AS person1, f2 AS person2, apoc.create.vRelationship(f1, 'COFOUNDER_AT', {companies: shared_companies}, f2) AS rel
    `);

    console.log(`Query returned ${result.records.length} records`);
    
    // If no data is found, return sample data
    if (result.records.length === 0) {
      console.log("No records found in Neo4j, returning sample data");
      return NextResponse.json(SAMPLE_DATA);
    }
    
    const nodesMap = new Map<string, NvlNode>();
    const relationships: NvlRelationship[] = [];

    result.records.forEach((record, index) => {
      const person1 = record.get('person1');
      const person2 = record.get('person2');
      const rel = record.get('rel');
      const relType = rel.type;
      const companies = rel.properties.companies || [];
      
      // Add person1 node if not already present
      if (!nodesMap.has(person1.elementId)) {
        nodesMap.set(person1.elementId, {
          id: person1.elementId,
          labels: person1.labels,
          properties: person1.properties
        });
      }
      
      // Add person2 node if not already present
      if (!nodesMap.has(person2.elementId)) {
        nodesMap.set(person2.elementId, {
          id: person2.elementId,
          labels: person2.labels,
          properties: person2.properties
        });
      }

      // Add relationship
      relationships.push({
        id: `rel-${index}`,
        from: person1.elementId,
        to: person2.elementId,
        type: relType,
        properties: {
          companies: companies
        }
      });
    });

    // Convert nodesMap to array
    const nodes = Array.from(nodesMap.values());
    console.log(`Returning ${nodes.length} nodes and ${relationships.length} relationships`);

    const graphData: GraphData = { nodes, relationships };
    
    return NextResponse.json(graphData);
  } catch (e: any) {
    console.error("Graph API error:", e);
    // Return sample data in case of error
    console.log("Error occurred, returning sample data");
    return NextResponse.json(SAMPLE_DATA);
  } finally {
    if (session) {
      try {
        await session.close();
      } catch (e) {
        console.error("Error closing Neo4j session:", e);
      }
    }
    if (driver) {
      try {
        await driver.close();
      } catch (e) {
        console.error("Error closing Neo4j driver:", e);
      }
    }
  }
}
