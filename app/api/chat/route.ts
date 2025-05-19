import { NextRequest, NextResponse } from "next/server";
import { Message as UIMessage } from "ai/react";
import { UIToLangChainMessage } from "@/lib/convert-message";
import { ChatOpenAI } from "@langchain/openai";
import { runCypher, fetchAndCacheSchema } from "@/lib/neo4j";
import { extractCypherFromResponse } from "@/lib/extract-cypher-from-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body.messages ?? [])
      .filter((m: UIMessage) => m.role === "user" || m.role === "assistant")
      .map(UIToLangChainMessage);

    const userQuestion = messages[messages.length - 1]?.content ?? "";

    // Fetch and cache schema for prompt context
    let schema: string;
    try {
      schema = await fetchAndCacheSchema();
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
    
    Guidelines:
    - Only use node labels, relationship types, and properties that are present in the schema above.
    - If the question cannot be answered using ONLY the schema, respond with a Cypher comment: // Cannot answer with current schema.
    - Do NOT guess or invent any labels, relationships, or properties.
    
    Write a Cypher query for the following question, and then answer it using the results.
    Question: "${userQuestion}"
    `;

    // Get Cypher from LLM
    const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.3 });
    const cypherResponse = await llm.invoke(prompt);
    const cypherRaw = cypherResponse.content.toString().trim();
    console.log("Raw LLM response:", cypherRaw);
    const cypher = extractCypherFromResponse(cypherRaw);
    console.log("Extracted Cypher:", cypher);

    // Run Cypher on Neo4j using your utility
    let results;
    try {
      results = await runCypher(cypher);
      console.log("results", results);
    } catch (err) {
      console.error("Cypher execution error:", err);
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }

    // Compose answer (very basic for now)
    const answer = JSON.stringify(results, null, 2);

    return new Response(answer, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e: any) {
    console.error("API error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
