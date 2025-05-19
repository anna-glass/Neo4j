import { NextRequest, NextResponse } from "next/server";
import { Message as UIMessage } from "ai/react";
import { UIToLangChainMessage } from "@/lib/convert-message";
import { ChatOpenAI } from "@langchain/openai";
import { runCypher, fetchAndCacheSchema } from "@/lib/neo4j";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body.messages ?? [])
      .filter((m: UIMessage) => m.role === "user" || m.role === "assistant")
      .map(UIToLangChainMessage);

    const userQuestion = messages[messages.length - 1]?.content ?? "";
    console.log("userQuestion", userQuestion);

    // Fetch and cache schema for prompt context
    let schema: string;
    try {
      console.log("fetching schema");
      schema = await fetchAndCacheSchema();
      console.log("schema fetched");
    } catch (schemaError) {
      console.error("Error fetching schema:", schemaError);
      return NextResponse.json(
        { error: (schemaError as Error).message },
        { status: 500 }
      );
    }
    console.log("schema", schema);

    const prompt = `
You are an expert Cypher developer for Neo4j.
The database schema is:
${schema}

Write a Cypher query for the following question, and then answer it using the results.
Question: "${userQuestion}"
`;

    // Get Cypher from LLM
    const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.3 });
    const cypherResponse = await llm.invoke(prompt);
    const cypher = cypherResponse.content.toString().trim();

    // Run Cypher on Neo4j using your utility
    const results = await runCypher(cypher);
    console.log("results", results);

    // Compose answer (very basic for now)
    const answer = JSON.stringify(results, null, 2);

    return new Response(answer, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
