import { Router } from 'express';
import { claimDailyReward, tipContent } from './economy.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Ruta: POST /api/v1/economy/daily-reward
router.post('/daily-reward', verifyToken, claimDailyReward);

// La validación de saldo suficiente ocurre en el service (sender.legacyCoins < amount)
router.post('/tip', verifyToken, tipContent);

export default router;