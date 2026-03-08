import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityMember extends Document {
  userId: mongoose.Types.ObjectId;
  communityId: mongoose.Types.ObjectId;
  nickname: string;
  role: 'owner' | 'admin' | 'moderator' | 'member'; // Roles actualizados
  roleplayData?: Record<string, any>;
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
    role: { 
      type: String, 
      enum: ['owner', 'admin', 'moderator', 'member'], 
      default: 'member' 
    },
    roleplayData: { 
      type: Schema.Types.Mixed, 
      default: {}
    }
  },
  { timestamps: true }
);

CommunityMemberSchema.index({ userId: 1, communityId: 1 }, { unique: true });

export const CommunityMemberModel = mongoose.model<ICommunityMember>('CommunityMember', CommunityMemberSchema);