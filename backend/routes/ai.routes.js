import express from 'express';
import { analyzeCode, chatWithAI, performAction } from '../controllers/ai.controller.js';

const router = express.Router();

router.post('/analyze', analyzeCode);
router.post('/chat', chatWithAI);
router.post('/action', performAction);

export default router;
