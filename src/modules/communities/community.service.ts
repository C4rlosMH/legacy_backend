import { CommunityModel } from './community.model';
import { CommunityMemberModel } from '../community-members/community-member.model';
import { PostModel } from '../posts/post.model';
import { WikiModel } from '../wikis/wiki.model';
import { WikiCategoryModel } from '../wikis/wiki-category.model';
import { ChatModel } from '../chats/chat.model';
import { MessageModel } from '../chats/messege.model';
import { CommentModel } from '../comments/comment.model';
import { NotificationModel } from '../notifications/notification.model';
import { UserModel } from '../users/user.model';
import { TransactionModel } from '../economy/transaction.model';
import { config } from '../../config';

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

  // Obtenemos el costo desde el archivo de configuración global
  const creationCost = config.economy.worldCreationCost;

  // 1. VERIFICAR FONDOS DEL CREADOR
  const user = await UserModel.findById(data.ownerId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (user.legacyCoins < creationCost) {
    throw new Error(`Fondos insuficientes. La licencia para crear un mundo cuesta ${creationCost} Legacy Coins y tu saldo actual es de ${user.legacyCoins}.`);
  }

  // 2. COBRAR LA LICENCIA
  user.legacyCoins -= creationCost;
  await user.save();

  // 3. CREAR LA COMUNIDAD
  const newCommunity = await CommunityModel.create({
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    visibility: data.visibility || 'public',
    listingStatus: 'none',
    treasuryBalance: 0 
  });

  // 4. REGISTRAR LA TRANSACCIÓN EN EL LIBRO MAYOR
  await TransactionModel.create({
    type: 'world_creation',
    senderId: user._id,
    amount: creationCost,
    taxBurned: creationCost, 
    netAmount: 0,
    description: `Pago de licencia por la creación del mundo: ${newCommunity.name}`
  });

  // 5. CREAR PERFIL DEL AGENTE
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

  if (community.listingStatus === 'approved') {
    throw new Error('Esta comunidad ha sido listada oficialmente y no puede ser eliminada. Si deseas retirarte, debes transferir el rol de Agente a otro miembro del staff.');
  }

  const communityChats = await ChatModel.find({ communityId });
  const chatIds = communityChats.map(chat => chat._id);

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

export const requestCommunityListingService = async (communityId: string, userId: string) => {
  const community = await CommunityModel.findById(communityId);
  if (!community) throw new Error('El universo no existe.');

  if (community.ownerId.toString() !== userId) {
    throw new Error('Solo el Agente creador puede solicitar el listado del universo.');
  }

  if (community.visibility === 'private') {
    throw new Error('Los universos privados no pueden aparecer en el Directorio Global. Cambia la visibilidad a pública primero.');
  }

  if (community.listingStatus === 'pending') {
    throw new Error('Este universo ya está en revisión por el Team Legacy.');
  }
  if (community.listingStatus === 'approved') {
    throw new Error('Este universo ya se encuentra listado en el Directorio Global.');
  }

  // Extraemos las reglas dinámicas
  const { 
    minDaysToList,
    minMembersToList,
    minActivityToList,
    minDescLength, 
    defaultThemeColor, 
    minTreasuryToList, 
    minStaffToList, 
    minWikisToList 
  } = config.communityRules;

  // 1. PRUEBA DE IDENTIDAD Y DISEÑO
  if (!community.description || community.description.trim().length < minDescLength) {
    throw new Error(`Prueba de Identidad fallida: El universo debe tener una descripción de al menos ${minDescLength} caracteres.`);
  }
  
  // SOLUCIÓN: Le damos un valor de respaldo in situ o le aseguramos que es un string
  const safeDefaultColor = (defaultThemeColor as string);
  if (community.themeColor.toLowerCase() === safeDefaultColor.toLowerCase()) { 
    throw new Error('Prueba de Diseño fallida: Debes personalizar el color del tema de tu universo antes de listarlo.');
  }

  // 2. PRUEBA ECONÓMICA Y DE ORDEN
  if (community.treasuryBalance < minTreasuryToList) {
    throw new Error(`Prueba de Inversión fallida: La tesorería debe tener un balance de al menos ${minTreasuryToList} Legacy Coins.`);
  }
  const staffCount = await CommunityMemberModel.countDocuments({
    communityId,
    role: { $in: ['admin', 'moderator'] }
  });
  if (staffCount < minStaffToList) {
     throw new Error(`Prueba de Orden fallida: Debes nombrar al menos a ${minStaffToList} miembro(s) del staff (admin o moderator) adicional.`);
  }

  // 3. PRUEBA DE MADUREZ (Antigüedad)
  const now = new Date();
  const creationDate = new Date(community.createdAt);
  const diffTime = Math.abs(now.getTime() - creationDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays < minDaysToList) {
    throw new Error(`Prueba de Madurez fallida: El universo debe tener al menos ${minDaysToList} días de antigüedad (actualmente tiene ${diffDays}).`);
  }

  // 4. PRUEBA DE POBLACIÓN (Masa Crítica)
  const memberCount = await CommunityMemberModel.countDocuments({ communityId });
  if (memberCount < minMembersToList) {
    throw new Error(`Prueba de Población fallida: Se requieren al menos ${minMembersToList} miembros fundadores para solicitar el listado.`);
  }

  // 5. PRUEBA DE ACTIVIDAD GLOBAL (Puntaje Dinámico)
  // Sumamos posts, wikis y comentarios de la comunidad. (No incluimos chats directamente para no sobrecargar la BD, con estos 3 es suficiente para medir vida real).
  const postCount = await PostModel.countDocuments({ communityId });
  const wikiCount = await WikiModel.countDocuments({ communityId });
  const commentCount = await CommentModel.countDocuments({ communityId });
  
  const totalActivityScore = postCount + wikiCount + commentCount; 

  if (totalActivityScore < minActivityToList) {
    throw new Error(`Prueba de Actividad fallida: Tu universo requiere un puntaje de actividad de ${minActivityToList} (sumando posts, wikis y comentarios). Puntaje actual: ${totalActivityScore}.`);
  }

  // 6. PRUEBA DE LA COPIA DORADA (Calidad de Lore)
  const officialWikisCount = await WikiModel.countDocuments({
    communityId,
    isOfficial: true
  });
  if (officialWikisCount < minWikisToList) {
    throw new Error(`Prueba de Calidad fallida: Tu universo debe tener al menos ${minWikisToList} Wiki Oficial (Copia Dorada) para dar contexto a los visitantes.`);
  }

  // Veredicto Final: ¡Aprobado para revisión!
  community.listingStatus = 'pending';
  await community.save();

  return { 
    message: 'Auditoría superada exitosamente. El universo ha sido enviado al Team Legacy para su revisión y aprobación final.',
    listingStatus: community.listingStatus
  };
};

export const approveCommunityListingService = async (communityId: string) => {
  const community = await CommunityModel.findById(communityId);
  if (!community) throw new Error('El universo no existe.');
  if (community.listingStatus !== 'pending') throw new Error('Este universo no está en revisión.');

  community.listingStatus = 'approved';
  await community.save();

  // Aquí en el futuro podrías disparar una notificación al Owner avisando de su éxito
  return { message: 'Universo aprobado y añadido al Directorio Global exitosamente.' };
};

export const rejectCommunityListingService = async (communityId: string, reason?: string) => {
  const community = await CommunityModel.findById(communityId);
  if (!community) throw new Error('El universo no existe.');
  if (community.listingStatus !== 'pending') throw new Error('Este universo no está en revisión.');

  community.listingStatus = 'rejected';
  await community.save();

  // El reason se puede usar para enviar una notificación o guardarlo en un registro de auditoría
  const feedback = reason || 'No cumple con los estándares de calidad requeridos por el Team Legacy.';

  return { message: 'Solicitud de listado rechazada.', feedback };
};