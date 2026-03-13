import { LikeModel, ReactionType } from './like.model';
import { PostModel } from '../posts/post.model';
import { WikiModel } from '../wikis/wiki.model';
import { CommentModel } from '../comments/comment.model';

export const toggleLikeService = async (
  userId: string, 
  targetType: 'post' | 'wiki' | 'comment', 
  targetId: string,
  reactionType: ReactionType
) => {
  // 1. Buscamos si el usuario ya tiene una reacción en esta publicación
  const existingLike = await LikeModel.findOne({ targetType, targetId, userId });

  if (existingLike) {
    // CASO A: El usuario tocó la MISMA reacción que ya tenía. Se elimina (Toggle Off).
    if (existingLike.type === reactionType) {
      await existingLike.deleteOne();
      await updateLikeCount(targetType, targetId, -1);
      return { active: false, reaction: null, message: 'Reacción removida' };
    } 
    // CASO B: El usuario tocó una reacción DIFERENTE (Ej. cambió de like a love)
    else {
      existingLike.type = reactionType;
      await existingLike.save();
      // No sumamos ni restamos el contador total, porque la cantidad de reacciones sigue siendo la misma.
      return { active: true, reaction: reactionType, message: 'Reacción actualizada' };
    }
  } else {
    // CASO C: El usuario no tenía ninguna reacción previa. Se crea una nueva.
    await LikeModel.create({ targetType, targetId, userId, type: reactionType });
    await updateLikeCount(targetType, targetId, 1);
    return { active: true, reaction: reactionType, message: 'Reacción agregada' };
  }
};

// Mantenemos el nombre updateLikeCount por compatibilidad, pero ahora suma "reacciones totales"
const updateLikeCount = async (targetType: string, targetId: string, amount: number) => {
  if (targetType === 'post') {
    await PostModel.findByIdAndUpdate(targetId, { $inc: { likesCount: amount } });
  } else if (targetType === 'wiki') {
    await WikiModel.findByIdAndUpdate(targetId, { $inc: { likesCount: amount } });
  } else if (targetType === 'comment') {
    await CommentModel.findByIdAndUpdate(targetId, { $inc: { likesCount: amount } });
  }
};