import { io } from 'socket.io-client';

// Ajusta el puerto si tu servidor cambia
const SERVER_URL = 'http://localhost:2700';
const TEST_CHAT_ID = 'sala-de-prueba-123';

console.log('Iniciando prueba automatizada de WebSockets...');

// Simulamos dos conexiones de usuarios distintos
const clientA = io(SERVER_URL);
const clientB = io(SERVER_URL);

// --- Lógica del Cliente A ---
clientA.on('connect', () => {
  console.log(`[Cliente A] Conectado exitosamente con ID: ${clientA.id}`);
  
  // Cliente A entra a la sala
  clientA.emit('join_chat', TEST_CHAT_ID);
});

// --- Lógica del Cliente B ---
clientB.on('connect', () => {
  console.log(`[Cliente B] Conectado exitosamente con ID: ${clientB.id}`);
  
  // Cliente B entra a la misma sala
  clientB.emit('join_chat', TEST_CHAT_ID);

  // Esperamos 1 segundo para asegurar que ambos están en la sala y simulamos escritura
  setTimeout(() => {
    console.log('[Sistema] Cliente A va a empezar a escribir...');
    clientA.emit('typing_start', { chatId: TEST_CHAT_ID, username: 'Carlos_Admin' });
  }, 1000);
});

// --- Cliente B escucha los eventos del Cliente A ---
clientB.on('user_typing', (data) => {
  console.log(`[Cliente B] Vio en pantalla: "${data.username} está escribiendo en la sala ${data.chatId}..."`);
  
  // 1 segundo después, simulamos que el Cliente A deja de escribir
  setTimeout(() => {
    console.log('[Sistema] Cliente A dejó de escribir.');
    clientA.emit('typing_end', { chatId: TEST_CHAT_ID, username: 'Carlos_Admin' });
  }, 1000);
});

clientB.on('user_stopped_typing', (data) => {
  console.log(`[Cliente B] Vio que ${data.username} ya no está escribiendo.`);
  
  console.log('\n--- Prueba de eventos de tiempo real completada con éxito ---');
  clientA.disconnect();
  clientB.disconnect();
  process.exit(0);
});

// Manejo de errores de conexión
clientA.on('connect_error', (err) => {
  console.error('[Cliente A] Error de conexión:', err.message);
  process.exit(1);
});