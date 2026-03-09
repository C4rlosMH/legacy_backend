import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
  getOrCreateGlobalDirectChatService, sendMessageService, getUserChatsService, getChatMessagesService
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