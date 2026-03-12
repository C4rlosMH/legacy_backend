import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { createReportService, getPendingReportsService, resolveReportService } from './report.service';
import { getCommunityModLogsService } from './mod-log.service';

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reporterId = req.user?.id;
    const communityId = req.params.communityId as string;
    const { targetType, targetId, reason, description } = req.body;

    if (!reporterId) { res.status(401).json({ message: 'Usuario no autenticado' }); return; }
    if (!targetType || !targetId || !reason) { res.status(400).json({ message: 'Faltan datos obligatorios para el reporte' }); return; }

    const report = await createReportService({ communityId, reporterId, targetType, targetId, reason, description });
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

    const result = await resolveReportService(reportId, communityId, moderatorId, action);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al resolver el reporte' });
  }
};

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