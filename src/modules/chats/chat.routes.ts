import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import {
  getOrCreateGlobalDirectChat, sendMessage, getUserChats, getChatMessages, createCommunityChat, joinCommunityChat,
  leaveCommunityChat, linkCommunityChats,
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

// 5. Crear una sala de chat grupal en una comunidad
// POST /api/v1/chats/community/:communityId
router.post('/community/:communityId', verifyToken, createCommunityChat);

// 6. Unirse a una sala de chat pública
// POST /api/v1/chats/:chatId/join
router.post('/:chatId/join', verifyToken, joinCommunityChat);

// 7. Abandonar una sala de chat grupal
// DELETE /api/v1/chats/:chatId/leave
router.delete('/:chatId/leave', verifyToken, leaveCommunityChat);

// Crear un acceso directo (Portal) a otro chat
// POST /api/v1/chats/:chatId/link
// Body esperado: { "childChatId": "ID_DEL_CHAT_DESTINO" }
router.post('/:chatId/link', verifyToken, linkCommunityChats);

export default router;