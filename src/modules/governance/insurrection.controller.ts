import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { triggerInsurrectionService, castVoteService, getActiveInsurrectionService, acceptRoleService, 
  rejectRoleService,
} from './insurrection.service';

export const triggerInsurrection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const communityId = req.params.communityId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const newInsurrection = await triggerInsurrectionService(communityId, userId);

    res.status(201).json({
      message: 'El Protocolo de Insurrección ha sido iniciado exitosamente.',
      data: newInsurrection
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al iniciar la insurrección.' });
  }
};

export const castVote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const insurrectionId = req.params.insurrectionId as string;
    const { vote } = req.body; // Esperamos 'for' o 'against'

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    if (vote !== 'for' && vote !== 'against') {
      res.status(400).json({ message: 'El voto debe ser "for" (a favor) o "against" (en contra).' });
      return;
    }

    const updatedInsurrection = await castVoteService(insurrectionId, userId, vote);

    res.status(200).json({
      message: 'Voto registrado correctamente.',
      data: updatedInsurrection
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al registrar el voto.' });
  }
};

export const getActiveInsurrection = async (req: Request, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const activeInsurrection = await getActiveInsurrectionService(communityId);

    if (!activeInsurrection) {
      res.status(200).json({
        message: 'No hay insurrecciones activas en este universo.',
        data: null
      });
      return;
    }

    res.status(200).json({
      message: 'Insurrección activa encontrada.',
      data: activeInsurrection
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al buscar insurrecciones.' });
  }
};

export const acceptRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const insurrectionId = req.params.insurrectionId as string;

    if (!userId) { res.status(401).json({ message: 'No autenticado.' }); return; }
    if (!insurrectionId) { res.status(400).json({ message: 'ID obligatorio.' }); return; }

    const result = await acceptRoleService(insurrectionId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al aceptar el cargo.' });
  }
};

export const rejectRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const insurrectionId = req.params.insurrectionId as string;

    if (!userId) { res.status(401).json({ message: 'No autenticado.' }); return; }
    if (!insurrectionId) { res.status(400).json({ message: 'ID obligatorio.' }); return; }

    const result = await rejectRoleService(insurrectionId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al rechazar el cargo.' });
  }
};