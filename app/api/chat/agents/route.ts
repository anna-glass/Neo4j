import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage } from "ai";
import { convertVercelMessageToLangChainMessage, convertLangChainMessageToVercelMessage } from "../../../utils/messageConversion";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import neo4j from "neo4j-driver";
import {
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";

export const runtime = "edge";

const YC_PARTNER_TEMPLATE = `You are a helpful YC partner with deep knowledge of the YC network. 
Your goal is to help founders navigate the YC ecosystem by providing insights about:
- Connections between founders and partners
- Company relationships
- Potential mentorship opportunities
- Network insights

Use the graph database to answer questions with accurate information.
Be concise but informative, and focus on providing actionable insights.
If you don't know something, be honest and suggest how the user might find the information elsewhere.

Respond in a professional, supportive manner as a YC partner would.`;

/**
 * This handler initializes and calls an agent with Neo4j graph querying capabilities.
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

    // Only use the graph database tool
    const tools = [cypherQueryTool];
    
    const chat = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.2,
    });

    /**
     * Use a prebuilt LangGraph agent with our custom YC partner prompt.
     */
    const agent = createReactAgent({
      llm: chat,
      tools,
      messageModifier: new SystemMessage(YC_PARTNER_TEMPLATE),
    });

    if (!returnIntermediateSteps) {
      /**
       * Stream back all generated tokens and steps from their runs.
       *
       * We do some filtering of the generated events and only stream back
       * the final response as a string.
       *
       * For this specific type of tool calling ReAct agents with OpenAI, we can tell when
       * the agent is ready to stream back final output when it no longer calls
       * a tool and instead streams back content.
       *
       * See: https://langchain-ai.github.io/langgraphjs/how-tos/stream-tokens/
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
       * We could also pick intermediate steps out from `streamEvents` chunks, but
       * they are generated as JSON objects, so streaming and displaying them with
       * the AI SDK is more complicated.
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
