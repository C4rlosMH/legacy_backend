import dotenv from 'dotenv';

// Aseguramos que las variables de entorno se carguen antes de exportarlas
dotenv.config();

export const config = {
  app: {
    name: process.env.APP_NAME,
    port: parseInt(process.env.PORT as string, 10),
  },
  db: {
    uri: process.env.MONGO_URI,
  },
  api: {
    // Definimos el prefijo global con su versión
    prefix: '/api/v1',
  },
  security: {
    bcryptSaltRounds: 12,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  },
  limits: {
    maxBioLength: 160,
    maxUsernameLength: 30,
  },
  economy: {
    transactionTaxRate: 0.30,   // Impuesto del 30% para transacciones P2P
    worldCreationCost: 100,     // Costo de crear una nueva comunidad
    welcomeGrant: 100,          // Legacy Coins regaladas al registrarse
  },
  gamification: {
    maxLevel: 20,           // Podrás cambiar esto a 30, 50, 100 después
    baseXP: 100,            // XP necesaria para nivel 2
    difficultyCurve: 1.8,   // Qué tan rápido sube la dificultad
  },
  permissions: {
    minLevelToPost: 5,         // Nivel para Blogs/Hilos
    minLevelToSendImages: 6,   // Nivel para Multimedia
    minLevelToCreateChat: 8,   // Nivel para salas públicas
    minLevelToVote: 10,        // Nivel para gobernanza
    minLevelToTip: 5,          // Nivel para enviar/recibir propinas
  }
};