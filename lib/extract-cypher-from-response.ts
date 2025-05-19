export function extractCypherFromResponse(response: string): string {
    // Try to extract from a ```
    const codeBlockMatch = response.match(/```cypher([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    // Try to extract from a generic ``` code block
    const genericBlockMatch = response.match(/``````/);
    if (genericBlockMatch) {
      return genericBlockMatch[1].trim();
    }
    // Otherwise, try to find the first MATCH/RETURN Cypher-looking statement
    const cypherMatch = response.match(/(MATCH[\s\S]+?RETURN[\s\S]+?)(\n|$)/i);
    if (cypherMatch) {
      return cypherMatch[1].trim();
    }
    // As a fallback, return the whole response (may error, but at least you see it)
    return response.trim();
  }
  