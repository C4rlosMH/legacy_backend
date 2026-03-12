import { ChatModel } from './chat.model';
import { MessageModel } from './messege.model';
import { UserModel } from '../users/user.model';
import { addMemberXPService } from '../community-members/community-member.service';
import { CommunityMemberModel } from '../community-members/community-member.model';
import { CommunityModel } from '../communities/community.model';
import { config } from '../../config';

// 1. Obtener o crear una sala de chat directo global
export const getOrCreateGlobalDirectChatService = async (user1Id: string, user2Id: string) => {
  if (user1Id === user2Id) {
    throw new Error('No puedes crear un chat contigo mismo');
  }

  const user1 = await UserModel.findById(user1Id);
  const user2 = await UserModel.findById(user2Id);

  if (!user1 || !user2) throw new Error('Usuario no encontrado');

  const user1BlockedUser2 = user1.blockedUsers && user1.blockedUsers.includes(user2Id as any);
  const user2BlockedUser1 = user2.blockedUsers && user2.blockedUsers.includes(user1Id as any);

  if (user1BlockedUser2 || user2BlockedUser1) {
    throw new Error('No se puede crear o acceder a este chat debido a restricciones de bloqueo.');
  }

  // Buscamos si ya existe un chat directo global donde AMBOS usuarios sean participantes
  // El operador $all de MongoDB es magia pura aquí: busca sin importar el orden del arreglo
  let chat = await ChatModel.findOne({
    scope: 'global',
    type: 'direct',
    participants: { $all: [user1Id, user2Id] }
  });

  // Si no existe la sala, la creamos
  if (!chat) {
    chat = await ChatModel.create({
      scope: 'global',
      type: 'direct',
      participants: [user1Id, user2Id]
    });
  }

  return chat;
};

// 2. Enviar un mensaje dentro de una sala
export const sendMessageService = async (chatId: string, senderId: string, content: string) => {
  // Primero verificamos que el chat exista
  const chat = await ChatModel.findById(chatId);
  if (!chat) {
    throw new Error('La sala de chat no existe');
  }

  // Verificamos que el usuario que intenta enviar el mensaje realmente pertenezca a la sala
  if (!chat.participants.includes(senderId as any)) {
    throw new Error('No tienes permiso para enviar mensajes en este chat');
  }

  // Creamos el mensaje en la base de datos
  const newMessage = await MessageModel.create({
    chatId,
    senderId,
    content
  });

  // Actualizamos la sala de chat para que este nuevo mensaje sea el "lastMessage"
  // Esto hará que la bandeja de entrada se actualice automáticamente
  await ChatModel.findByIdAndUpdate(chatId, {lastMessage: newMessage._id});

  // REGLA DE GAMIFICACIÓN: +2 XP si el mensaje tiene 10+ caracteres (y si están dentro de un universo)
  if (chat.scope === 'community' && chat.communityId && content.trim().length >= 10) {
    // Nota: Como no await-eamos, esto se ejecuta en segundo plano sin ralentizar el envío del mensaje
    addMemberXPService(senderId, chat.communityId.toString(), 2).catch(err => 
      console.error('Error al dar XP por mensaje:', err)
    );
  }

  return newMessage;
};

// 3. Obtener la bandeja de entrada de un usuario (Sus chats)
export const getUserChatsService = async (userId: string) => {
  // Buscamos todas las salas donde el usuario sea participante
  const chats = await ChatModel.find({
    participants: userId // Mongoose busca automáticamente dentro del arreglo
  })
    // Traemos los datos de los participantes (para pintar sus avatares y nombres)
    .populate('participants', 'name username avatar')
    // Traemos el contenido del último mensaje para la vista previa
    .populate('lastMessage')
    // Ordenamos para que los chats con actividad reciente salgan hasta arriba
    .sort({ updatedAt: -1 });

  return chats;
};

// 4. Obtener el historial de mensajes de una sala específica
export const getChatMessagesService = async (chatId: string, userId: string) => {
  // Primero, seguridad: verificamos que la sala exista y que el usuario pertenezca a ella
  // para evitar que alguien con un ID al azar pueda espiar conversaciones ajenas
  const chat = await ChatModel.findById(chatId);
  if (!chat) throw new Error('La sala de chat no existe');
  
  if (!chat.participants.includes(userId as any)) {
    throw new Error('No tienes permiso para leer estos mensajes');
  }

  // Buscamos los mensajes y los ordenamos cronológicamente (del más viejo al más nuevo)
  const messages = await MessageModel.find({ chatId })
    .sort({ createdAt: 1 }); 

  return messages;
};

// ==========================================
// CHATS DE COMUNIDAD (SPRINT 2)
// ==========================================

interface CreateGroupChatDTO {
  name: string;
  description?: string;
  type: 'public_group' | 'private_group';
  requiredTitleId?: string; // NUEVO: El ID del título que funcionará como candado
}

