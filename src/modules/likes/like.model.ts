import mongoose, { Schema, Document } from 'mongoose';

export interface ILike extends Document {
  targetType: 'post' | 'wiki' | 'comment';
  targetId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LikeSchema: Schema = new Schema(
  {
    targetType: {
      type: String,
      enum: ['post', 'wiki', 'comment'],
      required: true
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// Índice compuesto para evitar likes duplicados (Un usuario solo puede dar 1 like a un mismo objetivo)
LikeSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });

export const LikeModel = mongoose.model<ILike>('Like', LikeSchema);