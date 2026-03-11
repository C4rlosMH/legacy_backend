import { InsurrectionModel } from './insurrection.model';
import { config } from '../../config';

export const triggerInsurrectionService = async (communityId: string, initiatorId: string) => {
  try {
    // Importación dinámica del archivo secreto
    const core = await import('./insurrection.core');
    
    // Le pasamos la configuración global para que el core la use
    return await core.executeInsurrectionLogic(communityId, initiatorId, config.governance);
    
  } catch (error: any) {
    // Si el error viene de la importación fallida (ej. en GitHub), mostramos un aviso limpio
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn(`[GOVERNANCE] El protocolo de Insurrección está protegido en la versión pública.`);
      throw new Error('El protocolo de gobernanza avanzada no está disponible en este entorno.');
    }
    
    // Si es un error real de lógica (ej. el usuario no tiene nivel), lo lanzamos normal
    throw error;
  }
};

// NUEVO: Envoltorio para emitir un voto
export const castVoteService = async (insurrectionId: string, userId: string, vote: 'for' | 'against') => {
  try {
    const core = await import('./insurrection.core');
    return await core.castVoteLogic(insurrectionId, userId, vote);
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn(`[GOVERNANCE] El protocolo de Insurrección está protegido en la versión pública.`);
      throw new Error('El protocolo de gobernanza avanzada no está disponible en este entorno.');
    }
    throw error;
  }
};

// NUEVO: Función de solo lectura (no necesita protección industrial, puede ir directo a la BD)
// Sirve para que el frontend sepa si hay una votación activa y muestre la barra de progreso
export const getActiveInsurrectionService = async (communityId: string) => {
  return await InsurrectionModel.findOne({
    communityId,
    status: 'active'
  }).select('-votesFor -votesAgainst'); // Ocultamos quién votó por privacidad
};

export const acceptRoleService = async (insurrectionId: string, userId: string) => {
  try {
    const core = await import('./insurrection.core');
    return await core.acceptRoleLogic(insurrectionId, userId);
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') throw new Error('El protocolo de gobernanza está protegido.');
    throw error;
  }
};

export const rejectRoleService = async (insurrectionId: string, userId: string) => {
  try {
    const core = await import('./insurrection.core');
    return await core.rejectRoleLogic(insurrectionId, userId);
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') throw new Error('El protocolo de gobernanza está protegido.');
    throw error;
  }
};

export const processExpiredInsurrectionsService = async () => {
  try {
    const core = await import('./insurrection.core');
    return await core.processExpiredInsurrectionsLogic();
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') return 0;
    throw error;
  }
};

export const processExpiredInvitationsService = async () => {
  try {
    const core = await import('./insurrection.core');
    return await core.processExpiredInvitationsLogic();
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') return 0;
    throw error;
  }
};