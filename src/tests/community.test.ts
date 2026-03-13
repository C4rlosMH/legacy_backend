import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../app';

dotenv.config();

let userToken = '';

// 1. PREPARACIÓN: Conectamos la BD y creamos un usuario con sesión iniciada
beforeAll(async () => {
  const testDbUri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/legacy_test_db';
  await mongoose.connect(testDbUri);

  // Registramos al usuario
  await request(app).post('/api/v1/users/register').send({
    name: 'Creador de Mundos',
    username: 'creador123',
    email: 'creador@legacy.com',
    password: 'password123'
  });

  // Iniciamos sesión para obtener el token JWT
  const loginRes = await request(app).post('/api/v1/users/login').send({
    email: 'creador@legacy.com',
    password: 'password123'
  });

  userToken = loginRes.body.token; // Guardamos la "llave" para las siguientes peticiones
});

// 2. LIMPIEZA: Borramos todo al terminar
afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.connection.close();
});

// 3. LA SUITE DE PRUEBAS DE COMUNIDADES Y ECONOMÍA
describe('Community & Economy API', () => {
  
  it('1. Debería fundar una comunidad exitosamente y descontar los 100 LC', async () => {
    const res = await request(app)
      .post('/api/v1/communities')
      .set('Authorization', `Bearer ${userToken}`) // Mandamos el token en la cabecera
      .send({
        name: 'Universo de Prueba',
        description: 'Un mundo creado por el robot de pruebas con una descripción inicial.',
        ownerNickname: 'Dios Supremo',
        visibility: 'public'
      });

    expect(res.status).toBe(201);
    expect(res.body.community.name).toBe('Universo de Prueba');
    expect(res.body.message).toContain('exitosamente');
  });

  it('2. Debería bloquear la creación de una segunda comunidad por falta de fondos', async () => {
    const res = await request(app)
      .post('/api/v1/communities')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Segundo Universo',
        description: 'Intento de crear un imperio sin capital.',
        ownerNickname: 'Dios Pobre'
      });

    // Esperamos un error 400 (Bad Request)
    expect(res.status).toBe(400);
    // Verificamos que el mensaje mencione la falta de dinero
    expect(res.body.message).toContain('Fondos insuficientes'); 
  });

});