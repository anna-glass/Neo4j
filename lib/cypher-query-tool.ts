import { StructuredTool } from "@langchain/core/tools";
import { runCypher } from "./neo4j";
import { z } from "zod";

const schema = z.object({
  input: z.string().nullable().optional()
});

class CypherQueryTool extends StructuredTool {
  name = "cypher_query_tool";
  description = "Executes Cypher queries against the Neo4j graph database. Use this to retrieve information about the YC Network.";
  schema = schema;

  async _call({ input }: z.infer<typeof schema>): Promise<string> {
    try {
      // runCypher returns an array of records
      const results = await runCypher(input || "");
      return JSON.stringify(results, null, 2);
    } catch (error: any) {
      return `Error executing Cypher query: ${error.message}`;
    }
  }
}

export const cypherQueryTool = new CypherQueryTool();
