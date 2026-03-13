import { ReportModel } from './report.model';
import { createModLogService } from './mod-log.service';

interface CreateReportDTO {
  scope: 'global' | 'community'; // <-- NUEVO
  communityId?: string;          // <-- OPCIONAL
  reporterId: string;
  targetType: 'post' | 'comment' | 'message' | 'user' | 'wiki';
  targetId: string;
  reason: string;
  description?: string;
}

export const createReportService = async (data: CreateReportDTO) => {
  // Validación estricta
  if (data.scope === 'community' && !data.communityId) {
    throw new Error('Un reporte de comunidad requiere forzosamente el ID de la comunidad.');
  }

  // Evitamos que un usuario envíe spam de reportes sobre el mismo contenido
  const query: any = {
    scope: data.scope,
    reporterId: data.reporterId,
    targetId: data.targetId,
    status: 'pending'
  };
  if (data.communityId) query.communityId = data.communityId;

  const existingReport = await ReportModel.findOne(query);

  if (existingReport) {
    throw new Error('Ya has reportado este contenido y está pendiente de revisión.');
  }

  return await ReportModel.create(data);
};

export const getPendingReportsService = async (communityId: string) => {
  return await ReportModel.find({ scope: 'community', communityId, status: 'pending' })
    .populate('reporterId', 'username avatar')
    .sort({ createdAt: 1 });
};

// NUEVA FUNCIÓN: Obtiene los reportes globales (Para Sentinel)
export const getGlobalPendingReportsService = async () => {
  return await ReportModel.find({ scope: 'global', status: 'pending' })
    .populate('reporterId', 'username avatar')
    .sort({ createdAt: 1 });
};

export const resolveReportService = async (
  reportId: string, 
  moderatorId: string, 
  action: 'resolved' | 'dismissed',
  communityId?: string 
) => {
  // 1. Construimos la consulta de forma dinámica para evitar buscar "undefined"
  const query: any = { _id: reportId };
  if (communityId) {
    query.communityId = communityId;
  }

  const report = await ReportModel.findOne(query);
  
  if (!report) throw new Error('Reporte no encontrado con los permisos actuales.');
  if (report.status !== 'pending') throw new Error('Este reporte ya fue procesado anteriormente.');

  report.status = action;
  report.resolvedBy = moderatorId as any;
  await report.save();

  // 2. Dejamos registro en el Historial SOLO si es un reporte de comunidad
  if (report.scope === 'community' && communityId) {
    await createModLogService({
      communityId, // TypeScript ya no se queja porque el "if" de arriba garantiza que aquí sí hay un string
      moderatorId,
      action: 'resolve_report',
      targetId: report.targetId.toString(),
      reason: `Reporte clasificado como '${action}'. Motivo original de la denuncia: ${report.reason}`
    });
  }

  return { message: `Reporte marcado como ${action} exitosamente.`, report };
};