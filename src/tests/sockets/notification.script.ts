import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:2700';

// Pon aquí el ID real de un usuario de tu base de datos
const TEST_USER_ID = '000000000000000000000'; 

console.log('Iniciando escucha de la Campana Global de Notificaciones...');

const client = io(SERVER_URL);

client.on('connect', () => {
  console.log(`[Cliente] Conectado exitosamente. Sincronizando campana...`);
  
  // El usuario inicia sesión y se inscribe a su sala personal
  client.emit('join_global', TEST_USER_ID);
  
  console.log(`[Sistema] Escuchando notificaciones en tiempo real para el usuario: ${TEST_USER_ID}`);
  console.log(`[Sistema] Ve a tu Postman/Frontend y genera una acción (ej. un Like o un Comentario) dirigida a este usuario.`);
});

// Escuchamos el evento que emitimos desde notification.service.ts
client.on('new_notification', (data) => {
  console.log('\n--- ¡NUEVA NOTIFICACIÓN RECIBIDA EN VIVO! ---');
  console.log(`Tipo: ${data.type}`);
  console.log(`Contexto: ${data.context}`);
  console.log(`¿Leída?: ${data.isRead}`);
  console.log('Datos completos:', data);
  console.log('----------------------------------------------\n');
  
  // Cerramos la prueba exitosamente
  client.disconnect();
  process.exit(0);
});

client.on('connect_error', (err) => {
  console.error('[Cliente] Error de conexión:', err.message);
  process.exit(1);
});