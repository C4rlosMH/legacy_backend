import { Router } from 'express';
import { 
  createCommunity, getCommunityDetails, searchCommunities, updateCommunitySettings,
  deleteCommunity, requestListing, approveListing, rejectListing,
  getExploreCommunities // <-- Asegúrate de que esto esté importado
} from './community.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireCommunityRole } from '../../middlewares/community-role.middleware';

const router = Router();

// 1. Ruta: POST /api/v1/communities
router.post('/', verifyToken, createCommunity);

// 2. Ruta: GET /api/v1/communities/search?q=texto (Pública - Buscador Global)
router.get('/search', searchCommunities);

// 3. Ruta: GET /api/v1/communities/explore (Feed Global)
// ¡DEBE IR ANTES DE /:id O /:communityId PARA QUE NO CHOQUEN!
router.get('/explore', getExploreCommunities);

// 4. Solo Owner y Admin pueden pasar a Settings
router.put(
  '/:communityId/settings', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin']), 
  updateCommunitySettings
);

// 5. Detalles de la comunidad (El comodín)
router.get('/:id', getCommunityDetails);

// 6. Ruta: DELETE /api/v1/communities/:communityId
router.delete('/:communityId', verifyToken, requireCommunityRole(['owner']), deleteCommunity);

// 7. Rutas de listado (Privado/Público)
router.post('/:communityId/request-listing', verifyToken, requestListing);
router.post('/:communityId/approve-listing', verifyToken, approveListing);
router.post('/:communityId/reject-listing', verifyToken, rejectListing);

export default router;