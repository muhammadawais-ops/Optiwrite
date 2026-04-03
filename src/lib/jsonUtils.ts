/**
 * Safely parses a JSON string, handling potential markdown blocks or trailing text from AI responses.
 */
export function safeJsonParse<T>(text: string | undefined | null, fallback: T): T {
  if (!text) return fallback;

  let cleaned = text.trim();

  // Remove markdown code blocks if they exist
  if (cleaned.includes("```json")) {
    const parts = cleaned.split("```json");
    if (parts.length > 1) {
      cleaned = parts[1].split("```")[0];
    }
  } else if (cleaned.includes("```")) {
    const parts = cleaned.split("```");
    if (parts.length > 1) {
      cleaned = parts[1].split("```")[0];
    }
  }

  // Try to extract the first JSON object or array if there's trailing text
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let startIdx = -1;
  let endChar = '';
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endChar = '}';
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endChar = ']';
  }

  if (startIdx !== -1) {
    const lastIdx = cleaned.lastIndexOf(endChar);
    if (lastIdx !== -1 && lastIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, lastIdx + 1);
    }
  }

  try {
    return JSON.parse(cleaned.trim()) as T;
  } catch (e) {
    console.error("Failed to parse JSON:", e, "Original text:", text);
    return fallback;
  }
}
