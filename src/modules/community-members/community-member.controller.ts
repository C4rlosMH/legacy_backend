import { Request, Response } from 'express';
import { getUserCommunitiesService, joinCommunityService, updateCommunityProfileService, 
  updateMemberRoleService, toggleHideProfileService, kickMemberService, leaveCommunityService,
  getPendingRequestsService, processJoinRequestService, unbanMemberService, issueStrikeService, getCommunityMembersService,
} from './community-member.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CommunityRole } from '../../middlewares/community-role.middleware';

export const joinCommunity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string; 
    const { userId, nickname, message } = req.body; // Añadido message

    if (!communityId || typeof communityId !== 'string') {
      res.status(400).json({ message: 'El ID de la comunidad no es válido o está ausente' });
      return;
    }

    if (!userId || !nickname) {
      res.status(400).json({ message: 'El userId y el apodo son obligatorios para unirte' });
      return;
    }

    const result = await joinCommunityService({
      userId,
      communityId,
      nickname,
      message
    });

    res.status(result.type === 'member' ? 201 : 200).json({
      message: result.message,
      data: result.data // Puede ser el memberProfile o el request
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al unirse a la comunidad' });
  }
};

export const getPendingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const requests = await getPendingRequestsService(communityId);
    
    res.status(200).json({ requests });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener las solicitudes' });
  }
};

export const processJoinRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const requestId = req.params.requestId as string;
    const { action } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      res.status(400).json({ message: 'Acción no válida. Debe ser approved o rejected' });
      return;
    }

    const result = await processJoinRequestService(requestId, communityId, action as 'approved' | 'rejected');
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al procesar la solicitud' });
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
    const moderatorId = req.user?.id;
    const communityId = req.params.communityId as string;
    const targetUserId = req.params.targetUserId as string;
    const { hide, hours } = req.body; 

    if (!moderatorId) { res.status(401).json({ message: 'No autenticado' }); return; }
    if (typeof hide !== 'boolean') {
      res.status(400).json({ message: 'El campo hide debe ser un booleano (true o false)' });
      return;
    }

    const member = await toggleHideProfileService(communityId, targetUserId, moderatorId, hide, hours);
    res.status(200).json({ message: `Perfil ${hide ? 'ocultado' : 'visible'} con éxito`, member });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al actualizar la visibilidad del perfil' });
  }
};

export const kickMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moderatorId = req.user?.id;
    const communityId = req.params.communityId as string;
    const targetUserId = req.params.targetUserId as string;
    const { reason } = req.body; // El mod puede enviar una razón opcional
    
    if (!moderatorId) { res.status(401).json({ message: 'No autenticado' }); return; }

    const result = await kickMemberService(communityId, targetUserId, moderatorId, reason);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al expulsar al usuario' });
  }
};

export const leaveCommunity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const communityId = req.params.communityId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await leaveCommunityService(communityId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al abandonar la comunidad' });
  }
};

export const unbanMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moderatorId = req.user?.id;
    const communityId = req.params.communityId as string;
    const targetUserId = req.params.targetUserId as string;
    
    if (!moderatorId) { res.status(401).json({ message: 'No autenticado' }); return; }

    const result = await unbanMemberService(communityId, targetUserId, moderatorId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al remover el veto del usuario' });
  }
};

export const issueStrike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moderatorId = req.user?.id;
    const communityId = req.params.communityId as string;
    const targetUserId = req.params.targetUserId as string;
    const { reason } = req.body;

    if (!moderatorId) { res.status(401).json({ message: 'No autenticado' }); return; }
    if (!reason) { res.status(400).json({ message: 'Debes proporcionar un motivo para la advertencia.' }); return; }

    const result = await issueStrikeService(communityId, targetUserId, moderatorId, reason);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al aplicar la falta' });
  }
};

export const getCommunityMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    
    if (!communityId) {
      res.status(400).json({ message: 'ID de comunidad requerido' });
      return;
    }

    const members = await getCommunityMembersService(communityId);
    
    res.status(200).json({ members });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener la lista de miembros' });
  }
};