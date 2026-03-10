import { Router } from 'express';
import { claimDailyReward } from './economy.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Ruta: POST /api/v1/economy/daily-reward
// Requiere estar autenticado globalmente
router.post('/daily-reward', verifyToken, claimDailyReward);

export default router;