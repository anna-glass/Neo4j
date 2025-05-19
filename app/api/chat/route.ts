import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage } from "ai";
import { convertVercelMessageToLangChainMessage } from "@/lib/convert-message"
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage } from "@langchain/core/messages";
import { SYSTEM_TEMPLATE } from "../../../constants/system-template";
import { cypherQueryTool } from "../../../lib/cypher-query-tool";
import { streamAgentEvents } from "../../../lib/stream-agent-events";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // only user/assistant messages
    const messages = (body.messages ?? [])
      .filter(
        (m: VercelChatMessage) =>
          m.role === "user" || m.role === "assistant"
      )
      .map(convertVercelMessageToLangChainMessage);

    const chat = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.3,
    });

    // create langchain agent
    const agent = createReactAgent({
      llm: chat,
      tools: [cypherQueryTool],
      messageModifier: new SystemMessage(SYSTEM_TEMPLATE),
    });

    console.log("messages", messages);
    const eventStream = await agent.streamEvents(
      { messages },
      { version: "v2" }
    );

    console.log("eventStream", eventStream);
    const agentEventStream = await streamAgentEvents(eventStream);
    console.log("agentEventStream", agentEventStream);
    return new Response(agentEventStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
}