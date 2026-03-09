import mongoose, { Schema, Document } from 'mongoose';

// Interfaz para los atributos dinámicos (Ej: { name: "Raza", value: "Elfo" })
export interface IWikiAttribute {
  name: string;
  value: string;
}

export interface IWiki extends Document {
  title: string;
  content: string;
  coverImage?: string;
  backgroundImage?: string; // Para personalizar la lectura de la ficha
  
  isCharacterSheet: boolean; // El interruptor mágico
  attributes: IWikiAttribute[]; // La tabla de estadísticas/datos
  
  catalogStatus: 'none' | 'pending' | 'approved' | 'rejected'; // Estado de moderación
  
  authorId: mongoose.Types.ObjectId; // Referencia global por seguridad
  communityId: mongoose.Types.ObjectId; // El universo al que pertenece
  authorMemberId: mongoose.Types.ObjectId; // El perfil local del creador
  
  likesCount: number;
  commentsCount: number;

  isOfficial: boolean;
  originalWikiId?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const WikiAttributeSchema = new Schema<IWikiAttribute>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true }
  },
  { _id: false } // No necesitamos un ID único para cada pequeño atributo
);

const WikiSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, required: true },
    coverImage: { type: String, default: '' },
    backgroundImage: { type: String, default: '' },
    
    isCharacterSheet: { type: Boolean, default: false },
    attributes: { type: [WikiAttributeSchema], default: [] },
    
    catalogStatus: { 
      type: String, 
      enum: ['none', 'pending', 'approved', 'rejected'], 
      default: 'none' 
    },
    
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    authorMemberId: { type: Schema.Types.ObjectId, ref: 'CommunityMember', required: true },
    
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },

    isOfficial: { type: Boolean, default: false },
    originalWikiId: { type: Schema.Types.ObjectId, ref: 'Wiki' },
  },
  { timestamps: true }
);

// Índices para optimizar las búsquedas dentro de una comunidad
WikiSchema.index({ communityId: 1, catalogStatus: 1 }); // Útil para listar el catálogo oficial
WikiSchema.index({ communityId: 1, isCharacterSheet: 1 }); // Útil para filtrar solo personajes

export const WikiModel = mongoose.model<IWiki>('Wiki', WikiSchema);