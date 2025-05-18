import { NextRequest, NextResponse } from "next/server";
import neo4j from "neo4j-driver";
import type { NvlNode, NvlRelationship, GraphData } from '../../types/graph';

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const neo4jUrl = process.env.NEO4J_URL!;
    const neo4jUsername = process.env.NEO4J_USERNAME!;
    const neo4jPassword = process.env.NEO4J_PASSWORD!;
    const driver = neo4j.driver(
      neo4jUrl,
      neo4j.auth.basic(neo4jUsername, neo4jPassword)
    );
    const session = driver.session();

    try {
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

      await session.close();
      await driver.close();

      // Convert nodesMap to array
      const nodes = Array.from(nodesMap.values());

      return NextResponse.json({ nodes, relationships });
    } catch (error) {
      console.error("Neo4j query error:", error);
      await session.close();
      await driver.close();
      throw error;
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
