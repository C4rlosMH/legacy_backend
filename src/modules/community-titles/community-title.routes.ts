import { Router } from 'express';
import {
  createCommunityTitle, getCommunityTitles, assignTitleToMember,
  revokeTitleFromMember, equipDisplayTitles
} from './community-title.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireCommunityRole } from '../../middlewares/community-role.middleware';

const router = Router();

// ==========================================
// RUTAS DE ADMINISTRACIÓN (Solo Staff)
// ==========================================

// POST /api/v1/community-titles/:communityId
router.post(
  '/:communityId', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin']), 
  createCommunityTitle
);

// POST /api/v1/community-titles/:communityId/assign/:targetUserId
router.post(
  '/:communityId/assign/:targetUserId', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin']), 
  assignTitleToMember
);

// DELETE /api/v1/community-titles/:communityId/revoke/:targetUserId/:titleId
router.delete(
  '/:communityId/revoke/:targetUserId/:titleId', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin']), 
  revokeTitleFromMember
);

// ==========================================
// RUTAS PÚBLICAS Y DE USUARIO
// ==========================================

// GET /api/v1/community-titles/:communityId (Cualquier miembro puede ver el catálogo)
router.get(
  '/:communityId', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']), 
  getCommunityTitles
);

// PUT /api/v1/community-titles/:communityId/equip (El usuario actualiza su propio perfil)
router.put(
  '/:communityId/equip', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']), 
  equipDisplayTitles
);

export default router;