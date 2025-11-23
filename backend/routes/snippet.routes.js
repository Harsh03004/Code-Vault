import express from 'express';
import { 
  getAllSnippets, 
  createSnippet, 
  getSnippetById, 
  updateSnippet, 
  deleteSnippet 
} from '../controllers/snippet.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/snippets', verifyJWT, getAllSnippets);
router.post('/snippets', verifyJWT, createSnippet);
router.get('/snippets/:id', verifyJWT, getSnippetById);
router.put('/snippets/:id', verifyJWT, updateSnippet);
router.delete('/snippets/:id', verifyJWT, deleteSnippet);

export default router;
