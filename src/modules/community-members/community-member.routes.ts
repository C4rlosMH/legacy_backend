import { Router } from 'express';
import { 
  joinCommunity, 
  getUserCommunities, 
  updateCommunityProfile, 
  updateMemberRole,
  toggleHideProfile,
  kickMember
} from './community-member.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireCommunityRole } from '../../middlewares/community-role.middleware';

const router = Router();

// Ruta: POST /api/v1/community-members/:communityId/join
router.post('/:communityId/join', verifyToken, joinCommunity);

// Ruta: GET /api/v1/community-members/my
router.get('/my', verifyToken, getUserCommunities);

// Actualizar mi perfil (personaje/apodo) dentro de una comunidad específica
router.put(
  '/:communityId/profile', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']), 
  updateCommunityProfile
);

// Ascender o degradar roles
router.put(
  '/:communityId/roles/:targetUserId',
  verifyToken,
  requireCommunityRole(['owner', 'admin']), // Solo Agentes y Líderes
  updateMemberRole
);

// --- RUTAS DE MODERACIÓN DE USUARIOS ---

// Ocultar o mostrar el perfil de un usuario
router.put(
  '/:communityId/hide-profile/:targetUserId',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator']), // Curadores (Moderators) también pueden
  toggleHideProfile
);

// Expulsar a un miembro
router.delete(
  '/:communityId/kick/:targetUserId',
  verifyToken,
  requireCommunityRole(['owner', 'admin']), // Curadores NO pueden expulsar
  kickMember
);

export default router;