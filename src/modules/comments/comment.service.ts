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

export const deleteCommentService = async (commentId: string, userId: string) => {
  const comment = await CommentModel.findById(commentId);

  if (!comment) {
    throw new Error('El comentario no existe');
  }

  // Verificamos que quien intenta borrar el comentario sea el autor
  if (comment.authorId.toString() !== userId) {
    throw new Error('No tienes permiso para eliminar este comentario');
  }

  // Descontamos 1 del contador respectivo antes de borrar el comentario
  if (comment.targetType === 'post') {
    await PostModel.findByIdAndUpdate(comment.targetId, { $inc: { commentsCount: -1 } });
  } else if (comment.targetType === 'wiki') {
    await WikiModel.findByIdAndUpdate(comment.targetId, { $inc: { commentsCount: -1 } });
  }
  // Nota: Si en el futuro agregas un contador de comentarios al muro del usuario, lo pondrías aquí.

  // Eliminamos el documento
  await comment.deleteOne();

  return { message: 'Comentario eliminado exitosamente' };
};