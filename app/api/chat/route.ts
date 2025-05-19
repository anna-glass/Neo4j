import { NextRequest, NextResponse } from "next/server";
import { Message as UIMessage } from "ai/react";
import { UIToLangChainMessage } from "@/lib/convert-message";
import { ChatOpenAI } from "@langchain/openai";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body.messages ?? [])
      .filter((m: UIMessage) => m.role === "user" || m.role === "assistant")
      .map(UIToLangChainMessage);

    const userQuestion = messages[messages.length - 1]?.content ?? "";

    // Initialize Neo4j graph connection
    const graph = await Neo4jGraph.initialize({
      url: process.env.NEO4J_URL!,
      username: process.env.NEO4J_USERNAME!,
      password: process.env.NEO4J_PASSWORD!,
    });

    // Get schema for prompt context
    const schema = await graph.getSchema();

    // Compose prompt for Cypher generation
    const prompt = `
    You are an expert Cypher developer. Given this Neo4j schema:

    ${schema}

    Write a Cypher query for the following question, then answer it using the results:
    "${userQuestion}"
    `;

    // Get Cypher from LLM
    const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.3 });
    const cypherResponse = await llm.invoke(prompt);
    const cypher = cypherResponse.content.toString().trim();

    // Run Cypher on Neo4j
    const results = await graph.query(cypher);

    // Compose answer (very basic for now)
    const answer = JSON.stringify(results, null, 2);

    return new Response(answer, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
