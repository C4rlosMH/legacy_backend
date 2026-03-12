import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  communityId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId; // Quién hace la denuncia
  
  targetType: 'post' | 'comment' | 'message' | 'user' | 'wiki';
  targetId: mongoose.Types.ObjectId; // El ID de lo que se reporta
  
  reason: string; // Ej: "Spam", "Contenido inapropiado", "Acoso"
  description?: string; // Detalles extra que el usuario quiera agregar
  
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy?: mongoose.Types.ObjectId; // Qué moderador atendió el caso
  
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
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

// Índices para que el panel de moderación cargue rápido
ReportSchema.index({ communityId: 1, status: 1, createdAt: 1 });

export const ReportModel = mongoose.model<IReport>('Report', ReportSchema);