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

    const prompt = `
You are an expert Cypher developer for Neo4j.
The database schema is:
${schema}

Guidelines:
- Only use node labels, relationship types, and properties that are present in the schema above.
- If the question cannot be answered using ONLY the schema, respond politely that you could not answer the question.
- Do NOT guess or invent any labels, relationships, or properties.

Write a Cypher query for the following question, and output it as a \`\`\`cypher code block, with NO explanation or commentary.
Question: "${userQuestion}"
`;

    // Get Cypher from LLM
    const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.3 });
    const cypherResponse = await llm.invoke(prompt);
    const cypherRaw = cypherResponse.content.toString().trim();
    const cypher = extractCypherFromResponse(cypherRaw);

    // Run Cypher on Neo4j using your utility
    let results;
    try {
      results = await runCypher(cypher);
    } catch (err) {
      console.error("Cypher execution error:", err);
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }

    const reasoningPrompt = `
    You are an assistant answering questions about an organizational chart, based on Neo4j database results.
    
    Here are some example question, query, and answer pairs:
    
    Example 1:
    User question:
    Who founded Example Corp?
    Cypher query:
    MATCH (p:Person)-[:FOUNDER_OF]->(c:Company {name: "Example Corp"}) RETURN p.name
    Raw database result (as JSON):
    [
      { "p.name": "Alice Smith" }
    ]
    Answer:
    Alice Smith founded Example Corp, which is a company that makes widgets.
    
    Example 2:
    User question:
    Who are Alice Smith's cofounders?
    Cypher query:
    MATCH (p1:Person {name: "Alice Smith"})-[:COFOUNDER_AT]->(c:Company)<-[:COFOUNDER_AT]-(p2:Person)
    RETURN p2.name, c.name
    Raw database result (as JSON):
    [
      { "p2.name": "Bob Lee", "c.name": "Acme Inc." },
      { "p2.name": "Carol Jones", "c.name": "Acme Inc." }
    ]
    Answer:
    Alice Smith's cofounders at Acme Inc. are Bob Lee and Carol Jones.

    Example 3:
    User question:
    Who are the partners at YC?
    Cypher query:
    MATCH (p:Partner) RETURN p.name
    Raw database result (as JSON):
    [
      { "p.name": "Alice Smith" },
      { "p.name": "Bob Lee" },
      { "p.name": "Carol Jones" }
    ]
    Answer:
    The partners at YC are Alice Smith, Bob Lee, and Carol Jones.

    Example 4:
    User question:
    Which companies is Garry Tan a partner for?
    Cypher query:
    MATCH (p:Person {name: "Garry Tan"})<-[:HAS_PARTNER]-(c:Company) RETURN c.name
    Raw database result (as JSON):
    [
      { "c.name": "Acme Inc." },
      { "c.name": "Beta LLC" }
    ]
    Answer:
    Garry Tan is a primary partner for Acme Inc. and Beta LLC.
    
    Now, answer the user's question below in the same style—concise, factual, and no unnecessary details.
    
    User question:
    ${userQuestion}
    
    Cypher query:
    ${cypher}
    
    Raw database result (as JSON):
    ${JSON.stringify(results, null, 2)}
    
    Answer (concise, max 2 sentences):
    `;
    
    

    // Get the final answer from the LLM
    const answerResponse = await llm.invoke(reasoningPrompt);
    const answer = answerResponse.content.toString().trim();

    return new Response(answer, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e: any) {
    console.error("API error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
