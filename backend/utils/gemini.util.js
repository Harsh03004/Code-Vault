import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = (process.env.GEMINI_API_KEY || '').trim();

if (!apiKey || apiKey.length === 0) {
  console.error('❌ [STARTUP ERROR] GEMINI_API_KEY is missing');
} else {
  console.log('✅ [STARTUP] GEMINI_API_KEY is present (length:', apiKey.length, 'characters)');
}

export const genAI = new GoogleGenerativeAI(apiKey);

export function validateApiKey() {
  if (!apiKey || apiKey.length === 0) {
    throw new Error('Gemini API key not configured');
  }
}

export async function callWithRetry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const retryMatch = /retryDelay":"(\d+)s/.exec(String(e?.message || e));
      const waitMs = retryMatch ? Number(retryMatch[1]) * 1000 : (1000 * Math.pow(2, i));
      const isRateLimitError = String(e).includes('429');

      if (isRateLimitError && i < attempts - 1) {
        console.log(`[RETRY] Waiting ${waitMs}ms before retry ${i + 2}...`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}
