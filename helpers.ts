import { z } from "zod";

// Format a safe MCP-compliant tool result from arbitrary data
// If the payload looks like UseKeen { result: { results: [...] } },
// map each item to a text content block. Always include structuredContent passthrough.
export function formatToolSuccess(data: unknown): { content: { type: "text"; text: string }[]; structuredContent?: unknown } {
  try {
    if (
      data &&
      typeof data === "object" &&
      // @ts-ignore dynamic inspection
      "result" in (data as any) &&
      // @ts-ignore dynamic inspection
      (data as any).result && typeof (data as any).result === "object" &&
      // @ts-ignore dynamic inspection
      Array.isArray((data as any).result.results)
    ) {
      // @ts-ignore dynamic shape
      const results = (data as any).result.results as unknown[];
      const content = results
        .map((item) => {
          // Prefer well-known fields. Use string content as-is.
          const textCandidate =
            typeof (item as any)?.content === "string"
              ? (item as any).content
              : typeof (item as any)?.text === "string"
              ? (item as any).text
              : undefined;
          if (typeof textCandidate === "string" && textCandidate.trim().length > 0) {
            return { type: "text" as const, text: textCandidate };
          }
          // Fallback: compact JSON of the item
          let fallback = "";
          try {
            fallback = JSON.stringify(item, null, 2);
          } catch {
            fallback = String(item);
          }
          return { type: "text" as const, text: fallback };
        });

      if (content.length > 0) {
        return { content, structuredContent: data };
      }
    }
  } catch {
    // ignore and fall back below
  }

  // Fallback: pretty print whatever we got as a single text block
  let text: string;
  try {
    text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  } catch {
    text = String(data);
  }
  return { content: [{ type: "text", text }], structuredContent: data };
}

export function formatToolError(err: unknown): { content: { type: "text"; text: string }[]; isError: true } {
  const message = err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
  const details = err instanceof Error && err.stack ? `\n\nStack:\n${err.stack}` : "";
  return {
    content: [
      {
        type: "text",
        text: `Tool call failed: ${message}${details}`,
      },
    ],
    isError: true as const,
  };
}

// Optional: export a Zod schema for content blocks if needed elsewhere
export const ContentBlockSchema = z.object({ type: z.literal("text"), text: z.string() });

