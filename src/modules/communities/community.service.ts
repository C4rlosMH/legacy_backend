import { CommunityModel } from './community.model';
import { CommunityMemberModel } from '../community-members/community-member.model';
import { PostModel } from '../posts/post.model';
import { WikiModel } from '../wikis/wiki.model';
import { WikiCategoryModel } from '../wikis/wiki-category.model';
import { ChatModel } from '../chats/chat.model';
import { MessageModel } from '../chats/messege.model';
import { CommentModel } from '../comments/comment.model';
import { NotificationModel } from '../notifications/notification.model';

interface CreateCommunityDTO {
  name: string;
  description: string;
  ownerId: string;
  ownerNickname: string;
  visibility?: 'public' | 'unlisted' | 'private';
}

export const createCommunityService = async (data: CreateCommunityDTO) => {
  const existingCommunity = await CommunityModel.findOne({ name: data.name });
  if (existingCommunity) {
    throw new Error('Ya existe una comunidad con este nombre');
  }

  // Crear la comunidad inyectando la visibilidad (si no la mandan, por defecto será 'public')
  const newCommunity = await CommunityModel.create({
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    visibility: data.visibility || 'public',
    listingStatus: 'none' // Siempre nacen sin estar listadas
  });

  await CommunityMemberModel.create({
    userId: data.ownerId,
    communityId: newCommunity._id,
    nickname: data.ownerNickname,
    role: 'owner',
    roleplayData: {} 
  });

  return newCommunity;
};

export const getCommunityDetailsService = async (communityId: string) => {
  const community = await CommunityModel.findById(communityId);
  if (!community) throw new Error('La comunidad no existe');
  return community;
};

export const searchCommunitiesService = async (searchQuery: string) => {
  const regex = new RegExp(searchQuery, 'i');

  const communities = await CommunityModel.find({
    $or: [
      { name: regex },
      { description: regex }
    ],
    // REGLAS DEL BUSCADOR: Solo mostrar comunidades públicas y aprobadas por el Team Legacy
    visibility: 'public',
    listingStatus: 'approved'
  })
  .select('name description visibility listingStatus avatar banner createdAt') 
  .limit(20); 

  return communities;
};

interface UpdateCommunityDTO {
  name?: string;
  description?: string;
  avatar?: string;
  banner?: string;
}

export const updateCommunitySettingsService = async (communityId: string, data: UpdateCommunityDTO) => {
  const updatedCommunity = await CommunityModel.findByIdAndUpdate(
    communityId,
    { $set: data }, 
    { new: true, runValidators: true }
  );

  if (!updatedCommunity) {
    throw new Error('La comunidad no existe');
  }

  return updatedCommunity;
};

export const deleteCommunityService = async (communityId: string, userId: string) => {
  const community = await CommunityModel.findById(communityId);
  
  if (!community) {
    throw new Error('La comunidad no existe');
  }

  if (community.ownerId.toString() !== userId) {
    throw new Error('Solo el creador absoluto de la comunidad puede eliminarla');
  }

  // REGLA DE INMORTALIDAD
  if (community.listingStatus === 'approved') {
    throw new Error('Esta comunidad ha sido listada oficialmente y no puede ser eliminada. Si deseas retirarte, debes transferir el rol de Agente a otro miembro del staff.');
  }

  const communityChats = await ChatModel.find({ communityId });
  const chatIds = communityChats.map(chat => chat._id);

  // BORRADO EN CASCADA PARALELO
  await Promise.all([
    CommunityMemberModel.deleteMany({ communityId }),
    PostModel.deleteMany({ communityId }),
    WikiModel.deleteMany({ communityId }),
    WikiCategoryModel.deleteMany({ communityId }),
    MessageModel.deleteMany({ chatId: { $in: chatIds } }), 
    ChatModel.deleteMany({ communityId }),
    CommentModel.deleteMany({ communityId }),
    NotificationModel.deleteMany({ communityId }),
    
    community.deleteOne() 
  ]);

  return { message: 'El universo y todos sus datos internos han sido eliminados permanentemente' };
};