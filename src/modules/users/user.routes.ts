import { Router } from 'express';
import { registerUser, loginUser, getUserProfile, updateGlobalProfile } from './user.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Rutas de autenticación
router.post('/register', registerUser);
router.post('/login', loginUser);

// Ruta para actualizar tu propio perfil global (Protegida)
// PUT /api/v1/users/profile
router.put('/profile', verifyToken, updateGlobalProfile);

// Ruta para ver el perfil global de alguien más (Pública)
// GET /api/v1/users/:username
router.get('/:username', getUserProfile);

export default router;