import { Router } from 'express';
import { registerUser, loginUser, getUserProfile, updateGlobalProfile, blockUser,
    deleteUserAccount, verifyEmail, resetPassword, forgotPassword, unblockUser,
    banGlobalUser, unbanGlobalUser, getMyProfile, searchUsers
 } from './user.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireGlobalRole } from '../../middlewares/global-role.middleware';

const router = Router();

// Rutas de autenticación
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas de Identidad y Seguridad (Sprint 1)
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Rutas de Bloqueo
router.post('/block/:targetUserId', verifyToken, blockUser);
router.post('/unblock/:targetUserId', verifyToken, unblockUser);

// Ruta para actualizar tu propio perfil global (Protegida)
// PUT /api/v1/users/profile
router.put('/profile', verifyToken, updateGlobalProfile);

// Ruta para ELIMINAR tu cuenta global (Protegida)
router.delete('/account', verifyToken, deleteUserAccount);


router.get('/me', verifyToken, getMyProfile);
router.get('/', searchUsers);
// Ruta para ver el perfil global de alguien más (Pública)
// GET /api/v1/users/:username
router.get('/:username', getUserProfile);

// Rutas de Moderación Global (Solo cuentas 'system' / Sentinel)
router.post('/global-ban/:targetUserId', verifyToken, requireGlobalRole(['system']), banGlobalUser);

router.post('/global-unban/:targetUserId', verifyToken, requireGlobalRole(['system']), unbanGlobalUser);

export default router;