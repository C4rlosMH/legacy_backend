import { ChatModel } from './chat.model';
import { MessageModel } from './messege.model';
import { addMemberXPService } from '../community-members/community-member.service';

// 1. Obtener o crear una sala de chat directo global
export const getOrCreateGlobalDirectChatService = async (user1Id: string, user2Id: string) => {
  if (user1Id === user2Id) {
    throw new Error('No puedes crear un chat contigo mismo');
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