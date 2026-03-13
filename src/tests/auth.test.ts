import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../app';

// Cargamos el .env para que reconozca tus variables
dotenv.config();

// 1. ANTES DE LAS PRUEBAS: Conectamos a una base de datos exclusiva para testing
beforeAll(async () => {
  // Aseguramos que si no existe en el .env, use este string por defecto
  const testDbUri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/legacy_db';
  await mongoose.connect(testDbUri);
});

// 2. DESPUÉS DE LAS PRUEBAS: Borramos la BD de prueba y cerramos conexión
afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.connection.close();
});

// 3. LA SUITE DE PRUEBAS PARA AUTENTICACIÓN
describe('Auth & Identity API', () => {
  const testUser = {
    name: 'Usuario Prueba',
    username: 'tester99',
    email: 'test@legacy.com',
    password: 'passwordSeguro123'
  };

  it('1. Debería registrar un nuevo usuario exitosamente', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('creado exitosamente');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.username).toBe(testUser.username);
  });

  it('2. Debería bloquear el registro si el correo ya existe', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send(testUser); 

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('ya están en uso');
  });

  it('3. Debería hacer login y devolver un token JWT', async () => {
    const res = await request(app)
      .post('/api/v1/users/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('4. Debería rechazar el login con una contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/v1/users/login')
      .send({
        email: testUser.email,
        password: 'contraseñaEquivocada'
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });
});