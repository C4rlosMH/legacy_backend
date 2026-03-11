import cron from 'node-cron';
import { 
  processExpiredInsurrectionsService, 
  processExpiredInvitationsService 
} from './insurrection.service';
import { executeAntiZombieProtocolService } from './sentinel.service';

export const startGovernanceCronJobs = () => {
  // 1. Cron de Gobernanza (Se ejecuta cada hora en punto)
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

  // 2. Cron del Sistema Centinela (Se ejecuta todos los días a la medianoche 00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[SENTINEL] Iniciando escaneo global de universos inactivos...');
      
      const result = await executeAntiZombieProtocolService();
      
      if (result.warnedCount > 0 || result.purgedCount > 0) {
        console.log(`[SENTINEL] Reporte Anti-Zombie: ${result.warnedCount} advertencias, ${result.purgedCount} purgas.`);
      } else {
        console.log('[SENTINEL] Escaneo completado. Todos los universos listados registran actividad vital.');
      }

    } catch (error) {
      console.error('[SENTINEL] Error crítico al ejecutar el Protocolo Anti-Zombie:', error);
    }
  });

  console.log('[CRON] Tareas de Gobernanza, Autosanación y Sistema Centinela programadas exitosamente.');
};