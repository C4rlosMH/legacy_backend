import { Request, Response } from 'express';
import { createCommentService, deleteCommentService } from './comment.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, authorId, content, communityId, mediaUrl } = req.body;

    if (targetType !== 'post' && targetType !== 'user_wall' && targetType !== 'wiki') {
      res.status(400).json({ message: 'El tipo de objetivo no es válido' });
      return;
    }

    if (targetType !== 'post' && targetType !== 'user_wall') {
      res.status(400).json({ message: 'El tipo de objetivo no es válido' });
      return;
    }

    const newComment = await createCommentService({
      targetType,
      targetId,
      authorId,
      content,
      communityId,
      mediaUrl
    });

    res.status(201).json({
      message: 'Comentario publicado exitosamente',
      comment: newComment
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al publicar el comentario' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const commentId = req.params.commentId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await deleteCommentService(commentId, userId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al eliminar el comentario' });
  }
};