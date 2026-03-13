import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../app';
import { UserModel } from '../modules/users/user.model';
import { PostModel } from '../modules/posts/post.model';

dotenv.config();

let sentinelToken = '';
let targetUserId = '';
let targetUserPostId = '';

beforeAll(async () => {
  const testDbUri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/legacy_test_db';
  await mongoose.connect(testDbUri);

  // 1. Creamos al usuario objetivo (El que será baneado)
  const targetUserRes = await request(app).post('/api/v1/users/register').send({
    name: 'Usuario Tóxico',
    username: 'toxico99',
    email: 'toxico@legacy.com',
    password: 'password123'
  });
  targetUserId = targetUserRes.body.user.id;

  // 2. INYECCIÓN DIRECTA: Creamos el post directo en la BD para saltarnos 
  // el middleware de niveles y darle a Sentinel algo que ocultar.
  const post = await PostModel.create({
    authorId: targetUserId,
    context: 'global_thread',
    postType: 'thread',
    content: 'Este es un mensaje inapropiado que romperá las reglas.'
  });
  targetUserPostId = post._id.toString();

  // 3. Creamos a Sentinel directamente en la BD para forzar su rol de 'system'
  const sentinel = await UserModel.create({
    name: 'Sentinel AutoTest',
    username: 'sentinel_test',
    email: 'sentinel@legacy.com',
    passwordHash: 'hashedpassword',
    globalRole: 'system',
    legacyCoins: 0,
    premiumStatus: 'none',
    premiumType: null
  });

  // Generamos un token manual para Sentinel
  const jwt = require('jsonwebtoken');
  sentinelToken = jwt.sign({ id: sentinel._id }, process.env.JWT_SECRET || 'changeme', { expiresIn: '1h' });
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.connection.close();
});

describe('Moderation & Sentinel API', () => {
  
  it('1. Sentinel debería poder banear al usuario globalmente', async () => {
    const res = await request(app)
      .post(`/api/v1/users/global-ban/${targetUserId}`)
      .set('Authorization', `Bearer ${sentinelToken}`)
      .send({ reason: 'Violación severa de los términos de servicio.' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('suspendida permanentemente');
  });

  it('2. El Ocultamiento en Cascada debió ejecutarse (Post oculto)', async () => {
    // Buscamos el post directamente en la base de datos
    const post = await PostModel.findById(targetUserPostId);
    
    // Verificamos que el post ahora tenga isHidden en true
    expect(post?.isHidden).toBe(true);
  });

  it('3. El usuario baneado no debería poder usar su token (Bloqueo de Auth)', async () => {
    // El usuario tóxico intenta actualizar su perfil
    const jwt = require('jsonwebtoken');
    const toxicoTokenVigente = jwt.sign({ id: targetUserId }, process.env.JWT_SECRET || 'changeme', { expiresIn: '1h' });

    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${toxicoTokenVigente}`)
      .send({ bio: 'Intentando cambiar mi bio estando baneado' });

    // Esperamos un error 403 Forbidden de nuestro middleware
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('ACCESO DENEGADO');
    expect(res.body.message).toContain('suspendida permanentemente');
  });

});