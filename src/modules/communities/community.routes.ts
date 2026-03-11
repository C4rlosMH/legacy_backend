import { Router } from 'express';
import { createCommunity, getCommunityDetails, searchCommunities, updateCommunitySettings,
  deleteCommunity, requestListing, approveListing, rejectListing
 } from './community.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireCommunityRole } from '../../middlewares/community-role.middleware';

const router = Router();

// Ruta: POST /api/v1/communities
router.post('/', verifyToken, createCommunity);

// Ruta: GET /api/v1/communities/search?q=texto (Pública - Buscador Global)
router.get('/search', searchCommunities);

// Solo Owner y Admin pueden pasar
router.put(
  '/:communityId/settings', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin']), 
  updateCommunitySettings
);

// Aquí a futuro agregaremos rutas como:
router.get('/:id', getCommunityDetails);
// router.put('/:id', updateCommunity);

// Ruta: DELETE /api/v1/communities/:communityId
// Peligro: Borrado total. Solo el Owner puede pasar.
router.delete('/:communityId', verifyToken, requireCommunityRole(['owner']), deleteCommunity);

router.post('/:communityId/request-listing', verifyToken, requestListing);

router.post('/:communityId/approve-listing', verifyToken, approveListing);

// POST: Rechazar un universo (Solo Team Legacy)
router.post('/:communityId/reject-listing', verifyToken, rejectListing);

export default router;