import { Request, Response } from 'express';
import { createCommentService } from './comment.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, authorId, content, communityId, mediaUrl } = req.body;

    if (!targetType || !targetId || !authorId || !content) {
      res.status(400).json({ message: 'Faltan campos obligatorios para crear el comentario' });
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