export const createCommunityChatService = async (communityId: string, creatorId: string, data: CreateGroupChatDTO) => {
  const community = await CommunityModel.findById(communityId);
  if (!community) throw new Error('La comunidad no existe.');

  const member = await CommunityMemberModel.findOne({ communityId, userId: creatorId });
  if (!member) throw new Error('Debes ser miembro de la comunidad para crear una sala de chat.');

  const isStaff = ['owner', 'admin', 'moderator'].includes(member.role);

  // REGLA 1: Configuración del universo (¿Solo staff puede crear chats?)
  if (community.chatCreationMode === 'staff' && !isStaff) {
    throw new Error('El Agente de este universo ha restringido la creación de chats únicamente al Staff.');
  }

  // REGLA 2: Barrera de Nivel (Si está permitido para todos)
  if (!isStaff && member.level < config.permissions.minLevelToCreateChat) {
    throw new Error(`Necesitas alcanzar el Nivel ${config.permissions.minLevelToCreateChat} para fundar una sala de chat pública.`);
  }

  const chatPayload: any = {
    scope: 'community',
    type: data.type,
    communityId,
    name: data.name,
    description: data.description || '',
    participants: [creatorId], 
    admins: [creatorId]        
  };

  if (data.requiredTitleId) {
    chatPayload.requiredTitleId = data.requiredTitleId;
  }

  const newChat = await ChatModel.create(chatPayload);

  return newChat;
};

export const joinCommunityChatService = async (chatId: string, userId: string) => {
  const chat = await ChatModel.findById(chatId);
  if (!chat) throw new Error('La sala de chat no existe.');

  if (chat.scope !== 'community') throw new Error('Esta no es una sala de comunidad.');
  if (!chat.communityId) throw new Error('Error de integridad: La sala no tiene un ID de universo.');

  const member = await CommunityMemberModel.findOne({ communityId: chat.communityId, userId });
  if (!member) throw new Error('Debes unirte a la comunidad antes de entrar a sus salas.');

  if (chat.participants.includes(userId as any)) {
    throw new Error('Ya eres participante de esta sala.');
  }

  if (chat.type === 'private_group') {
    throw new Error('Esta sala es privada. Debes ser invitado por un administrador de la sala.');
  }

  // REGLA 3: El Candado (Validación del Título Exclusivo)
  if (chat.requiredTitleId) {
    // Verificamos si el usuario tiene el ID de la llave en su inventario
    const hasTitle = member.inventoryTitles && member.inventoryTitles.some(
      id => id.toString() === chat.requiredTitleId?.toString()
    );

    // Los moderadores tienen "llave maestra" para vigilar todos los chats
    const isStaff = ['owner', 'admin', 'moderator'].includes(member.role);

    if (!hasTitle && !isStaff) {
      throw new Error('Acceso denegado. No posees el título requerido para ingresar a esta sala exclusiva.');
    }
  }

  chat.participants.push(userId as any);
  await chat.save();

  return { message: `Te has unido exitosamente a la sala: ${chat.name}` };
};

export const leaveCommunityChatService = async (chatId: string, userId: string) => {
  const chat = await ChatModel.findById(chatId);
  if (!chat) throw new Error('La sala de chat no existe.');

  if (!chat.participants.includes(userId as any)) {
    throw new Error('No eres participante de esta sala.');
  }

  // Lo removemos de la lista de participantes y de admins (si lo era)
  chat.participants = chat.participants.filter(id => id.toString() !== userId);
  if (chat.admins) {
    chat.admins = chat.admins.filter(id => id.toString() !== userId);
  }

  // Si la sala se queda vacía, la eliminamos para no dejar "salas fantasma"
  if (chat.participants.length === 0) {
    await chat.deleteOne();
    return { message: 'Has abandonado la sala. Al quedar vacía, ha sido eliminada del servidor.' };
  }

  await chat.save();
  return { message: 'Has abandonado la sala exitosamente.' };
};

// ==========================================
// PORTALES DE CHAT (ACCESOS DIRECTOS)
// ==========================================

export const linkCommunityChatsService = async (parentChatId: string, childChatId: string, userId: string) => {
  if (parentChatId === childChatId) {
    throw new Error('No puedes enlazar un chat consigo mismo.');
  }

  const parentChat = await ChatModel.findById(parentChatId);
  const childChat = await ChatModel.findById(childChatId);

  if (!parentChat || !childChat) {
    throw new Error('Uno o ambos chats no existen.');
  }

  if (String(parentChat.communityId) !== String(childChat.communityId)) {
    throw new Error('Los chats deben pertenecer a la misma comunidad para poder enlazarse.');
  }
  
  if (!parentChat.communityId) {
    throw new Error('Error de integridad: La sala principal no tiene un universo asignado.');
  }

  // Verificamos que el usuario sea administrador del chat "Padre"
  const isAdmin = parentChat.admins && parentChat.admins.some(id => id.toString() === userId);
  
  if (!isAdmin) {
    // Si no es admin directo de la sala, verificamos si es del Staff del universo
    const isStaff = await CommunityMemberModel.findOne({
      communityId: parentChat.communityId,
      userId,
      role: { $in: ['owner', 'admin', 'moderator'] }
    });

    if (!isStaff) {
      throw new Error('Solo los administradores de la sala o el Staff pueden agregar accesos directos.');
    }
  }

  // Inicializamos el arreglo si no existe
  if (!parentChat.linkedChats) parentChat.linkedChats = [];

  // Verificamos si ya está enlazado
  if (parentChat.linkedChats.some(id => id.toString() === childChatId)) {
    throw new Error('Este acceso directo ya existe en esta sala.');
  }

  // Agregamos el enlace
  parentChat.linkedChats.push(childChatId as any);
  await parentChat.save();

  return { message: `Acceso directo a '${childChat.name}' agregado en la sala '${parentChat.name}'.` };
};