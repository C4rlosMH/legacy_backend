import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunity extends Document {
  name: string;
  description: string;
  ownerId: mongoose.Types.ObjectId; // El "Líder Agente"
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
    }
  },
  { timestamps: true }
);

export const CommunityModel = mongoose.model<ICommunity>('Community', CommunitySchema);