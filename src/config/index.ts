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
  }
};