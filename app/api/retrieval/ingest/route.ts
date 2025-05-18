import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { OpenAIEmbeddings } from "@langchain/openai";

export const runtime = "edge";

// Before running, follow set-up instructions at
// https://js.langchain.com/docs/integrations/vectorstores/neo4jvector

/**
 * This handler takes input text, splits it into chunks, and embeds those chunks
 * into a Neo4j vector store for later retrieval.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = body.text;

  if (process.env.NEXT_PUBLIC_DEMO === "true") {
    return NextResponse.json(
      {
        error: [
          "Ingest is not supported in demo mode.",
          "Please set up your own version of the repo here: https://github.com/langchain-ai/langchain-nextjs-template",
        ].join("\n"),
      },
      { status: 403 }
    );
  }

  try {
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
      chunkSize: 256,
      chunkOverlap: 20,
    });

    const splitDocuments = await splitter.createDocuments([text]);

    // Neo4j vector store setup
    const neo4jUrl = process.env.NEO4J_URL!;
    const neo4jUsername = process.env.NEO4J_USERNAME!;
    const neo4jPassword = process.env.NEO4J_PASSWORD!;
    const indexName = process.env.NEO4J_VECTOR_INDEX || "documents"; // customize as needed

    // Ingest documents into Neo4j vector store
    await Neo4jVectorStore.fromDocuments(
      splitDocuments,
      new OpenAIEmbeddings(),
      {
        url: neo4jUrl,
        username: neo4jUsername,
        password: neo4jPassword,
        indexName,
      }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
