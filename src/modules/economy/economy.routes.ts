import { Router } from 'express';
import { claimDailyReward, tipContent } from './economy.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireLevel } from '../../middlewares/level-gate.middleware';
import { config } from '../../config';

const router = Router();

// Ruta: POST /api/v1/economy/daily-reward
// Requiere estar autenticado globalmente
router.post('/daily-reward', verifyToken, claimDailyReward);

// BARRERA ANTI-FARMING: Solo Nivel 5+ puede donar
router.post('/tip', verifyToken, requireLevel(config.permissions.minLevelToTip), tipContent);

export default router;