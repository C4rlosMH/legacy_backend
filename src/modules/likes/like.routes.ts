import { Router } from 'express';
import { toggleLike } from './like.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Ruta: POST /api/v1/likes/toggle
// Body esperado: { "targetType": "wiki", "targetId": "123456..." }
router.post('/toggle', verifyToken, toggleLike);

export default router;