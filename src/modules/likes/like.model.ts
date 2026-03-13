import mongoose, { Schema, Document } from 'mongoose';

// Definimos los tipos de reacciones permitidas
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface ILike extends Document {
  targetType: 'post' | 'wiki' | 'comment';
  targetId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: ReactionType; // <-- NUEVO CAMPO
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
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      default: 'like', // Por compatibilidad, si no envían nada, será un like normal
      required: true
    }
  },
  { timestamps: true }
);

// Índice compuesto para evitar reacciones duplicadas (Un usuario solo puede tener 1 reacción activa por objetivo)
LikeSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });

export const LikeModel = mongoose.model<ILike>('Like', LikeSchema);