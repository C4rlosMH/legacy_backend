import { NotificationModel } from './notification.model';
import app from '../../app'
import {Server} from 'socket.io'

interface CreateNotificationDTO {
  recipientId: string;
  senderId?: string;
  type: 'chat_invite' | 'new_message' | 'post_like' | 'post_comment' | 'comment_reply' | 'system_alert';
  context: 'global' | 'community';
  communityId?: string;
  referenceId?: string;
}

// 1. Crear una notificación (Para usar internamente en otros servicios)
export const createNotificationService = async (data: CreateNotificationDTO) => {
  // Regla de negocio: No le enviamos una notificación a un usuario por sus propias acciones
  if (data.senderId && data.recipientId.toString() === data.senderId.toString()) {
    return null;
  }

  // 1. Construimos el payload base solo con los campos obligatorios
  const payload: any = {
    recipientId: data.recipientId,
    type: data.type,
    context: data.context,
    isRead: false
  };

  // 2. Agregamos los campos opcionales SOLO si vienen definidos
  if (data.senderId) payload.senderId = data.senderId;
  if (data.communityId) payload.communityId = data.communityId;
  if (data.referenceId) payload.referenceId = data.referenceId;

  // 3. Creamos el documento con el payload limpio
  const notification = await NotificationModel.create(payload);

  // 4. TIEMPO REAL: Emitimos la notificación a la sala personal del usuario
  try {
    const io: Server = app.get('io');
    if (io) {
      // Emitimos al canal que tiene el mismo nombre que el recipientId
      io.to(data.recipientId.toString()).emit('new_notification', notification);
    }
  } catch (error) {
    console.error('[SOCKET] Error al emitir la notificación en tiempo real:', error);
  }

  return notification;
};

// 2. Obtener notificaciones (El motor de la Campana Global y Local)
export const getUserNotificationsService = async (userId: string, communityId?: string) => {
  // Iniciamos la consulta base: solo las notificaciones de este usuario
  const query: any = { recipientId: userId };

  if (communityId) {
    // Si el frontend envía un communityId, filtramos SOLO las de ese universo (Campana Local)
    query.communityId = communityId;
    query.context = 'community';
  } else {
    // Si no envía communityId, mostramos TODO (Campana Global)
    // Opcional: Podrías restringir aquí para que la global solo muestre context: 'global' 
    // pero usualmente la global es un resumen de todo. Lo dejaremos como resumen de todo.
  }

  const notifications = await NotificationModel.find(query)
    .populate('senderId', 'name username avatar') // Traemos los datos de quien causó la alerta
    .sort({ createdAt: -1 }) // Las más recientes primero
    .limit(50); // Límite razonable para no saturar la memoria

  return notifications;
};

// 3. Marcar una notificación como leída
export const markNotificationAsReadService = async (notificationId: string, userId: string) => {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, recipientId: userId }, // Validamos que la notificación sea suya
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    throw new Error('Notificación no encontrada o no tienes permiso para modificarla');
  }

  return notification;
};
