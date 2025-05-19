import { Message as UIMessage } from "ai/react";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  isAIMessage,
  isHumanMessage,
} from "@langchain/core/messages";

export const UIToLangChainMessage = (message: UIMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

export const LangChainToUIMessage = (message: BaseMessage) => {
  const id = (message as any).id;

  if (isHumanMessage(message)) {
    return id
      ? { id, content: message.content, role: "user" } as UIMessage
      : { content: message.content, role: "user" } as UIMessage;
  } else if (isAIMessage(message)) {
    const aiMessage = message as AIMessage;
    const base = {
      content: aiMessage.content,
      role: "assistant",
      ...(aiMessage.tool_calls ? { tool_calls: aiMessage.tool_calls } : {}),
    };
    return id ? { id, ...base } as UIMessage : base as UIMessage;
  } else {
    const baseMsg = message as BaseMessage;
    const base = {
      content: baseMsg.content,
      role: baseMsg._getType(),
    };
    return id ? { id, ...base } as UIMessage : base as UIMessage;
  }
};
