import { Response } from 'express';
import { claimDailyRewardService, tipContentService } from './economy.service';
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

export const tipContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // El ID del remitente viene del token de autenticación
    const senderId = req.user?.id;
    // Los datos de la donación vienen del cuerpo de la petición (body)
    const { targetType, targetId, amount } = req.body;

    if (!senderId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    // Validamos que el tipo de contenido a donar sea correcto
    if (!targetType || !['post', 'wiki'].includes(targetType)) {
      res.status(400).json({ message: 'El tipo de objetivo debe ser "post" o "wiki"' });
      return;
    }

    // Validamos que no falten datos y que el monto sea un número válido
    if (!targetId || !amount || isNaN(amount)) {
      res.status(400).json({ message: 'Faltan datos obligatorios (targetId o monto)' });
      return;
    }

    // Ejecutamos el servicio de economía
    const result = await tipContentService({
      senderId,
      targetType,
      targetId,
      amount: Number(amount) // Nos aseguramos de pasarlo como número
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al procesar la donación' });
  }
};