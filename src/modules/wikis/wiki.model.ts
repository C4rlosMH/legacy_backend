import mongoose, { Schema, Document } from 'mongoose';

export interface IWikiAttribute {
  name: string;
  value: string;
}

export interface IWiki extends Document {
  title: string;
  content: string;
  coverImage?: string;
  backgroundImage?: string; 
  
  isCharacterSheet: boolean; 
  attributes: IWikiAttribute[]; 
  
  catalogStatus: 'none' | 'pending' | 'approved' | 'rejected'; 
  
  authorId: mongoose.Types.ObjectId; 
  communityId: mongoose.Types.ObjectId; 
  authorMemberId: mongoose.Types.ObjectId; 
  categoryId?: mongoose.Types.ObjectId; // <-- NUEVO: Vinculación con la carpeta
  
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
  { _id: false } 
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
    categoryId: { type: Schema.Types.ObjectId, ref: 'WikiCategory', default: null }, // <-- NUEVO
    
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },

    isOfficial: { type: Boolean, default: false },
    originalWikiId: { type: Schema.Types.ObjectId, ref: 'Wiki' },
  },
  { timestamps: true }
);

WikiSchema.index({ communityId: 1, catalogStatus: 1 }); 
WikiSchema.index({ communityId: 1, isCharacterSheet: 1 }); 
WikiSchema.index({ communityId: 1, categoryId: 1 }); // <-- Índice extra para búsquedas por carpeta

export const WikiModel = mongoose.model<IWiki>('Wiki', WikiSchema);