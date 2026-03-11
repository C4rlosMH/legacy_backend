import cron from 'node-cron';
import { 
  processExpiredInsurrectionsService, 
  processExpiredInvitationsService 
} from './insurrection.service';

export const startGovernanceCronJobs = () => {
  // Se ejecuta cada hora (en el minuto 0 de cada hora)
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[CRON] Iniciando revisión de Gobernanza...');
      
      const closedInsurrections = await processExpiredInsurrectionsService();
      if (closedInsurrections > 0) {
        console.log(`[CRON] Se cerraron ${closedInsurrections} insurrecciones expiradas.`);
      }

      const rotatedInvitations = await processExpiredInvitationsService();
      if (rotatedInvitations > 0) {
        console.log(`[CRON] Se rotaron ${rotatedInvitations} invitaciones de liderazgo expiradas.`);
      }

    } catch (error) {
      console.error('[CRON] Error en la revisión de Gobernanza:', error);
    }
  });

  console.log('[CRON] Tareas de Gobernanza y Autosanación programadas exitosamente.');
};