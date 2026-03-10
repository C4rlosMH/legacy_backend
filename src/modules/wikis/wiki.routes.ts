import { Router } from 'express';
import { createWiki, submitWiki, moderateWiki, updateWiki, getWiki, deleteWiki,
    getCatalogWikis,
 } from './wiki.controller';
import { createCategory, getCategories, updateCategory, deleteCategory } from './wiki-category.controller'; // <-- NUEVO
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireCommunityRole } from '../../middlewares/community-role.middleware';
import { requireLevel } from '../../middlewares/level-gate.middleware';
import { config } from '../../config';

const router = Router();

// ==========================================
// RUTAS DE CATEGORÍAS (CARPETAS DEL CATÁLOGO)
// ==========================================

// Ver carpetas (público para miembros de la comunidad)
router.get(
  '/:communityId/categories', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']), 
  getCategories
);

// Crear carpeta (Solo Staff)
router.post(
  '/:communityId/categories', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator']), 
  createCategory
);

// Actualizar carpeta (Solo Staff)
router.put(
  '/:communityId/categories/:categoryId', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator']), 
  updateCategory
);

// Eliminar carpeta (Solo Staff)
router.delete(
  '/:communityId/categories/:categoryId', 
  verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator']), 
  deleteCategory
);

// ==========================================
// RUTAS DE WIKIS
// ==========================================

// Ruta: POST /api/v1/wikis/:communityId
router.post(
  '/:communityId',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']),
  createWiki
);

// Ruta: GET /api/v1/wikis/:communityId/catalog
// Explorador del catálogo oficial (IMPORTANTE: Debe ir antes del GET por ID)
router.get(
  '/:communityId/catalog',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']),
  getCatalogWikis
);

// Ruta: GET /api/v1/wikis/:communityId/:wikiId
router.get(
  '/:communityId/:wikiId',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']),
  getWiki
);

// Ruta: PUT /api/v1/wikis/:communityId/:wikiId
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
router.delete(
  '/:communityId/:wikiId',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']),
  deleteWiki
);

// Ruta: POST /api/v1/wikis/:communityId
router.post(
  '/:communityId',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']),
  requireLevel(config.permissions.minLevelToPost), // <--- BARRERA DE NIVEL AÑADIDA
  createWiki
);

export default router;