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
}

export const createCommunityService = async (data: CreateCommunityDTO) => {
  // 1. Validar que el nombre no exista (los nombres de universos suelen ser únicos)
  const existingCommunity = await CommunityModel.findOne({ name: data.name });
  if (existingCommunity) {
    throw new Error('Ya existe una comunidad con este nombre');
  }

  // 2. Crear la comunidad
  const newCommunity = await CommunityModel.create({
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
  });

  // 3. Crear automáticamente el perfil del Líder Agente (Owner) dentro de este universo
  await CommunityMemberModel.create({
    userId: data.ownerId,
    communityId: newCommunity._id,
    nickname: data.ownerNickname,
    role: 'owner',
    roleplayData: {} // Inicializamos vacío
  });

  return newCommunity;
};

export const getCommunityDetailsService = async (communityId: string) => {
  const community = await CommunityModel.findById(communityId);
  if (!community) throw new Error('La comunidad no existe');
  return community;
};

export const searchCommunitiesService = async (searchQuery: string) => {
  // Creamos una expresión regular que ignore mayúsculas y minúsculas ('i')
  const regex = new RegExp(searchQuery, 'i');

  // Buscamos comunidades donde el nombre o la descripción coincidan con el texto
  const communities = await CommunityModel.find({
    $or: [
      { name: regex },
      { description: regex }
    ]
  })
  .select('name description avatar banner createdAt') // Traemos solo lo necesario para la tarjeta de búsqueda
  .limit(20); // Limitamos a 20 resultados para no saturar la red

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
    { $set: data }, // Actualizamos solo los campos que se envíen
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

  // Verificamos de forma estricta que quien intenta borrarla sea el creador original
  if (community.ownerId.toString() !== userId) {
    throw new Error('Solo el creador absoluto de la comunidad puede eliminarla');
  }

  // 1. Encontramos todos los chats de esta comunidad para poder borrar sus mensajes internos
  const communityChats = await ChatModel.find({ communityId });
  const chatIds = communityChats.map(chat => chat._id);

  // 2. BORRADO EN CASCADA PARALELO
  await Promise.all([
    CommunityMemberModel.deleteMany({ communityId }),
    PostModel.deleteMany({ communityId }),
    WikiModel.deleteMany({ communityId }),
    WikiCategoryModel.deleteMany({ communityId }),
    MessageModel.deleteMany({ chatId: { $in: chatIds } }), // Borramos los mensajes de esos chats
    ChatModel.deleteMany({ communityId }),
    CommentModel.deleteMany({ communityId }),
    NotificationModel.deleteMany({ communityId }),
    
    // Finalmente borramos el registro de la comunidad
    community.deleteOne() 
  ]);

  return { message: 'El universo y todos sus datos internos han sido eliminados permanentemente' };
};