import app from './app';
import dotenv from 'dotenv';
import { connectDB } from './config/database'; // Importamos la conexión
import { config } from './config'; // Importamos la configuración

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    // 1. Primero conectamos la base de datos
    await connectDB();

    // 2. Luego levantamos el servidor web
    app.listen(config.app.port, () => {
      console.log(`Servidor de ${config.app.name} ejecutándose en el puerto ${config.app.port}`);
    });
  } catch (error) {
    console.error('Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();