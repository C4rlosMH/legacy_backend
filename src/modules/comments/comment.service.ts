import { CommentModel } from './comment.model';
import { PostModel } from '../posts/post.model';
import { UserModel } from '../users/user.model';
import { CommunityMemberModel } from '../community-members/community-member.model';

interface CreateCommentDTO {
  targetType: 'post' | 'user_wall';
  targetId: string;
  authorId: string;
  content: string;
  communityId?: string;
  mediaUrl?: string;
}

export const createCommentService = async (data: CreateCommentDTO) => {
  let authorMemberId;

  // 1. Validaciones según el objetivo (Post o Muro)
  if (data.targetType === 'post') {
    const postExists = await PostModel.findById(data.targetId);
    if (!postExists) throw new Error('La publicación que intentas comentar no existe');
    
    // Si el post pertenece a una comunidad, el comentario también debe pertenecer a ella
    if (postExists.communityId) {
      if (String(postExists.communityId) !== data.communityId) {
        throw new Error('El ID de la comunidad no coincide con el del post');
      }
    }
  } else if (data.targetType === 'user_wall') {
    const userExists = await UserModel.findById(data.targetId);
    if (!userExists) throw new Error('El usuario al que intentas escribir no existe');
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

  // 3. Construir objeto seguro para TypeScript estricto
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

  // 4. Actualizar el contador si es un post
  if (data.targetType === 'post') {
    await PostModel.findByIdAndUpdate(data.targetId, { $inc: { commentsCount: 1 } });
  }

  return newComment;
};