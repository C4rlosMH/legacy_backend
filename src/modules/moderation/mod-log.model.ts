import mongoose, { Schema, Document } from 'mongoose';

export interface IModLog extends Document {
  communityId: mongoose.Types.ObjectId;
  moderatorId: mongoose.Types.ObjectId; // Puede ser un Admin, Curador o el propio Sentinel
  
  action: 'ban' | 'unban' | 'hide_profile' | 'strike' | 'delete_post' | 'delete_message' | 'delete_comment' | 'resolve_report';
  
  targetUserId?: mongoose.Types.ObjectId; // Si la acción fue contra una persona
  targetId?: mongoose.Types.ObjectId; // Si la acción fue contra un contenido (ID del post/mensaje)
  
  reason?: string; // Motivo de la acción para auditoría
  createdAt: Date;
}

const ModLogSchema: Schema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    moderatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { 
      type: String, 
      enum: ['ban', 'unban', 'hide_profile', 'strike', 'delete_post', 'delete_message', 'delete_comment', 'resolve_report'], 
      required: true 
    },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    targetId: { type: Schema.Types.ObjectId },
    reason: { type: String, maxlength: 300, trim: true }
  },
  { timestamps: { updatedAt: false } } // Un log es inmutable, no tiene updatedAt
);

// Índice para ver el historial cronológico de un universo
ModLogSchema.index({ communityId: 1, createdAt: -1 });
// Índice para ver el historial de castigos de un usuario específico
ModLogSchema.index({ communityId: 1, targetUserId: 1 });

export const ModLogModel = mongoose.model<IModLog>('ModLog', ModLogSchema);