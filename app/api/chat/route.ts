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

Graph schema:
- Node labels and properties:
  - Founder: name, image, company
  - Partner: name, role, bio, image
  - Company: name, primary_partner, short_description, image, tag, location, website, long_description

- Relationships:
  - (Founder)-[:FOUNDER_OF]->(Company)
  - (Company)-[:HAS_PARTNER]->(Partner)
  - (Founder)-[:COFOUNDER_AT]->(Company)

Instructions:
- Use only the schema above when interpreting the data and answering questions.
- Answer the user's question in clear, natural language, summarizing the result.
- Be concise—limit your answer to 2 sentences and only state the key facts found in the data.
- If the result says it couldn't answer the question or no data was found, politely explain that no data was found.
- Do not repeat the question or include unnecessary details.

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
