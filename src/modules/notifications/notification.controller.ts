import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { getUserNotificationsService, createNotificationService, markNotificationAsReadService } from './notification.service';

// Obtener las notificaciones del usuario (Globales o de una Comunidad)
export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    // Extraemos el communityId de la URL si existe (ej. /api/v1/notifications?communityId=123)
    const communityId = req.query.communityId as string | undefined;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const notifications = await getUserNotificationsService(userId, communityId);
    
    res.status(200).json({
      message: 'Notificaciones obtenidas exitosamente',
      notifications
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener las notificaciones' });
  }
};

// Marcar una notificación específica como leída (apagar el punto rojo)
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const notification = await markNotificationAsReadService(notificationId, userId);
    
    res.status(200).json({
      message: 'Notificación marcada como leída',
      notification
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al actualizar la notificación' });
  }
};