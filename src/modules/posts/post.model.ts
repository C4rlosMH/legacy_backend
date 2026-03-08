import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  context: 'community' | 'global_thread';
  authorId: mongoose.Types.ObjectId; // Conservamos el autor global por seguridad interna
  
  // Referencias para la comunidad
  communityId?: mongoose.Types.ObjectId; 
  authorMemberId?: mongoose.Types.ObjectId; // NUEVO: El perfil que usa en esta comunidad
  
  title?: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    context: { type: String, enum: ['community', 'global_thread'], required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
    authorMemberId: { type: Schema.Types.ObjectId, ref: 'CommunityMember' }, // Añadido
    
    title: { type: String, trim: true, maxlength: 100 },
    content: { type: String, required: true },
    mediaUrls: { type: [String], default: [] },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

PostSchema.pre('save', function (this: IPost) {
  if (this.context === 'community') {
    if (!this.communityId || !this.authorMemberId) {
      throw new Error('Un post de comunidad requiere el communityId y el authorMemberId');
    }
  }
});

PostSchema.index({ communityId: 1, createdAt: -1 });
PostSchema.index({ context: 1, createdAt: -1 });

export const PostModel = mongoose.model<IPost>('Post', PostSchema);