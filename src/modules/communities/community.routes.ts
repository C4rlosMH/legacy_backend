import { Router } from 'express';
import { createCommunity } from './community.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Ruta: POST /api/v1/communities
router.post('/', verifyToken, createCommunity);

// Aquí a futuro agregaremos rutas como:
// router.get('/:id', getCommunityDetails);
// router.put('/:id', updateCommunity);

export default router;