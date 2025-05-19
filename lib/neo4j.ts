import neo4j, { Driver, Session } from 'neo4j-driver';

let cachedSchema: string | null = null;
let lastSchemaFetch = 0;
const SCHEMA_CACHE_TTL = 1000 * 60 * 10;

// serverless means we need to create a new driver per request
function getDriver(): Driver {
  return neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME!,
      process.env.NEO4J_PASSWORD!
    )
  );
}

// run a cypher query
export async function runCypher<T = any>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const driver = getDriver();
  const session: Session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(record => record.toObject() as T);
  } finally {
    await session.close();
    await driver.close();
  }
}

export async function fetchAndCacheSchema(): Promise<string> {
  const now = Date.now();
  if (cachedSchema && now - lastSchemaFetch < SCHEMA_CACHE_TTL) {
    return cachedSchema;
  }

  try {
    const [labels, rels] = await Promise.all([
      runCypher<{ label: string }>("CALL db.labels() YIELD label RETURN label"),
      runCypher<{ type: string }>("CALL db.relationshipTypes() YIELD relationshipType AS type RETURN type"),
    ]);

    const schema = `
Node labels: ${labels.map(l => l.label).join(", ") || "None"}
Relationship types: ${rels.map(r => r.type).join(", ") || "None"}
    `.trim();

    cachedSchema = schema;
    lastSchemaFetch = now;
    return schema;
  } catch (err) {
    console.error("Error in fetchAndCacheSchema:", err);
    throw new Error("Failed to fetch Neo4j schema: " + (err as Error).message);
  }
}