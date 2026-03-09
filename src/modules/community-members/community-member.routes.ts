import { Router } from 'express';
import { joinCommunity, getUserCommunities, updateCommunityProfile, updateMemberRole,

} from './community-member.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireCommunityRole } from '../../middlewares/community-role.middleware';

const router = Router();

// Ruta: POST /api/v1/community-members/:communityId/join
router.post('/:communityId/join', verifyToken, joinCommunity);

// Ruta: GET /api/v1/community-members/me/communities
router.get('/my', verifyToken, getUserCommunities);

// Actualizar mi perfil (personaje/apodo) dentro de una comunidad específica
// PUT /api/v1/community-members/:communityId/profile
router.put(
  '/:communityId/profile', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']), 
  updateCommunityProfile
);

// PUT /api/v1/community-members/:communityId/roles/:targetUserId
router.put(
  '/:communityId/roles/:targetUserId',
  verifyToken,
  requireCommunityRole(['owner', 'admin']), // Solo Agentes y Líderes entran aquí
  updateMemberRole
);

export default router;


