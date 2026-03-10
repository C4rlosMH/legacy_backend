import { Request, Response } from 'express';
import { createPostService, getCommunityFeedService, getGlobalFeedService,
  moderatePostService, updatePostService, deletePostService, resolveQuestionService, getAdsService,
  getFeedService,
 } from './post.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Extraemos el autor de forma SEGURA desde el token de sesión
    const authorId = req.user?.id;
    
    if (!authorId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    // 2. Extraemos el resto de datos del body, incluyendo los nuevos tipos
    const { context, postType, content, communityId, title, mediaUrls, linkUrl, tags } = req.body;

    // Validaciones básicas
    if (!context || !content) {
      res.status(400).json({ message: 'El contexto y contenido son obligatorios' });
      return;
    }

    if (context !== 'community' && context !== 'global_thread') {
      res.status(400).json({ message: 'El contexto proporcionado no es válido' });
      return;
    }

    // 3. Creamos el post y lo guardamos en la variable newPost
    const newPost = await createPostService({
      authorId,
      context,
      postType: postType || 'thread', // Por defecto es 'thread' si no envían nada
      content,
      communityId,
      title,
      mediaUrls,
      linkUrl,
      tags
    });

    res.status(201).json({
      message: 'Publicación creada exitosamente',
      post: newPost // Asignamos newPost a la propiedad post para la respuesta JSON
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

export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const postId = req.params.postId as string;
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const updatedPost = await updatePostService(postId, userId, updateData);
    
    res.status(200).json({ 
      message: 'Publicación actualizada', 
      post: updatedPost 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al actualizar la publicación' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const postId = req.params.postId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await deletePostService(postId, userId);
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al eliminar la publicación' });
  }
};

export const resolveQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // CORRECCIÓN: Le indicamos explícitamente al compilador que los parámetros son strings
    const postId = req.params.postId as string;
    const commentId = req.params.commentId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!postId || !commentId) {
      res.status(400).json({ message: 'Faltan parámetros en la URL' });
      return;
    }

    const updatedPost = await resolveQuestionService(postId, userId, commentId);

    res.status(200).json({ 
      message: 'Pregunta marcada como resuelta exitosamente', 
      post: updatedPost 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al resolver la pregunta' });
  }
};

export const getAds = async (req: Request, res: Response): Promise<void> => {
  try {
    const context = req.query.context as string;
    const communityId = req.query.communityId as string | undefined;
    const tagsQuery = req.query.tags as string | undefined;

    if (!context || (context !== 'community' && context !== 'global_thread')) {
      res.status(400).json({ message: 'El contexto debe ser "community" o "global_thread"' });
      return;
    }

    // Convertimos el string de etiquetas ("rol,fantasia") en un array real de strings
    let parsedTags: string[] = [];
    if (tagsQuery) {
      parsedTags = tagsQuery.split(',').map(tag => tag.trim());
    }

    const ads = await getAdsService(
      context as 'community' | 'global_thread',
      communityId,
      parsedTags
    );

    res.status(200).json({ 
      message: 'Anuncios recuperados exitosamente',
      ads 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al buscar anuncios' });
  }
};

export const getFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { context, communityId, postType, page, limit } = req.query;

    if (!context || (context !== 'community' && context !== 'global_thread')) {
      res.status(400).json({ message: 'El contexto debe ser "community" o "global_thread"' });
      return;
    }

    const feed = await getFeedService(
      context as 'community' | 'global_thread',
      communityId as string | undefined,
      postType as string | undefined,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20
    );

    res.status(200).json({
      message: 'Feed recuperado exitosamente',
      data: feed
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener el feed' });
  }
};