import { Response } from 'express';
import { claimDailyRewardService } from './economy.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const claimDailyReward = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await claimDailyRewardService(userId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al procesar la recompensa diaria' });
  }
};