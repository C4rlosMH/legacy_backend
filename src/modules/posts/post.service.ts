import { PostModel } from './post.model';
import { CommunityModel } from '../communities/community.model';
import { CommunityMemberModel } from '../community-members/community-member.model';

interface CreatePostDTO {
  authorId: string;
  context: 'community' | 'global_thread';
  content: string;
  communityId?: string;
  title?: string;
  mediaUrls?: string[];
}

export const createPostService = async (data: CreatePostDTO) => {
  let authorMemberId; // La dejamos sin inicializar explícitamente con undefined

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

  // Solución: Solo agregamos authorMemberId al objeto si realmente tiene un valor.
  // Si no tiene valor, la propiedad simplemente no existirá en postData, respetando tu tsconfig.
  const postData = {
    ...data,
    ...(authorMemberId && { authorMemberId })
  };

  const newPost = await PostModel.create(postData);

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