import app from './app';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database'; 
import { config } from './config'; 
import { startGovernanceCronJobs } from './modules/governance/governance.cron';
import { setupSockets } from './modules/sockets/socket.controller';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const startServer = async () => {
  try {
    // 1. Primero conectamos la base de datos
    await connectDB();

    // startGovernanceCronJobs(); #descomentar cuando se hagan las pruebas

    // 2. Creamos el servidor HTTP nativo pasando nuestra app de Express
    const httpServer = createServer(app);

    // 3. Inicializamos Socket.io sobre ese servidor HTTP
    // Configuramos CORS para que el frontend pueda conectarse sin bloqueos
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*', 
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      }
    });
    
    app.set('io', io);
    // 4. Delegamos toda la lógica de eventos a nuestro módulo especializado
    setupSockets(io);

    // 5. IMPORTANTE: Ahora httpServer.listen es el que levanta todo, no app.listen
    httpServer.listen(config.app.port, () => {
      console.log(`Servidor HTTP y WebSockets de ${config.app.name} ejecutándose en el puerto ${config.app.port}`);
    });

  } catch (error) {
    console.error('Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();