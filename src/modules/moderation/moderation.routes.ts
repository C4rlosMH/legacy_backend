import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import {
  getEdgeBlacklist,
  createGlobalReport,
  getGlobalReports,
  resolveGlobalReport,
  createReport,
  getPendingReports,
  resolveReport,
  getModLogs
} from './moderation.controller';
import { createAppeal, getPendingAppeals, resolveAppeal } from './appeal.controller';

const router = Router();

// ==========================================
// 1. AUTOMODERACIÓN EDGE
// ==========================================
// El frontend llama a esta ruta al abrir la app para cargar el escudo
router.get('/edge-blacklist', verifyToken, getEdgeBlacklist);

// ==========================================
// 2. REPORTES GLOBALES (SENTINEL / CHATS DIRECTOS)
// ==========================================
// Cualquier usuario puede reportar un chat directo o perfil global
router.post('/global/reports', verifyToken, createGlobalReport);

// Solo Sentinel puede ver y resolver estos reportes (la seguridad está en el controlador)
router.get('/global/reports', verifyToken, getGlobalReports);
router.patch('/global/reports/:reportId/resolve', verifyToken, resolveGlobalReport);

// ==========================================
// 3. REPORTES LOCALES (COMUNIDADES)
// ==========================================
// Los usuarios reportan contenido dentro de una comunidad específica
router.post('/:communityId/reports', verifyToken, createReport);

// Los moderadores locales revisan y resuelven los reportes de su comunidad
router.get('/:communityId/reports', verifyToken, getPendingReports);
router.patch('/:communityId/reports/:reportId/resolve', verifyToken, resolveReport);

// Historial de moderación de la comunidad
router.get('/:communityId/logs', verifyToken, getModLogs);

// ==========================================
// 4. SISTEMA DE APELACIONES (SENTINEL)
// ==========================================
// Un usuario baneado envía su ticket de defensa
router.post('/appeals', verifyToken, createAppeal);

// Sentinel revisa la bandeja de apelaciones pendientes
router.get('/appeals', verifyToken, getPendingAppeals);

// Sentinel aprueba (desbaneo automático) o rechaza la apelación
router.patch('/appeals/:appealId/resolve', verifyToken, resolveAppeal);

export default router;