import { AppealModel } from './appeal.model';
import { UserModel } from '../users/user.model';
import { unbanGlobalUserService } from '../users/user.service';

interface CreateAppealDTO {
  userId: string;
  appealText: string;
}

export const createAppealService = async (data: CreateAppealDTO) => {
  // 1. Validar que el usuario realmente exista y esté baneado
  const user = await UserModel.findById(data.userId);
  if (!user) throw new Error('Usuario no encontrado.');
  if (user.accountStatus !== 'banned') {
    throw new Error('Tu cuenta no se encuentra suspendida, por lo tanto no puedes apelar.');
  }

  // 2. Prevenir spam: Verificar si ya tiene una apelación en revisión
  const existingAppeal = await AppealModel.findOne({
    userId: data.userId,
    status: 'pending'
  });

  if (existingAppeal) {
    throw new Error('Ya tienes un ticket de apelación en revisión. Por favor espera la respuesta del equipo Sentinel.');
  }

  // 3. Crear el ticket de defensa
  return await AppealModel.create(data);
};

export const getPendingAppealsService = async () => {
  // Traemos el motivo original del baneo para darle todo el contexto a Sentinel al momento de juzgar
  return await AppealModel.find({ status: 'pending' })
    .populate('userId', 'username email banReason') 
    .sort({ createdAt: 1 });
};

interface ResolveAppealDTO {
  appealId: string;
  adminId: string; // El ID del moderador Sentinel
  action: 'approved' | 'rejected';
  notes?: string;
}

export const resolveAppealService = async (data: ResolveAppealDTO) => {
  const appeal = await AppealModel.findById(data.appealId);
  if (!appeal) throw new Error('Ticket de apelación no encontrado.');
  if (appeal.status !== 'pending') throw new Error('Este ticket de apelación ya fue procesado anteriormente.');

  // 1. Actualizamos el estado del ticket
  appeal.status = data.action;
  appeal.reviewedBy = data.adminId as any;
  if (data.notes) appeal.reviewerNotes = data.notes;

  await appeal.save();

  // 2. LA MAGIA: Si Sentinel aprueba la defensa, ejecutamos la restauración masiva
  if (data.action === 'approved') {
    try {
      // Usamos la función que construimos en la Tarea 2
      await unbanGlobalUserService(data.adminId, appeal.userId.toString());
    } catch (error) {
      console.error('[Sentinel] Error al restaurar al usuario tras aprobar su apelación:', error);
      throw new Error('La apelación fue aprobada y guardada, pero hubo un error técnico en la restauración de su contenido.');
    }
  }

  return { 
    message: `Apelación marcada como ${data.action} exitosamente. ${data.action === 'approved' ? 'El usuario ha sido restaurado.' : 'El baneo se mantiene.'}`, 
    appeal 
  };
};