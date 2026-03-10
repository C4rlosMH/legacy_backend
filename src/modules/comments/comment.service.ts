import { CommentModel } from './comment.model';
import { PostModel } from '../posts/post.model';
import { UserModel } from '../users/user.model';
import { CommunityMemberModel } from '../community-members/community-member.model';
import { WikiModel } from '../wikis/wiki.model';

interface CreateCommentDTO {
  targetType: 'post' | 'user_wall' | 'wiki';
  targetId: string;
  authorId: string;
  content: string;
  communityId?: string;
  mediaUrl?: string;
}

export const createCommentService = async (data: CreateCommentDTO) => {
  let authorMemberId;

  // 1. Validaciones según el objetivo (Post, Muro o Wiki)
  if (data.targetType === 'post') {
    const postExists = await PostModel.findById(data.targetId);
    if (!postExists) throw new Error('La publicación que intentas comentar no existe');
    
    if (postExists.communityId) {
      if (String(postExists.communityId) !== data.communityId) {
        throw new Error('El ID de la comunidad no coincide con el del post');
      }
    }
  } else if (data.targetType === 'user_wall') {
    const userExists = await UserModel.findById(data.targetId);
    if (!userExists) throw new Error('El usuario al que intentas escribir no existe');
  } else if (data.targetType === 'wiki') {
    // <-- NUEVA LÓGICA PARA WIKIS
    const wikiExists = await WikiModel.findById(data.targetId);
    if (!wikiExists) throw new Error('La Wiki que intentas comentar no existe');
    
    if (wikiExists.communityId) {
      if (String(wikiExists.communityId) !== data.communityId) {
        throw new Error('El ID de la comunidad no coincide con el de la Wiki');
      }
    }
  }

  // 2. Si el comentario ocurre dentro de un universo, verificamos al miembro
  if (data.communityId) {
    const memberProfile = await CommunityMemberModel.findOne({
      userId: data.authorId,
      communityId: data.communityId
    });

    if (!memberProfile) {
      throw new Error('No puedes comentar aquí porque no eres miembro de esta comunidad');
    }
    authorMemberId = memberProfile._id;
  }

  // 3. Construir objeto seguro
  const commentData = {
    targetType: data.targetType,
    targetId: data.targetId,
    authorId: data.authorId,
    content: data.content,
    ...(data.communityId && { communityId: data.communityId }),
    ...(authorMemberId && { authorMemberId }),
    ...(data.mediaUrl && { mediaUrl: data.mediaUrl })
  };

  const newComment = await CommentModel.create(commentData);

  // 4. Actualizar el contador correspondiente
  if (data.targetType === 'post') {
    await PostModel.findByIdAndUpdate(data.targetId, { $inc: { commentsCount: 1 } });
  } else if (data.targetType === 'wiki') {
    // <-- NUEVO INCREMENTO PARA WIKIS
    await WikiModel.findByIdAndUpdate(data.targetId, { $inc: { commentsCount: 1 } });
  }

  return newComment;
};

// NUEVA FUNCIÓN: Obtener comentarios paginados
export const getCommentsService = async (targetType: string, targetId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const comments = await CommentModel.find({ targetType, targetId })
    .populate('authorId', 'name username avatar') // Perfil global
    .populate('authorMemberId', 'nickname role avatar') // Perfil local (si existe)
    .sort({ createdAt: -1 }) // Del más nuevo al más viejo
    .skip(skip)
    .limit(limit)
    .lean();

  // Si el usuario fue expulsado de la comunidad, su authorMemberId será null tras el populate.
  // Podrías mapearlo aquí si necesitas enviar un mensaje por defecto al frontend.
  const processedComments = comments.map(comment => {
    if (comment.communityId && !comment.authorMemberId) {
      comment.authorMemberId = { nickname: 'Usuario Desconocido', role: 'member', avatar: '' } as any;
    }
    return comment;
  });

  const total = await CommentModel.countDocuments({ targetType, targetId });

  return {
    comments: processedComments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// FUNCIÓN ACTUALIZADA: Eliminar con permisos avanzados
export const deleteCommentService = async (commentId: string, userId: string) => {
  const comment = await CommentModel.findById(commentId);

  if (!comment) {
    throw new Error('El comentario no existe');
  }

  let hasPermission = false;

  // 1. El autor del comentario siempre puede borrarlo
  if (comment.authorId.toString() === userId) {
    hasPermission = true;
  } 
  // 2. Si el comentario está en una comunidad, verificamos si el usuario es staff
  else if (comment.communityId) {
    const membership = await CommunityMemberModel.findOne({ userId, communityId: comment.communityId });
    if (membership && ['owner', 'admin', 'moderator'].includes(membership.role)) {
      hasPermission = true;
    }
  } 
  // 3. Si es un comentario en un muro personal, el dueño de la cuenta puede borrarlo
  else if (comment.targetType === 'user_wall' && comment.targetId.toString() === userId) {
    hasPermission = true;
  }

  if (!hasPermission) {
    throw new Error('No tienes permiso para eliminar este comentario');
  }

  // Descontamos 1 del contador respectivo antes de borrar
  if (comment.targetType === 'post') {
    await PostModel.findByIdAndUpdate(comment.targetId, { $inc: { commentsCount: -1 } });
  } else if (comment.targetType === 'wiki') {
    await WikiModel.findByIdAndUpdate(comment.targetId, { $inc: { commentsCount: -1 } });
  }

  await comment.deleteOne();

  return { message: 'Comentario eliminado exitosamente' };
};

