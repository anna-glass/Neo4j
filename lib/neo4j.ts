import neo4j, { Driver, Session } from 'neo4j-driver';

// serverless means we need to create a new driver per request
function getDriver(): Driver {
  return neo4j.driver(
    process.env.NEO4J_URI as string,
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME as string,
      process.env.NEO4J_PASSWORD as string
    )
  );
}

// run a cypher query
export async function runCypher<T = any>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  console.log("Running cypher query:", cypher);
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
