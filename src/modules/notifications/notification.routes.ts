import { Router } from 'express';
import { getUserNotifications, markAsRead } from './notification.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Ruta: GET /api/v1/notifications
// Si se quiere la campana local, el frontend llamará a: /api/v1/notifications?communityId=XYZ
router.get('/', verifyToken, getUserNotifications);

// Ruta: PUT /api/v1/notifications/:id/read
router.put('/:id/read', verifyToken, markAsRead);

export default router;