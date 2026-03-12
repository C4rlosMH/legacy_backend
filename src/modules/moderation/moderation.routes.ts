import { Router } from 'express';
import { createReport, getPendingReports, resolveReport, getModLogs } from './moderation.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireCommunityRole } from '../../middlewares/community-role.middleware';

const router = Router();

// 1. Crear un reporte (Cualquier miembro)
router.post('/:communityId/reports', verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator', 'member']), 
  createReport
);

// 2. Ver reportes pendientes (Solo Staff)
router.get('/:communityId/reports', verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator']), 
  getPendingReports
);

// 3. Resolver/Desestimar reporte (Solo Staff)
router.put('/:communityId/reports/:reportId', verifyToken, 
  requireCommunityRole(['owner', 'admin', 'moderator']), 
  resolveReport
);

// 4. Ver el Historial de Moderación (Solo Agente y Líderes)
router.get('/:communityId/logs', verifyToken, 
  requireCommunityRole(['owner', 'admin']), 
  getModLogs
);

export default router;