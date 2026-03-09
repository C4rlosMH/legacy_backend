import mongoose, { Schema, Document } from 'mongoose';

export interface IWikiCategory extends Document {
  name: string; // Ej: "Personajes Oficiales", "Magia", "Lugares"
  description?: string;
  communityId: mongoose.Types.ObjectId; // A qué universo pertenece
  // Opcional: Para permitir subcarpetas en el futuro
  parentId?: mongoose.Types.ObjectId; 
  createdAt: Date;
  updatedAt: Date;
}

const WikiCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'WikiCategory', default: null }
  },
  { timestamps: true }
);

// Índice para buscar rápido las categorías de una comunidad
WikiCategorySchema.index({ communityId: 1 });

export const WikiCategoryModel = mongoose.model<IWikiCategory>('WikiCategory', WikiCategorySchema);