import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
  getOrCreateGlobalDirectChatService, sendMessageService, getUserChatsService, getChatMessagesService,
  createCommunityChatService, joinCommunityChatService, leaveCommunityChatService, linkCommunityChatsService,
  deleteMessageService,
} from './chat.service';

// 1. Iniciar un chat o recuperar uno existente
export const getOrCreateGlobalDirectChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const targetUserId = req.params.targetUserId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const chat = await getOrCreateGlobalDirectChatService(userId, targetUserId);
    res.status(200).json({ chat });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al procesar el chat' });
  }
};

// 2. Enviar un mensaje
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const senderId = req.user?.id;
    const chatId = req.params.chatId as string;
    const { content } = req.body;

    if (!senderId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!content) {
      res.status(400).json({ message: 'El contenido del mensaje es obligatorio' });
      return;
    }

    const message = await sendMessageService(chatId, senderId, content);
    res.status(201).json({ message: 'Mensaje enviado', data: message });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al enviar el mensaje' });
  }
};

// 3. Obtener bandeja de entrada
export const getUserChats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const chats = await getUserChatsService(userId);
    res.status(200).json({ chats });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener los chats' });
  }
};

// 4. Obtener historial de una sala
export const getChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const chatId = req.params.chatId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const messages = await getChatMessagesService(chatId, userId);
    res.status(200).json({ messages });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener los mensajes' });
  }
};

// ==========================================
// CONTROLADORES DE COMUNIDAD (SPRINT 2)
// ==========================================

export const createCommunityChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.user?.id;
    const communityId = req.params.communityId as string;
    
    // EXTRAEMOS requiredTitleId DEL BODY
    const { name, description, type, requiredTitleId } = req.body; 

    if (!creatorId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!name || !type || !['public_group', 'private_group'].includes(type)) {
      res.status(400).json({ message: 'El nombre y un tipo válido son obligatorios.' });
      return;
    }

    const chat = await createCommunityChatService(communityId, creatorId, { 
      name, description, type, requiredTitleId 
    });
    
    res.status(201).json({ message: 'Sala de chat creada exitosamente', chat });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al crear la sala de chat' });
  }
};

export const joinCommunityChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const chatId = req.params.chatId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await joinCommunityChatService(chatId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al unirse a la sala' });
  }
};

export const leaveCommunityChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const chatId = req.params.chatId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await leaveCommunityChatService(chatId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al abandonar la sala' });
  }
};

export const linkCommunityChats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const parentChatId = req.params.chatId as string;
    const { childChatId } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!childChatId) {
      res.status(400).json({ message: 'El ID del chat destino es obligatorio.' });
      return;
    }

    const result = await linkCommunityChatsService(parentChatId, childChatId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al enlazar los chats' });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const chatId = req.params.chatId as string;
    const messageId = req.params.messageId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await deleteMessageService(chatId, messageId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al eliminar el mensaje' });
  }
};