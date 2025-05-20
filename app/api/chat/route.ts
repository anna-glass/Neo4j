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
Write a Cypher query for Neo4j that answers the following user question: ${userQuestion}

Below is the schema for the organizational chart database:

Graph schema:
- Node labels and properties:
  - Founder: name, image, company
  - Partner: name, role, bio, image, youtube_videos
  - Company: name, primary_partner, short_description, image, tag, location, website, long_description
  - YoutubeVideo: name, host1, host2, host3, host4, summary

- Relationships:
  // Physical (stored in Neo4j)
  - (Founder)-[:FOUNDER_OF]->(Company)
  - (Company)-[:HAS_PARTNER]->(Partner)
  - (Founder)-[:COFOUNDER_AT]->(Company)
  - (YoutubeVideo)-[:HAS_HOST]->(Partner)
  // Virtual (already created in Cypher queries)
  - (Founder)-[:SHARES_COMPANY_WITH {companies: [company names]}]->(Partner)
  - (Founder)-[:COFOUNDER_AT {companies: [company names]}]->(Founder)
  - (Partner)-[:SHARED_VIDEO_WITH {videos: [video names]}]->(Partner)

Instructions:
- Only use the node labels, relationship types, and properties listed in the schema above.
- Do NOT use any other labels, relationships, or properties.
- Do NOT guess or invent any part of the schema.
- Only write Cypher queries that read data (do not create, update, or delete).
- Limit the maximum number of results to 10 unless the question requires otherwise.
- Output ONLY the Cypher query as a code block, with NO explanation or commentary.


Examples:
- "What companies is Dalton Caldwell a primary partner of?"
    MATCH (partner:Partner)<-[:HAS_PARTNER]-(company:Company)
    WHERE company.primary_partner = 'Dalton Caldwell'
    RETURN company.name
- "What has Dalton Caldwell been discussing lately?"
    MATCH (p:Partner {name: "Dalton Caldwell"})<-[:HAS_HOST]-(v:YoutubeVideo)
    RETURN v.name AS video_title, v.summary AS summary
- "Who are the founders of the company called 'Den'?"
    MATCH (f:Founder)-[:FOUNDER_OF]->(c:Company {name: "Den"})
    RETURN f.name AS founder_name
- "What can you tell me about Dalton Caldwell?"
    MATCH (p:Partner {name: "Dalton Caldwell"})
    RETURN p.name AS partner_name, p.bio AS bio

`;

    // Get Cypher from LLM
    const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.3 });
    const cypherResponse = await llm.invoke(prompt);
    const cypherRaw = cypherResponse.content.toString().trim();
    const cypher = extractCypherFromResponse(cypherRaw);
    console.log("cypher", cypher);

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

Instructions:
- Use only the data provided in the JSON result below to answer the user's question.
- Answer in clear, natural language, summarizing the result.
- Be concise—limit your answer to 2 sentences and only state the key facts found in the data.
- If no relevant data was found, just say "Could not find anything on that, sorry!"

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
