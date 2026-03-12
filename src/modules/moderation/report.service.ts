import { ReportModel } from './report.model';
import { createModLogService } from './mod-log.service';

interface CreateReportDTO {
  communityId: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'message' | 'user' | 'wiki';
  targetId: string;
  reason: string;
  description?: string;
}

export const createReportService = async (data: CreateReportDTO) => {
  // Evitamos que un usuario envíe spam de reportes sobre el mismo contenido
  const existingReport = await ReportModel.findOne({
    communityId: data.communityId,
    reporterId: data.reporterId,
    targetId: data.targetId,
    status: 'pending'
  });

  if (existingReport) {
    throw new Error('Ya has reportado este contenido y está pendiente de revisión por el staff.');
  }

  return await ReportModel.create(data);
};

export const getPendingReportsService = async (communityId: string) => {
  // El staff necesita ver las denuncias pendientes, ordenadas de la más antigua a la más nueva
  return await ReportModel.find({ communityId, status: 'pending' })
    .populate('reporterId', 'username avatar')
    .sort({ createdAt: 1 });
};

export const resolveReportService = async (
  reportId: string, 
  communityId: string, 
  moderatorId: string, 
  action: 'resolved' | 'dismissed'
) => {
  const report = await ReportModel.findOne({ _id: reportId, communityId });
  
  if (!report) throw new Error('Reporte no encontrado en esta comunidad.');
  if (report.status !== 'pending') throw new Error('Este reporte ya fue procesado anteriormente.');

  report.status = action;
  report.resolvedBy = moderatorId as any;
  await report.save();

  // Dejamos un registro inmutable en el Historial de Moderación
  await createModLogService({
    communityId,
    moderatorId,
    action: 'resolve_report',
    targetId: report.targetId.toString(),
    reason: `Reporte clasificado como '${action}'. Motivo original de la denuncia: ${report.reason}`
  });

  return { message: `Reporte marcado como ${action} exitosamente.`, report };
};