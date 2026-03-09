import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    // A qué sala de chat pertenece este mensaje
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    // Quién de los participantes lo envió
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // El texto del mensaje
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Para mostrar el doble check azul en el futuro
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);