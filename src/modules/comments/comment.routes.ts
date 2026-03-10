import { Router } from 'express';
import { createComment, deleteComment, getComments } from './comment.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Ruta: GET /api/v1/comments/:targetType/:targetId
// La lectura es pública, por lo que usamos un controlador normal sin el middleware de roles estricto
router.get('/:targetType/:targetId', verifyToken, getComments);

// Ruta: POST /api/v1/comments
router.post('/', verifyToken, createComment);

// Ruta: DELETE /api/v1/comments/:commentId
router.delete('/:commentId', verifyToken, deleteComment);

export default router;