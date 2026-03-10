import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityRequest extends Document {
  userId: mongoose.Types.ObjectId;
  communityId: mongoose.Types.ObjectId;
  nickname: string; // El apodo con el que quieren entrar
  message?: string; // Un mensaje corto para convencer al staff
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const CommunityRequestSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    nickname: { type: String, required: true, trim: true },
    message: { type: String, maxlength: 500, default: '' },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    }
  },
  { timestamps: true }
);

// Índices para búsquedas rápidas del staff y para evitar duplicados pendientes
CommunityRequestSchema.index({ communityId: 1, status: 1 });
CommunityRequestSchema.index({ userId: 1, communityId: 1, status: 1 });

export const CommunityRequestModel = mongoose.model<ICommunityRequest>('CommunityRequest', CommunityRequestSchema);