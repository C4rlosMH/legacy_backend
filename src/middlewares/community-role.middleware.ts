import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { CommunityMemberModel } from '../modules/community-members/community-member.model';

export type CommunityRole = 'system' | 'owner' | 'admin' | 'moderator' | 'member';

export const requireCommunityRole = (allowedRoles: CommunityRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const communityId = req.params.communityId || req.body.communityId;

      if (!userId) { res.status(401).json({ message: 'Usuario no autenticado' }); return; }
      if (!communityId) { res.status(400).json({ message: 'Falta el ID de la comunidad' }); return; }

      const membership = await CommunityMemberModel.findOne({ userId, communityId });

      if (!membership) {
        res.status(403).json({ message: 'No eres miembro de esta comunidad' });
        return;
      }

      // LA MAGIA: Si el rol es 'system', ignoramos allowedRoles y lo dejamos pasar automáticamente
      if (membership.role === 'system') {
        req.communityMembership = membership;
        return next();
      }

      if (!allowedRoles.includes(membership.role as CommunityRole)) {
        res.status(403).json({ 
          message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
        });
        return;
      }

      req.communityMembership = membership;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error al verificar los permisos en la comunidad' });
    }
  };
};