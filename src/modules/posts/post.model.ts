import mongoose, { Schema, Document } from 'mongoose';

// Tipos de publicaciones rápidas en inglés
export type PostType = 'thread' | 'blog' | 'announcement' | 'question' | 'link';

export interface IPost extends Document {
  context: 'community' | 'global_thread';
  postType: PostType; 
  
  authorId: mongoose.Types.ObjectId; 
  communityId?: mongoose.Types.ObjectId; 
  authorMemberId?: mongoose.Types.ObjectId; 
  
  title?: string;
  content: string;
  linkUrl?: string; 
  mediaUrls: string[];
  
  likesCount: number;
  commentsCount: number;
  
  isHidden: boolean;
  isPinned: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    context: { type: String, enum: ['community', 'global_thread'], required: true },
    postType: { 
      type: String, 
      enum: ['thread', 'blog', 'announcement', 'question', 'link'], 
      default: 'thread' 
    },
    
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
    authorMemberId: { type: Schema.Types.ObjectId, ref: 'CommunityMember' }, 
    
    title: { type: String, trim: true, maxlength: 100 },
    content: { type: String, required: true },
    linkUrl: { type: String, trim: true }, 
    mediaUrls: { type: [String], default: [] },
    
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },

    isHidden: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false }
  },
  { timestamps: true },
);

PostSchema.pre('save', function (this: IPost) {
  if (this.context === 'community') {
    if (!this.communityId || !this.authorMemberId) {
      throw new Error('Un post de comunidad requiere el communityId y el authorMemberId');
    }
  }
  
  if (this.postType === 'link' && !this.linkUrl) {
    throw new Error('Las publicaciones de tipo enlace deben incluir una URL');
  }
});

PostSchema.index({ communityId: 1, createdAt: -1 });
PostSchema.index({ context: 1, createdAt: -1 });

export const PostModel = mongoose.model<IPost>('Post', PostSchema);