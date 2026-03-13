import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  scope: 'global' | 'community'; // <-- NUEVO: Define quién debe atender esto
  communityId?: mongoose.Types.ObjectId; // <-- AHORA ES OPCIONAL
  reporterId: mongoose.Types.ObjectId; 
  
  targetType: 'post' | 'comment' | 'message' | 'user' | 'wiki';
  targetId: mongoose.Types.ObjectId; 
  
  reason: string; 
  description?: string; 
  
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy?: mongoose.Types.ObjectId; 
  
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    scope: { 
      type: String, 
      enum: ['global', 'community'], 
      default: 'community' 
    },
    // Le quitamos el "required: true"
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' }, 
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { 
      type: String, 
      enum: ['post', 'comment', 'message', 'user', 'wiki'], 
      required: true 
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500, trim: true },
    status: { 
      type: String, 
      enum: ['pending', 'resolved', 'dismissed'], 
      default: 'pending' 
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Índice actualizado para búsquedas súper rápidas dependiendo del alcance
ReportSchema.index({ scope: 1, communityId: 1, status: 1, createdAt: 1 });

export const ReportModel = mongoose.model<IReport>('Report', ReportSchema);