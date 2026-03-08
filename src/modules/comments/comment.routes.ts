import { Router } from 'express';
import { createComment } from './comment.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Ruta: POST /api/v1/comments
router.post('/', verifyToken, createComment);

export default router;