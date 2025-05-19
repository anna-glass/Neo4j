import { DynamicTool } from "@langchain/core/tools";
import { runCypher } from "./neo4j";

export const cypherQueryTool = new DynamicTool({
  name: "cypher_query_tool",
  description: "Executes Cypher queries against the Neo4j graph database. Use this to retrieve information about the YC Network.",
  func: async (query: string) => {
    try {
      // runCypher returns an array of records
      const results = await runCypher(query);
      return JSON.stringify(results, null, 2);
    } catch (error: any) {
      return `Error executing Cypher query: ${error.message}`;
    }
  },
});
