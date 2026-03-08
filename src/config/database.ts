import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    // Usamos 127.0.0.1 en lugar de localhost para evitar problemas de resolución de IPv6 en Node.js modernos
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/legacy_db';
    
    const connection = await mongoose.connect(mongoURI);
    
    console.log(`Conexión exitosa a MongoDB: ${connection.connection.host}`);
  } catch (error) {
    console.error('Error al conectar con la base de datos de Legacy:', error);
    // Si la base de datos falla, detenemos el servidor para evitar un estado inconsistente
    process.exit(1);
  }
};