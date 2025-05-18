import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage } from "ai";
import { convertVercelMessageToLangChainMessage, convertLangChainMessageToVercelMessage } from "../../../utils/messageConversion";

// Import necessary LangChain components
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import neo4j from "neo4j-driver";
import { SystemMessage } from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";

export const runtime = "edge";

// System prompt for the agent
const SYSTEM_TEMPLATE = `You are Slate, a friendly and insightful AI that can navigate YC network data using Neo4j.

You have access to a database with information about:
- YC Founders and their companies
- YC Partners and their relationships
- Company connections and relationships
- Various YC network insights

You should provide helpful, data-driven responses about:
- Connections between founders and partners
- Company relationships 
- Potential mentorship opportunities
- Latest insights from the YC ecosystem (including from podcasts, Twitter/X, etc.)

The graph visualization is ALWAYS visible to the user, so you should generate relevant Cypher queries whenever appropriate.

The graph has the following structure:
- Nodes: Founder, Partner, Company
- Relationships: 
  - (Founder)-[:EMPLOYEES_AT]->(Company)
  - (Company)-[:HAS_PARTNER]->(Partner)
  - Founders can be connected to other Founders via companies they work at together
  - Partners can be connected to Founders via companies they partner with

Be friendly, casual, and insightful. Sound like a helpful product rather than a YC partner.`;

/**
 * This handler creates an agent with Neo4j graph querying capabilities
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const returnIntermediateSteps = body.show_intermediate_steps;
    
    /**
     * We represent intermediate steps as system messages for display purposes,
     * but don't want them in the chat history.
     */
    const messages = (body.messages ?? [])
      .filter(
        (message: VercelChatMessage) =>
          message.role === "user" || message.role === "assistant",
      )
      .map(convertVercelMessageToLangChainMessage);

    // Set up Neo4j connection for the Cypher query tool
    const neo4jUrl = process.env.NEO4J_URL!;
    const neo4jUsername = process.env.NEO4J_USERNAME!;
    const neo4jPassword = process.env.NEO4J_PASSWORD!;

    // Create a Cypher query tool
    const cypherQueryTool = new DynamicTool({
      name: "cypher_query_tool",
      description: "Executes Cypher queries against the Neo4j graph database. Use this to retrieve information about the YC Network.",
      func: async (query: string) => {
        const driver = neo4j.driver(
          neo4jUrl,
          neo4j.auth.basic(neo4jUsername, neo4jPassword)
        );
        
        const session = driver.session();
        try {
          // Execute the query
          const result = await session.run(query);
          
          // Format the results
          const formattedResults = result.records.map(record => {
            const resultObj: any = {};
            record.keys.forEach(key => {
              const value = record.get(key);
              // Handle Neo4j node objects
              if (value && value.properties) {
                resultObj[key] = value.properties;
              } else {
                resultObj[key] = value;
              }
            });
            return resultObj;
          });
          
          return JSON.stringify(formattedResults, null, 2);
        } catch (error: any) {
          return `Error executing Cypher query: ${error.message}`;
        } finally {
          await session.close();
          await driver.close();
        }
      }
    });

    // Set up tools for the agent - only using cypherQueryTool
    const tools = [cypherQueryTool];
    
    // Initialize the chat model
    const chat = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.3, // Slightly higher for more conversational responses
    });

    /**
     * Create a ReAct agent with our tools
     */
    const agent = createReactAgent({
      llm: chat,
      tools,
      /**
       * Set the system prompt for the agent
       */
      messageModifier: new SystemMessage(SYSTEM_TEMPLATE),
    });

    if (!returnIntermediateSteps) {
      /**
       * Stream back all generated tokens and steps from their runs.
       *
       * We do some filtering of the generated events and only stream back
       * the final response as a string.
       */
      const eventStream = await agent.streamEvents(
        { messages },
        { version: "v2" },
      );

      const textEncoder = new TextEncoder();
      const transformStream = new ReadableStream({
        async start(controller) {
          for await (const { event, data } of eventStream) {
            if (event === "on_chat_model_stream") {
              // Intermediate chat model generations will contain tool calls and no content
              if (!!data.chunk.content) {
                controller.enqueue(textEncoder.encode(data.chunk.content));
              }
            }
          }
          controller.close();
        },
      });

      return new Response(transformStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } else {
      /**
       * Return all intermediate steps for debugging
       */
      const result = await agent.invoke({ messages });

      return NextResponse.json(
        {
          messages: result.messages.map(convertLangChainMessageToVercelMessage),
        },
        { status: 200 },
      );
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
} 