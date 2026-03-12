import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityTitle extends Document {
  communityId: mongoose.Types.ObjectId;
  name: string; // Ej: "Gryffindor", "Auror"
  color: string; // Código Hexadecimal, Ej: "#740001"
  group: string; // Para clasificar: "Casas de Hogwarts", "Profesión"
  isExclusive: boolean; // Si es true, el usuario solo puede tener 1 título de este mismo 'group'
  isKey: boolean; // Identificador visual o lógico para saber si sirve como llave de chat
  createdAt: Date;
  updatedAt: Date;
}

const CommunityTitleSchema: Schema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#FFFFFF', maxlength: 7 },
    group: { type: String, required: true, trim: true },
    isExclusive: { type: Boolean, default: false },
    isKey: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Índice para listar rápido el catálogo del staff
CommunityTitleSchema.index({ communityId: 1, group: 1 });

export const CommunityTitleModel = mongoose.model<ICommunityTitle>('CommunityTitle', CommunityTitleSchema);