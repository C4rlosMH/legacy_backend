import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunity extends Document {
  name: string;
  description: string;
  ownerId: mongoose.Types.ObjectId; 
  
  // Privacidad y Listado
  visibility: 'public' | 'unlisted' | 'private';
  listingStatus: 'none' | 'pending' | 'approved' | 'rejected';

  // Tesorería y Personalización Visual
  treasuryBalance: number;
  themeColor: string;
  isBlogsEnabled: boolean;
  isWikisEnabled: boolean;

  blocks: any[];

  // NUEVO: Protocolo Anti-Zombie
  systemStatus: 'active' | 'warned' | 'zombie';
  systemWarningDate?: Date | undefined;

  chatCreationMode: 'all' | 'staff'
  
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
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public'
    },
    listingStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    treasuryBalance: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    themeColor: { 
      type: String, 
      default: '#121212', 
      maxlength: 7 
    },
    isBlogsEnabled: { 
      type: Boolean, 
      default: true 
    },
    isWikisEnabled: { 
      type: Boolean, 
      default: true 
    },
    // Protocolo Anti-Zombie
    systemStatus: {
      type: String,
      enum: ['active', 'warned', 'zombie'],
      default: 'active'
    },
    systemWarningDate: { type: Date },
    chatCreationMode: {
      type: String,
      enum: ['all', 'staff'],
      default: 'all'
    },
    blocks: {
      type: Schema.Types.Mixed,
      default: []
    },
  },
  { timestamps: true }
);

// VALIDACIÓN INTELIGENTE ANTES DE GUARDAR
CommunitySchema.pre('save', function (this: ICommunity) {
  if (this.visibility === 'private' && this.listingStatus !== 'none') {
    throw new Error('Una comunidad privada no puede estar listada en el buscador global.');
  }
});

// Índices
CommunitySchema.index({ visibility: 1, listingStatus: 1 });
CommunitySchema.index({ systemStatus: 1 }); // Optimiza las búsquedas diarias del Cron Job

export const CommunityModel = mongoose.model<ICommunity>('Community', CommunitySchema);