import { LikeModel } from './like.model';
import { PostModel } from '../posts/post.model';
import { WikiModel } from '../wikis/wiki.model';
import { CommentModel } from '../comments/comment.model';

export const toggleLikeService = async (userId: string, targetType: 'post' | 'wiki' | 'comment', targetId: string) => {
  // 1. Verificamos si el like ya existe
  const existingLike = await LikeModel.findOne({ targetType, targetId, userId });

  if (existingLike) {
    // Si existe, lo eliminamos (Quitar Like)
    await existingLike.deleteOne();
    await updateLikeCount(targetType, targetId, -1);
    return { liked: false, message: 'Like removido' };
  } else {
    // Si no existe, lo creamos (Dar Like)
    await LikeModel.create({ targetType, targetId, userId });
    await updateLikeCount(targetType, targetId, 1);
    return { liked: true, message: 'Like agregado' };
  }
};

// Función auxiliar para actualizar los contadores
const updateLikeCount = async (targetType: string, targetId: string, amount: number) => {
  if (targetType === 'post') {
    await PostModel.findByIdAndUpdate(targetId, { $inc: { likesCount: amount } });
  } else if (targetType === 'wiki') {
    await WikiModel.findByIdAndUpdate(targetId, { $inc: { likesCount: amount } });
  } else if (targetType === 'comment') {
    await CommentModel.findByIdAndUpdate(targetId, { $inc: { likesCount: amount } });
  }
};