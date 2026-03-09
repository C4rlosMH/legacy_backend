import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { toggleLikeService } from './like.service';

export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { targetType, targetId } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!targetType || !targetId) {
      res.status(400).json({ message: 'El tipo y el ID del objetivo son obligatorios' });
      return;
    }

    if (!['post', 'wiki', 'comment'].includes(targetType)) {
      res.status(400).json({ message: 'Tipo de objetivo no válido' });
      return;
    }

    const result = await toggleLikeService(userId, targetType as any, targetId);
    
    res.status(200).json(result);
  } catch (error: any) {
    // Capturamos errores de duplicidad de Mongoose por si hay peticiones concurrentes
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ya has dado like a este elemento' });
      return;
    }
    res.status(400).json({ message: error.message || 'Error al procesar el like' });
  }
};