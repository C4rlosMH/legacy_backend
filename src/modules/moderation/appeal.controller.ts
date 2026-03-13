import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserModel } from '../users/user.model';
import { createAppealService, getPendingAppealsService, resolveAppealService } from './appeal.service';

export const createAppeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { appealText } = req.body;

    if (!userId) { res.status(401).json({ message: 'Usuario no autenticado' }); return; }
    if (!appealText) { res.status(400).json({ message: 'El texto de la apelación es obligatorio' }); return; }

    const appeal = await createAppealService({ userId, appealText });
    res.status(201).json({ message: 'Apelación enviada exitosamente. El equipo Sentinel revisará tu caso.', appeal });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al enviar la apelación' });
  }
};

export const getPendingAppeals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verificación de seguridad: Consultamos a la BD el rol en tiempo real
    const admin = await UserModel.findById(req.user?.id);
    
    if (!admin || admin.globalRole !== 'system') {
      res.status(403).json({ message: 'Acceso denegado. Solo Sentinel puede revisar apelaciones.' });
      return;
    }

    const appeals = await getPendingAppealsService();
    res.status(200).json({ appeals });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener las apelaciones' });
  }
};

export const resolveAppeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verificación de seguridad: Consultamos a la BD
    const admin = await UserModel.findById(req.user?.id);

    if (!admin || admin.globalRole !== 'system') {
      res.status(403).json({ message: 'Acceso denegado.' });
      return;
    }

    const adminId = req.user?.id;
    const appealId = req.params.appealId as string;
    const { action, notes } = req.body; // action debe ser 'approved' o 'rejected'

    if (!adminId) { res.status(401).json({ message: 'Usuario no autenticado' }); return; }
    if (action !== 'approved' && action !== 'rejected') { 
      res.status(400).json({ message: 'Acción no válida. Debe ser "approved" o "rejected".' }); 
      return; 
    }

    const result = await resolveAppealService({ appealId, adminId, action, notes });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al resolver la apelación' });
  }
};