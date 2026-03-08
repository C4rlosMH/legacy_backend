import { Request, Response } from 'express';
import { getUserCommunitiesService, joinCommunityService } from './community-member.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const joinCommunity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Extraemos el communityId y le decimos explícitamente a TypeScript que lo trate como string
    const communityId = req.params.communityId as string; 
    const { userId, nickname } = req.body;

    // 2. Validamos que tengamos todos los datos y que tengan el formato correcto
    if (!communityId || typeof communityId !== 'string') {
      res.status(400).json({ message: 'El ID de la comunidad no es válido o está ausente' });
      return;
    }

    if (!userId || !nickname) {
      res.status(400).json({ message: 'El userId y el apodo son obligatorios para unirte' });
      return;
    }

    const newMember = await joinCommunityService({
      userId,
      communityId,
      nickname
    });

    res.status(201).json({
      message: 'Te has unido a la comunidad exitosamente',
      memberProfile: newMember
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al unirse a la comunidad' });
  }
};

export const getUserCommunities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // El ID viene garantizado por el verifyToken
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const memberships = await getUserCommunitiesService(userId);

    res.status(200).json({
      message: 'Comunidades del usuario obtenidas exitosamente',
      // Devolvemos el arreglo de membresías (que ya incluye los datos de la comunidad)
      communities: memberships 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener las comunidades' });
  }
};