import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { OpenAIEmbeddings } from "@langchain/openai";
import Papa from "papaparse";

export const runtime = "edge";

/**
 * Expects:
 * - body.csv: Raw CSV string.
 * - body.type: The node type/label as a string.
 * - body.textField: The CSV column name to use as the main content for embeddings.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const csvString = body.csv;
  const nodeType = body.type;
  const textField = body.textField || "Content";

  if (!csvString || typeof csvString !== "string") {
    return NextResponse.json({ error: "No CSV string provided." }, { status: 400 });
  }
  if (!nodeType) {
    return NextResponse.json({ error: "No node type specified." }, { status: 400 });
  }

  try {
    // Parse CSV string into rows
    const parsed = Papa.parse(csvString, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: "CSV parse error", details: parsed.errors }, { status: 400 });
    }
    const rows = parsed.data as Record<string, string>[];

    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
      chunkSize: 256,
      chunkOverlap: 20,
    });

    // Prepare documents and metadata arrays
    const documents: string[] = [];
    const metadatas: Record<string, any>[] = [];

    for (const row of rows) {
      const text = row[textField];
      if (!text) continue; // Skip rows without the main text field

      // Remove the main text field from metadata to avoid duplication
      const { [textField]: _, ...metadata } = row;
      metadata.source = nodeType; // Add source/type info

      documents.push(text);
      metadatas.push(metadata);
    }

    if (documents.length === 0) {
      return NextResponse.json({ error: `No rows with the text field "${textField}" found.` }, { status: 400 });
    }

    // Split and embed all documents
    const splitDocuments = await splitter.createDocuments(documents, metadatas);

    // Neo4j vector store setup with hybrid search configuration
    const neo4jUrl = process.env.NEO4J_URL!;
    const neo4jUsername = process.env.NEO4J_USERNAME!;
    const neo4jPassword = process.env.NEO4J_PASSWORD!;
    const indexName = process.env.NEO4J_VECTOR_INDEX || "documents";
    const keywordIndexName = process.env.NEO4J_KEYWORD_INDEX || "keyword_documents";

    await Neo4jVectorStore.fromDocuments(
      splitDocuments,
      new OpenAIEmbeddings(),
      {
        url: neo4jUrl,
        username: neo4jUsername,
        password: neo4jPassword,
        indexName,
        keywordIndexName,
        searchType: "hybrid",
        nodeLabel: nodeType,
        textNodeProperty: textField,
        embeddingNodeProperty: "openaiEmbedding",
      }
    );

    return NextResponse.json({
      ok: true,
      message: `Ingested ${splitDocuments.length} chunks from ${documents.length} ${nodeType} nodes with hybrid search support.`,
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
      details: "Failed to ingest documents with hybrid search",
    }, { status: 500 });
  }
}
