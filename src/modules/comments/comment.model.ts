import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  targetType: 'post' | 'user_wall'; // Define si es respuesta a un post o un mensaje de muro
  targetId: mongoose.Types.ObjectId; // El ID del Post o el ID del User receptor
  
  authorId: mongoose.Types.ObjectId; // El usuario global que lo escribió
  authorMemberId?: mongoose.Types.ObjectId; // El perfil de la comunidad (si aplica)
  communityId?: mongoose.Types.ObjectId; // Para aislarlo en su universo (si aplica)
  
  content: string;
  mediaUrl?: string; // Opcional, por si permiten enviar imágenes/stickers en comentarios
  likesCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    targetType: {
      type: String,
      enum: ['post', 'user_wall'],
      required: true
    },
    targetId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      // No podemos usar 'ref' directo porque el targetId puede ser de la colección Post o User.
      // Lo manejaremos dinámicamente en el servicio o al hacer populate.
    },
    
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorMemberId: { type: Schema.Types.ObjectId, ref: 'CommunityMember' },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
    
    content: { 
      type: String, 
      required: [true, 'El contenido del comentario es obligatorio'],
      maxlength: [500, 'El comentario es demasiado largo']
    },
    mediaUrl: { type: String },
    likesCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// ==========================================
// Validaciones Condicionales
// ==========================================
CommentSchema.pre('save', function (this: IComment) {
  // Si el comentario pertenece a un universo, exigimos los datos de aislamiento
  if (this.communityId && !this.authorMemberId) {
    throw new Error('Un comentario dentro de una comunidad requiere el authorMemberId');
  }
});

// ==========================================
// Índices Optimizados
// ==========================================
// 1. Para cargar rápido todos los comentarios de un post o muro específico
CommentSchema.index({ targetType: 1, targetId: 1, createdAt: 1 });

export const CommentModel = mongoose.model<IComment>('Comment', CommentSchema);