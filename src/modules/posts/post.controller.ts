import { Request, Response } from 'express';
import { createPostService, getCommunityFeedService, getGlobalFeedService,
  moderatePostService,
 } from './post.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { authorId, context, content, communityId, title, mediaUrls } = req.body;

    // Validaciones básicas
    if (!authorId || !context || !content) {
      res.status(400).json({ message: 'El autor, contexto y contenido son obligatorios' });
      return;
    }

    if (context !== 'community' && context !== 'global_thread') {
      res.status(400).json({ message: 'El contexto proporcionado no es válido' });
      return;
    }

    const post = await createPostService({
      authorId,
      context,
      content,
      communityId,
      title,
      mediaUrls
    });

    res.status(201).json({
      message: 'Publicación creada exitosamente',
      post
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al crear la publicación' });
  }
};

export const getCommunityFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;

    if (!communityId || typeof communityId !== 'string') {
      res.status(400).json({ message: 'El ID de la comunidad no es válido' });
      return;
    }

    const posts = await getCommunityFeedService(communityId);

    res.status(200).json({
      message: 'Feed de la comunidad obtenido exitosamente',
      posts
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener el feed' });
  }
};

export const getGlobalFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await getGlobalFeedService();

    res.status(200).json({
      message: 'Feed global obtenido exitosamente',
      posts
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener el feed global' });
  }
};

export const moderatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const postId = req.params.postId as string;
    const { action } = req.body; // 'hide', 'unhide', 'pin', 'unpin', 'delete'

    if (!['hide', 'unhide', 'pin', 'unpin', 'delete'].includes(action)) {
      res.status(400).json({ message: 'Acción de moderación no válida' });
      return;
    }

    const result = await moderatePostService(postId, communityId, action);
    res.status(200).json({ message: `Acción '${action}' ejecutada con éxito`, data: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al moderar el post' });
  }
};