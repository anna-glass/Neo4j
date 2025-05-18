import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

// Import necessary LangChain components
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { SerpAPI } from "@langchain/community/tools/serpapi";
import { Calculator } from "@langchain/community/tools/calculator";
import neo4j from "neo4j-driver";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";

export const runtime = "edge";

// Helper functions to convert between Vercel and LangChain message formats
const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message._getType() === "human") {
    return { content: message.content, role: "user" };
  } else if (message._getType() === "ai") {
    return {
      content: message.content,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

// System prompt for the agent
const SYSTEM_TEMPLATE = `You are a helpful assistant that helps users explore and understand the YC Network graph. 

Here's what you can do:
1. Answer questions about founders, partners, and companies in the YC Network
2. Generate appropriate Cypher queries when users want to visualize specific relationships
3. Explain relationships between entities in the graph
4. Provide insights about the network structure

When users ask to see or visualize something in the graph, you should:
1. Generate a Cypher query that answers their question
2. Explain what the query will show
3. Indicate that they can click "Show Graph" to see the results visually

The graph has the following structure:
- Nodes: Founder, Partner, Company
- Relationships: 
  - (Founder)-[:EMPLOYEES_AT]->(Company)
  - (Company)-[:HAS_PARTNER]->(Partner)
  - Founders can be connected to other Founders via companies they work at together
  - Partners can be connected to Founders via companies they partner with

Be helpful, informative, and precise in your responses.`;

/**
 * This handler creates an agent with tools for both internet search and Neo4j graph querying
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

    // Set up tools for the agent
    const tools = [
      new Calculator(), 
      new SerpAPI(),
      cypherQueryTool
    ];
    
    // Initialize the chat model
    const chat = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
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

      return new StreamingTextResponse(transformStream);
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