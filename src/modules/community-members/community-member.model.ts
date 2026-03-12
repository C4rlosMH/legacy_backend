import mongoose, { Schema, Document } from 'mongoose';
import { config } from '../../config';

export interface ICommunityMember extends Document {
  userId: mongoose.Types.ObjectId;
  communityId: mongoose.Types.ObjectId;
  nickname: string;
  avatar?: string; 
  bio?: string;    
  role: 'system' | 'owner' | 'admin' | 'moderator' | 'member';
  roleplayData?: Record<string, any>;
  
  // MODERACIÓN Y ESTADOS (SPRINT 3)
  isHidden: boolean; 
  hiddenUntil?: Date | undefined; // Para el Modo Lectura (Mute temporal)
  status: 'active' | 'banned' | 'left'; // Soft Delete y Baneos
  strikeCount: number; // Contador de faltas/advertencias

  inventoryTitles: mongoose.Types.ObjectId[]; 
  displayTitles: mongoose.Types.ObjectId[];   

  level: number;
  experience: number;
  lastCheckIn?: Date;
  checkInStreak: number;

  createdAt: Date;
  updatedAt: Date;
}

const CommunityMemberSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    nickname: { 
      type: String, 
      required: [true, 'El apodo en la comunidad es obligatorio'], 
      trim: true 
    },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 300, default: '' },
    role: { 
      type: String, 
      enum: ['system', 'owner', 'admin', 'moderator', 'member'], 
      default: 'member' 
    },
    roleplayData: { 
      type: Schema.Types.Mixed, 
      default: {}
    },
    // MODERACIÓN
    isHidden: { type: Boolean, default: false }, 
    hiddenUntil: { type: Date },
    status: {
      type: String,
      enum: ['active', 'banned', 'left'],
      default: 'active'
    },
    strikeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // GAMIFICACIÓN
    level: { 
      type: Number, 
      default: 1, 
      min: 1, 
      max: config.gamification.maxLevel 
    },
    experience: { type: Number, default: 0, min: 0 },
    lastCheckIn: { type: Date },
    checkInStreak: { type: Number, default: 0 },
    
    inventoryTitles: [{ type: Schema.Types.ObjectId, ref: 'CommunityTitle' }],
    displayTitles: [{ type: Schema.Types.ObjectId, ref: 'CommunityTitle' }],
  },
  { timestamps: true }
);

CommunityMemberSchema.index({ userId: 1, communityId: 1 }, { unique: true });
// Nuevo índice para buscar baneados o activos rápidamente
CommunityMemberSchema.index({ communityId: 1, status: 1 }); 

export const CommunityMemberModel = mongoose.model<ICommunityMember>('CommunityMember', CommunityMemberSchema);