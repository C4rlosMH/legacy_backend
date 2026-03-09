import { Request, Response } from 'express';
import { getUserCommunitiesService, joinCommunityService, updateCommunityProfileService, 
  updateMemberRoleService, toggleHideProfileService, kickMemberService
} from './community-member.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CommunityRole } from '../../middlewares/community-role.middleware';

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

export const updateCommunityProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const communityId = req.params.communityId as string;
    const { nickname, avatar, role, bio } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const updatedProfile = await updateCommunityProfileService(userId, communityId, {
      nickname,
      avatar,
      role,
      bio
    });

    res.status(200).json({
      message: 'Perfil de comunidad actualizado exitosamente',
      profile: updatedProfile
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al actualizar el perfil de la comunidad' });
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const targetUserId = req.params.targetUserId as string;
    const { newRole } = req.body; 

    // Extraemos el rol de la persona que está ejecutando la acción (inyectado por el middleware)
    const requesterRole = req.communityMembership.role as CommunityRole;

    if (!newRole || !['admin', 'moderator', 'member'].includes(newRole)) {
      res.status(400).json({ message: 'Rol inválido. Debe ser admin, moderator o member' });
      return;
    }

    const updatedMember = await updateMemberRoleService(
      communityId,
      targetUserId,
      newRole as CommunityRole,
      requesterRole
    );

    res.status(200).json({
      message: `Rol actualizado exitosamente a ${newRole}`,
      member: updatedMember
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al actualizar el rol' });
  }
};

export const toggleHideProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Forzamos el tipado a string individualmente
    const communityId = req.params.communityId as string;
    const targetUserId = req.params.targetUserId as string;
    const { hide } = req.body; 

    if (typeof hide !== 'boolean') {
      res.status(400).json({ message: 'El campo hide debe ser un booleano (true o false)' });
      return;
    }

    const member = await toggleHideProfileService(communityId, targetUserId, hide);
    res.status(200).json({ message: `Perfil ${hide ? 'ocultado' : 'visible'} con éxito`, member });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al actualizar la visibilidad del perfil' });
  }
};

export const kickMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Forzamos el tipado a string individualmente
    const communityId = req.params.communityId as string;
    const targetUserId = req.params.targetUserId as string;
    
    const result = await kickMemberService(communityId, targetUserId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al expulsar al usuario' });
  }
};