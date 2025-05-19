export async function streamAgentEvents(eventStream: AsyncIterable<any>) {
    const textEncoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        for await (const { event, data } of eventStream) {
          if (event === "on_chat_model_stream" && data.chunk.content) {
            controller.enqueue(textEncoder.encode(data.chunk.content));
          }
        }
        controller.close();
      },
    });
  }
  