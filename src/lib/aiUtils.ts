/**
 * Utility for handling AI API calls with exponential backoff retry logic.
 * Specifically designed to handle 503 (Service Unavailable) and 429 (Too Many Requests).
 */

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  maxAttempts: number = 4,
  baseDelay: number = 1000
): Promise<T> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Pass the attempt number so the caller can switch models if needed
      return await fn(attempts);
    } catch (err: any) {
      attempts++;
      
      const errorMsg = JSON.stringify(err).toLowerCase();
      const isRetryable = 
        errorMsg.includes('503') || 
        errorMsg.includes('429') || 
        errorMsg.includes('service unavailable') || 
        errorMsg.includes('too many requests') ||
        errorMsg.includes('deadline exceeded') ||
        err?.status === 503 ||
        err?.status === 429 ||
        err?.status === 504;

      if (isRetryable && attempts < maxAttempts) {
        // Shorter delay initially, then aggressive backoff
        const delay = baseDelay * Math.pow(2, attempts - 1);
        console.warn(`[AI Suite Scale Guard] Attempt ${attempts} failed (${err?.status || '503'}). Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      
      throw err;
    }
  }
  
  throw new Error("Max attempts reached after " + maxAttempts + " tries.");
}

/**
 * Enterprise-grade model selection.
 * For 1M+ scale, we recommend using Vertex AI endpoints which have higher quota.
 * This helper allows falling back to more stable models if the primary is busy.
 */
export function getOptimizedModel(attempt: number, primary: string = 'gemini-3-flash-preview'): string {
  // If first attempt fails, we might want to try a more reliable (older) engine
  if (attempt >= 2) return 'gemini-1.5-flash'; 
  return primary;
}
