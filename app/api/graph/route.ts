import { NextRequest, NextResponse } from "next/server";
import neo4j from "neo4j-driver";

export const runtime = "edge";

// Types for org chart nodes and edges
interface NodeProperties {
  id: string;
  name?: string;
  profilePic?: string;
  title?: string;
  [key: string]: any;
}

interface Node {
  id: string;
  label: string;
  image: string | null;
  title: string;
  properties: NodeProperties;
}

interface Edge {
  from: string;
  to: string;
  label: string;
  arrows: string;
  companies?: string[];
}

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

      const nodesMap: Map<string, Node> = new Map();
      const edges: Edge[] = [];

      result.records.forEach(record => {
        const person1 = record.get('person1').properties as NodeProperties;
        const person2 = record.get('person2').properties as NodeProperties;
        const rel = record.get('rel').properties;
        const relType = record.get('rel').type;
        const companies = rel.companies || [];

        // Add person1 node if not already present
        if (!nodesMap.has(person1.id)) {
          nodesMap.set(person1.id, {
            id: person1.id,
            label: person1.name || person1.id,
            image: person1.profilePic || null,
            title: person1.title || "",
            properties: person1
          });
        }
        // Add person2 node if not already present
        if (!nodesMap.has(person2.id)) {
          nodesMap.set(person2.id, {
            id: person2.id,
            label: person2.name || person2.id,
            image: person2.profilePic || null,
            title: person2.title || "",
            properties: person2
          });
        }

        // Add edge
        edges.push({
          from: person1.id,
          to: person2.id,
          label: relType,
          arrows: "to",
          companies: companies
        });
      });

      await session.close();
      await driver.close();

      // Convert nodesMap to array
      const nodes = Array.from(nodesMap.values());

      return NextResponse.json({ nodes, edges });
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
