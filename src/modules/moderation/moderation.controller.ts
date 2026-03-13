import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { 
  createReportService, 
  getPendingReportsService, 
  resolveReportService,
  getGlobalPendingReportsService // <-- Importamos el nuevo servicio global
} from './report.service';
import { getCommunityModLogsService } from './mod-log.service';
import { BlacklistModel } from './blacklist.model';
import { UserModel } from '../users/user.model';

// ==========================================
// REPORTES DE COMUNIDAD
// ==========================================

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reporterId = req.user?.id;
    const communityId = req.params.communityId as string;
    const { targetType, targetId, reason, description } = req.body;

    if (!reporterId) { res.status(401).json({ message: 'Usuario no autenticado' }); return; }
    if (!targetType || !targetId || !reason) { res.status(400).json({ message: 'Faltan datos obligatorios para el reporte' }); return; }

    const report = await createReportService({ 
      scope: 'community', // <-- Definimos la jurisdicción
      communityId, 
      reporterId, 
      targetType, 
      targetId, 
      reason, 
      description 
    });
    res.status(201).json({ message: 'Reporte enviado al equipo de moderación', report });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al enviar el reporte' });
  }
};

export const getPendingReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const reports = await getPendingReportsService(communityId);
    res.status(200).json({ reports });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener reportes' });
  }
};

export const resolveReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moderatorId = req.user?.id;
    const communityId = req.params.communityId as string;
    const reportId = req.params.reportId as string;
    const { action } = req.body; // 'resolved' o 'dismissed'

    if (!moderatorId) { res.status(401).json({ message: 'Usuario no autenticado' }); return; }
    if (action !== 'resolved' && action !== 'dismissed') { res.status(400).json({ message: 'Acción no válida' }); return; }

    // El orden de los argumentos ha sido corregido para coincidir con el servicio
    const result = await resolveReportService(reportId, moderatorId, action, communityId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al resolver el reporte' });
  }
};

// ==========================================
// REPORTES GLOBALES (SENTINEL / CHATS DIRECTOS)
// ==========================================

export const createGlobalReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reporterId = req.user?.id;
    const { targetType, targetId, reason, description } = req.body;

    if (!reporterId) { res.status(401).json({ message: 'Usuario no autenticado' }); return; }
    if (!targetType || !targetId || !reason) { res.status(400).json({ message: 'Faltan datos obligatorios para el reporte' }); return; }

    const report = await createReportService({
      scope: 'global', // <-- Sin communityId
      reporterId,
      targetType,
      targetId,
      reason,
      description
    });

    res.status(201).json({ message: 'Reporte enviado a Sentinel', report });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al enviar el reporte global' });
  }
};

export const getGlobalReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Buscamos al usuario en la BD para verificar su rol real
    const admin = await UserModel.findById(req.user?.id);
    
    if (!admin || admin.globalRole !== 'system') {
      res.status(403).json({ message: 'Acceso denegado. Solo Sentinel puede ver esta bandeja.' });
      return;
    }

    const reports = await getGlobalPendingReportsService();
    res.status(200).json({ reports });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener reportes globales' });
  }
};

export const resolveGlobalReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = await UserModel.findById(req.user?.id);
    
    if (!admin || admin.globalRole !== 'system') {
      res.status(403).json({ message: 'Acceso denegado.' });
      return;
    }

    const moderatorId = req.user?.id;
    const reportId = req.params.reportId as string;
    const action = req.body.action as 'resolved' | 'dismissed'; // Le decimos explícitamente a TS el tipo

    if (!moderatorId) { res.status(401).json({ message: 'Usuario no autenticado' }); return; }
    if (action !== 'resolved' && action !== 'dismissed') { res.status(400).json({ message: 'Acción no válida' }); return; }

    const result = await resolveReportService(reportId, moderatorId, action);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al resolver el reporte global' });
  }
};

// ==========================================
// OTROS SERVICIOS (MOD LOGS Y BLACKLIST)
// ==========================================

export const getModLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const page = parseInt(req.query.page as string) || 1;
    
    const logs = await getCommunityModLogsService(communityId, page);
    res.status(200).json(logs);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener el historial' });
  }
};

export const getEdgeBlacklist = async (req: Request, res: Response): Promise<void> => {
  try {
    const blacklistItems = await BlacklistModel.find({ isActive: true }).select('term -_id');
    const edgeList = blacklistItems.map(item => item.term);

    res.status(200).json({
      success: true,
      data: edgeList
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener la lista de automoderación' });
  }
};