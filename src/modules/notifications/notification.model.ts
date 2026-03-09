import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: 'chat_invite' | 'new_message' | 'post_like' | 'post_comment' | 'comment_reply' | 'system_alert';
  context: 'global' | 'community';
  communityId?: mongoose.Types.ObjectId;
  referenceId?: mongoose.Types.ObjectId; // ID del Chat, Post o Comment
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    // Quién recibe la notificación
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Quién generó la acción (puede ser nulo si es una alerta del sistema)
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    // Qué tipo de alerta es
    type: {
      type: String,
      enum: [
        'chat_invite', 
        'new_message', 
        'post_like', 
        'post_comment', 
        'comment_reply', 
        'system_alert'
      ],
      required: true,
    },
    // Dónde ocurrió
    context: {
      type: String,
      enum: ['global', 'community'],
      required: true,
    },
    // Si fue en una comunidad, guardamos cuál
    communityId: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
    },
    // El ID del recurso para que el frontend sepa a dónde navegar al hacer clic
    referenceId: {
      type: Schema.Types.ObjectId,
    },
    // Para apagar el punto rojo en la campana
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);