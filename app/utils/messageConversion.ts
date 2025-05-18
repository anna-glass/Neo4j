import { Message as VercelChatMessage } from "ai";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  isAIMessage,
  isHumanMessage,
  isBaseMessage,
  SystemMessage,
} from "@langchain/core/messages";

/**
 * Converts a Vercel AI SDK message to a LangChain message
 */
export const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

/**
 * Converts a LangChain message to a Vercel AI SDK message
 */
export const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (isHumanMessage(message)) {
    return { content: message.content, role: "user" };
  } else if (isAIMessage(message)) {
    const aiMessage = message as AIMessage;
    return {
      content: aiMessage.content,
      role: "assistant",
      tool_calls: aiMessage.tool_calls,
    };
  } else {
    // For other message types, use as BaseMessage
    const baseMsg = message as BaseMessage;
    return { 
      content: baseMsg.content, 
      role: baseMsg._getType() 
    };
  }
}; 