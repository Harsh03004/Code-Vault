/*const express = require('express');
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
*/
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // ✅ no custom path

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- User Schema ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// --- Registration Route ---
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashed });
    await newUser.save();

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// --- Login Route ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '2d' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// --- Gemini AI (your existing code) ---
const apiKey = (process.env.GEMINI_API_KEY || '').trim();
console.log('[ENV] GEMINI_API_KEY present?', apiKey.length > 0, 'length:', apiKey.length);
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/analyze', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code in request.' });

    const MAX_CHARS = 12000;
    const clipped = code.length > MAX_CHARS;
    const codeSlice = clipped ? code.slice(0, MAX_CHARS) : code;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze the following code for security vulnerabilities and suggest fixes. Be concise and clear.${
      clipped ? " NOTE: The code was truncated for length." : ""
    }\n\nCODE:\n\n${codeSlice}`;

    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();
    res.json({ analysis: analysisText });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'AI model error.' });
  }
});

app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
