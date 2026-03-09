import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import {
  getOrCreateGlobalDirectChat, sendMessage, getUserChats, getChatMessages
} from './chat.controller';

const router = Router();

// Todas las rutas de chat requieren estar logueado, así que usamos verifyToken en todas.

// 1. Obtener la bandeja de entrada (Inbox)
// GET /api/v1/chats/my-chats
router.get('/my-chats', verifyToken, getUserChats);

// 2. Iniciar o recuperar un chat directo con otro usuario
// POST /api/v1/chats/direct/:targetUserId
router.post('/direct/:targetUserId', verifyToken, getOrCreateGlobalDirectChat);

// 3. Enviar un mensaje a una sala de chat
// POST /api/v1/chats/:chatId/messages
router.post('/:chatId/messages', verifyToken, sendMessage);

// 4. Obtener el historial de una sala de chat
// GET /api/v1/chats/:chatId/messages
router.get('/:chatId/messages', verifyToken, getChatMessages);

export default router;