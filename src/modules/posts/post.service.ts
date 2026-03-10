import { PostModel } from './post.model';
import { CommunityModel } from '../communities/community.model';
import { CommunityMemberModel } from '../community-members/community-member.model';
import { addMemberXPService } from '../community-members/community-member.service';

interface CreatePostDTO {
  authorId: string;
  context: 'community' | 'global_thread';
  content: string;
  communityId?: string;
  title?: string;
  mediaUrls?: string[];
}

export const createPostService = async (data: CreatePostDTO) => {
  let authorMemberId;

  if (data.context === 'community') {
    if (!data.communityId) throw new Error('Debes proporcionar el ID de la comunidad');
    
    const memberProfile = await CommunityMemberModel.findOne({
      userId: data.authorId,
      communityId: data.communityId
    });

    if (!memberProfile) {
      throw new Error('No puedes publicar aquí porque no eres miembro de esta comunidad');
    }

    authorMemberId = memberProfile._id;
  }

  const postData = {
    ...data,
    ...(authorMemberId && { authorMemberId })
  };

  const newPost = await PostModel.create(postData);

  // LOGICA DE GAMIFICACIÓN: Otorgar XP por publicar
  if (data.context === 'community' && data.communityId) {
    // Otorgamos 5 XP por post (puedes mover este '5' también al config si gustas)
    await addMemberXPService(data.authorId, data.communityId, 5);
  }

  return newPost;
};

export const getCommunityFeedService = async (communityId: string) => {
  const posts = await PostModel.find({ context: 'community', communityId })
    .sort({ createdAt: -1 })
    .limit(20)
    // AHORA POBLAMOS EL PERFIL DE LA COMUNIDAD, NO EL GLOBAL
    .populate('authorMemberId', 'nickname role roleplayData'); 
    
  return posts;
};

export const getGlobalFeedService = async () => {
  // Buscamos solo los posts que tengan el contexto de hilo global
  const posts = await PostModel.find({ context: 'global_thread' })
    .sort({ createdAt: -1 }) // Del más nuevo al más viejo
    .limit(30) // Traemos 30 para tener un buen scroll inicial
    .populate('authorId', 'name username avatar'); // Poblamos la identidad global
    
  return posts;
};

export const moderatePostService = async (
  postId: string, 
  communityId: string, 
  action: 'hide' | 'unhide' | 'pin' | 'unpin' | 'delete'
) => {
  // Verificamos que el post exista y pertenezca a este universo
  const post = await PostModel.findOne({ _id: postId, communityId });
  if (!post) throw new Error('El post no existe en esta comunidad');

  switch (action) {
    case 'hide':
      post.isHidden = true;
      break;
    case 'unhide':
      post.isHidden = false;
      break;
    case 'pin':
      post.isPinned = true;
      break;
    case 'unpin':
      post.isPinned = false;
      break;
    case 'delete':
      await PostModel.findByIdAndDelete(postId);
      return { message: 'Post eliminado permanentemente' };
  }

  await post.save();
  return post;
};

interface UpdatePostDTO {
  title?: string;
  content?: string;
  linkUrl?: string;
  mediaUrls?: string[];
}

export const updatePostService = async (postId: string, userId: string, data: UpdatePostDTO) => {
  const post = await PostModel.findById(postId);
  
  if (!post) {
    throw new Error('El post no existe');
  }

  // Verificamos que el usuario sea el autor original
  if (post.authorId.toString() !== userId) {
    throw new Error('No tienes permiso para editar este post');
  }

  // Actualizamos solo los campos permitidos y que vengan en la petición
  if (data.title !== undefined) post.title = data.title;
  if (data.content !== undefined) post.content = data.content;
  if (data.linkUrl !== undefined) post.linkUrl = data.linkUrl;
  if (data.mediaUrls !== undefined) post.mediaUrls = data.mediaUrls;

  await post.save();
  return post;
};

export const deletePostService = async (postId: string, userId: string) => {
  const post = await PostModel.findById(postId);
  
  if (!post) {
    throw new Error('El post no existe');
  }

  if (post.authorId.toString() !== userId) {
    throw new Error('No tienes permiso para eliminar este post');
  }

  await post.deleteOne();
  return { message: 'Publicación eliminada exitosamente' };
};