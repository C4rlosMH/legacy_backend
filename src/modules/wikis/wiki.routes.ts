import { Router } from 'express';
import { createWiki, submitWiki, moderateWiki, updateWiki, getWiki, deleteWiki } from './wiki.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireCommunityRole } from '../../middlewares/community-role.middleware';

const router = Router();

// Ruta: POST /api/v1/wikis/:communityId
router.post(
  '/:communityId',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']),
  createWiki
);

// Ruta: GET /api/v1/wikis/:communityId/:wikiId
// Lectura pública para miembros de la comunidad (maneja el anonimato del autor)
router.get(
  '/:communityId/:wikiId',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']),
  getWiki
);

// Ruta: PUT /api/v1/wikis/:communityId/:wikiId
// Permite al usuario editar su original, o al staff editar la dorada
router.put(
  '/:communityId/:wikiId',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']),
  updateWiki
);

// Ruta: PUT /api/v1/wikis/:communityId/:wikiId/submit
router.put(
  '/:communityId/:wikiId/submit',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']),
  submitWiki
);

// Ruta: PUT /api/v1/wikis/:communityId/:wikiId/moderate
router.put(
  '/:communityId/:wikiId/moderate',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator']),
  moderateWiki
);

// Ruta: DELETE /api/v1/wikis/:communityId/:wikiId
// El servicio discrimina si se borra la original (usuario) o la dorada (staff)
router.delete(
  '/:communityId/:wikiId',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']),
  deleteWiki // <- Asegúrate de importarlo
);

export default router;