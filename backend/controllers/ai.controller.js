import { genAI, validateApiKey, callWithRetry } from '../utils/gemini.util.js';

export const analyzeCode = async (req, res) => {
  try {
    validateApiKey();
    const { code } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'Missing code in request.' });
    }

    const MAX_CHARS = 12000;
    const clipped = code.length > MAX_CHARS;
    const codeSlice = clipped ? code.slice(0, MAX_CHARS) : code;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analyze the following code for security vulnerabilities and suggest fixes. Be concise and clear.${clipped ? " NOTE: The code was truncated for length." : ""}\n\nCODE:\n\n${codeSlice}`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    const analysisText = result.response.text();

    res.json({ analysis: analysisText });
  } catch (error) {
    console.error('[API] /api/analyze - Error:', error.message);
    res.status(500).json({ error: error.message || 'AI model error.' });
  }
};

export const chatWithAI = async (req, res) => {
  try {
    validateApiKey();
    const { message, code } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Missing message in request.' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    let prompt = `You are a helpful coding assistant. The user has asked: ${message}\n\n`;

    if (code && code.trim().length > 0) {
      const MAX_CHARS = 12000;
      const codeSlice = code.length > MAX_CHARS ? code.slice(0, MAX_CHARS) : code;
      prompt += `Here is their current code for context:\n\n${codeSlice}\n\n`;
    }

    prompt += `Provide a helpful, concise response.`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    const replyText = result.response.text();

    res.json({ reply: replyText });
  } catch (error) {
    console.error('[API] /api/chat - Error:', error.message);
    res.status(500).json({ error: error.message || 'AI model error.' });
  }
};

export const performAction = async (req, res) => {
  try {
    validateApiKey();
    const { code, action } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'Missing code in request.' });
    }

    if (!action || action.trim().length === 0) {
      return res.status(400).json({ error: 'Missing action type in request.' });
    }

    const MAX_CHARS = 12000;
    const clipped = code.length > MAX_CHARS;
    const codeSlice = clipped ? code.slice(0, MAX_CHARS) : code;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    let prompt;

    switch (action) {
      case 'explain':
        prompt = `Explain the following code in detail. Break down what each part does and how it works together. Use clear language suitable for developers.${clipped ? '\n\nNOTE: The code was truncated for length.' : ''}\n\nCODE:\n\n${codeSlice}`;
        break;
      case 'document':
        prompt = `Generate comprehensive documentation for the following code. Include:\n- Function/class descriptions\n- Parameter explanations\n- Return value descriptions\n- Usage examples${clipped ? '\n\nNOTE: The code was truncated for length.' : ''}\n\nCODE:\n\n${codeSlice}`;
        break;
      case 'optimize':
        prompt = `Analyze the following code and suggest optimizations for:\n- Performance improvements\n- Code readability\n- Best practices\n- Potential refactoring${clipped ? '\n\nNOTE: The code was truncated for length.' : ''}\n\nCODE:\n\n${codeSlice}`;
        break;
      default:
        return res.status(400).json({ error: `Unknown action type: ${action}` });
    }

    const result = await callWithRetry(() => model.generateContent(prompt));
    const resultText = result.response.text();

    res.json({ result: resultText });
  } catch (error) {
    console.error('[API] /api/action - Error:', error.message);
    res.status(500).json({ error: error.message || 'AI model error.' });
  }
};
