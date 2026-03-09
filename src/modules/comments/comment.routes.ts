import { Router } from 'express';
import { createComment, deleteComment } from './comment.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Ruta: POST /api/v1/comments
router.post('/', verifyToken, createComment);

// Ruta: DELETE /api/v1/comments/:commentId
router.delete('/:commentId', verifyToken, deleteComment);

export default router;