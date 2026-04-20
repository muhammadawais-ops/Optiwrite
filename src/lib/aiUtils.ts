/**
 * Utility for handling AI API calls with exponential backoff retry logic.
 * Specifically designed to handle 503 (Service Unavailable) and 429 (Too Many Requests).
 */

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      return await fn();
    } catch (err: any) {
      attempts++;
      
      // Check for retryable errors (503, 429)
      const errorMsg = JSON.stringify(err).toLowerCase();
      const isRetryable = 
        errorMsg.includes('503') || 
        errorMsg.includes('429') || 
        errorMsg.includes('service unavailable') || 
        errorMsg.includes('too many requests') ||
        err?.status === 503 ||
        err?.status === 429;

      if (isRetryable && attempts < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempts - 1);
        console.warn(`AI API error (retryable). Attempt ${attempts} failed. Retrying in ${delay}ms...`, err);
        await sleep(delay);
        continue;
      }
      
      // If not retryable or max attempts reached, throw the error
      throw err;
    }
  }
  
  throw new Error("Max attempts reached");
}
