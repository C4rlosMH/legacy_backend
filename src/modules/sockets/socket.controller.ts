import { Server, Socket } from 'socket.io';

export const setupSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[SOCKET] Cliente conectado con ID: ${socket.id}`);

    // ==========================================
    // 1. GESTIÓN DE SALAS (ROOMS)
    // ==========================================
    
    socket.on('join_chat', (chatId: string) => {
      socket.join(chatId);
      console.log(`[SOCKET] Cliente ${socket.id} entró a la sala: ${chatId}`);
    });

    socket.on('leave_chat', (chatId: string) => {
      socket.leave(chatId);
      console.log(`[SOCKET] Cliente ${socket.id} salió de la sala: ${chatId}`);
    });

    // ==========================================
    // 2. EXPERIENCIA DE USUARIO (UX)
    // ==========================================
    
    // El frontend emite esto cuando el usuario teclea
    socket.on('typing_start', (data: { chatId: string; username: string }) => {
      // broadcast.to() lo envía a todos en la sala EXCEPTO al remitente
      socket.broadcast.to(data.chatId).emit('user_typing', { 
        chatId: data.chatId, 
        username: data.username 
      });
    });

    // El frontend emite esto cuando el usuario deja de teclear o borra el texto
    socket.on('typing_end', (data: { chatId: string; username: string }) => {
      socket.broadcast.to(data.chatId).emit('user_stopped_typing', { 
        chatId: data.chatId, 
        username: data.username 
      });
    });

    // ==========================================
    // 3. NOTIFICACIONES GLOBALES
    // ==========================================
    // El frontend emite esto apenas el usuario inicia sesión
    socket.on('join_global', (userId: string) => {
      // Usamos el userId como nombre de la sala personal
      socket.join(userId);
      console.log(`[SOCKET] Usuario ${userId} conectado a su canal global de notificaciones`);
    });

    // ==========================================
    // MANEJO DE DESCONEXIÓN
    // ==========================================
    socket.on('disconnect', () => {
      console.log(`[SOCKET] Cliente desconectado: ${socket.id}`);
    });
  });
};