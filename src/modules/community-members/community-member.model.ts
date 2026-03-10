import mongoose, { Schema, Document } from 'mongoose';
import { config } from '../../config';

export interface ICommunityMember extends Document {
  userId: mongoose.Types.ObjectId;
  communityId: mongoose.Types.ObjectId;
  nickname: string;
  avatar?: string; // Agregado para el perfil local
  bio?: string;    // Agregado para el perfil local
  role: 'owner' | 'admin' | 'moderator' | 'member';
  roleplayData?: Record<string, any>;
  isHidden: boolean; // Bandera de moderación

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
      enum: ['owner', 'admin', 'moderator', 'member'], 
      default: 'member' 
    },
    roleplayData: { 
      type: Schema.Types.Mixed, 
      default: {}
    },
    isHidden: { type: Boolean, default: false }, // Bandera para que los curadores oculten perfiles
    level: { 
      type: Number, 
      default: 1, 
      min: 1, 
      max: config.gamification.maxLevel // <--- AHORA ES DINÁMICO
    },
    experience: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    lastCheckIn: { type: Date },
    checkInStreak: { 
      type: Number, 
      default: 0 
    },
  },
  { timestamps: true }
);

CommunityMemberSchema.index({ userId: 1, communityId: 1 }, { unique: true });

export const CommunityMemberModel = mongoose.model<ICommunityMember>('CommunityMember', CommunityMemberSchema);