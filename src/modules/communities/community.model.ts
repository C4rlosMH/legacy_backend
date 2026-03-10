import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunity extends Document {
  name: string;
  description: string;
  ownerId: mongoose.Types.ObjectId; 
  
  // NUEVOS CAMPOS DE PRIVACIDAD Y LISTADO
  visibility: 'public' | 'unlisted' | 'private';
  listingStatus: 'none' | 'pending' | 'approved' | 'rejected';
  
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: [true, 'El nombre de la comunidad es obligatorio'], 
      unique: true, 
      trim: true 
    },
    description: { 
      type: String, 
      maxlength: [3000, 'La descripción no puede exceder los 3000 caracteres'], 
      default: '' 
    },
    ownerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    // Configuración de Privacidad
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public'
    },
    // Configuración de Listado (Para el Buscador de Team Legacy)
    listingStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    }
  },
  { timestamps: true }
);

// VALIDACIÓN INTELIGENTE ANTES DE GUARDAR
CommunitySchema.pre('save', function (this: ICommunity) {
  // Regla estricta: Las comunidades privadas no pueden estar listadas ni en revisión
  if (this.visibility === 'private' && this.listingStatus !== 'none') {
    throw new Error('Una comunidad privada no puede estar listada en el buscador global.');
  }
});

// Índice para hacer que el buscador global sea ultrarrápido filtrando por estado
CommunitySchema.index({ visibility: 1, listingStatus: 1 });

export const CommunityModel = mongoose.model<ICommunity>('Community', CommunitySchema);