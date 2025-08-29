const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const path = require('path');

// Load .env from project root AND override any existing env vars of same name
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  override: true
});

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- Diagnostics: show whether key is present (but don't leak it) ---
const apiKey = (process.env.GEMINI_API_KEY || '').trim();
console.log('[ENV] GEMINI_API_KEY present?', apiKey.length > 0, 'length:', apiKey.length);

// Create client with the sanitized key
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/analyze', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code in request.' });
    const MAX_CHARS = 12000; // ~12KB, adjust as needed
    const clipped = code.length > MAX_CHARS;
    const codeSlice = clipped ? code.slice(0, MAX_CHARS) : code;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze the following code for security vulnerabilities 
    and suggest fixes. Be concise and clear.${clipped ? 
      " NOTE: The code was truncated for length; point out areas that would need a full review." : ""
      }\n\nCODE:\n\n${codeSlice}`;
    async function callWithRetry(fn, attempts = 3) {
      let lastErr;
      for (let i = 0; i < attempts; i++) {
        try { return await fn(); } catch (e) {
          lastErr = e;
          // Look for Retry-After / retryDelay hints in the error
          const retryMatch = /retryDelay":"(\d+)s/.exec(String(e?.message || e));
          const waitMs = retryMatch ? Number(retryMatch[1]) * 1000 : (1000 * Math.pow(2, i));
          if (String(e).includes('429') && i < attempts - 1) {
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          }
          throw e;
        }
      }
      throw lastErr;
    }

    const result = await callWithRetry(() => model.generateContent(prompt));

    const analysisText = result.response.text();
    res.json({ analysis: analysisText });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: error.message || 'An error occurred with the AI model.' });
  }
});

app.listen(port, () => {
  console.log(`AI Gateway server is running on http://localhost:${port}`);
});
