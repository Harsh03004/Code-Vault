import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', verifyJWT, getProfile);
router.put('/profile', verifyJWT, updateProfile);
router.post('/change-password', verifyJWT, changePassword);

export default router;
