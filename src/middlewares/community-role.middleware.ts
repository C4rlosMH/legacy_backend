import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { CommunityMemberModel } from '../modules/community-members/community-member.model';

// Definimos los roles exactos que existen en la plataforma
export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'member';

export const requireCommunityRole = (allowedRoles: CommunityRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      // Asumimos que la ruta siempre tendrá el ID de la comunidad en los parámetros
      // Por ejemplo: DELETE /api/v1/communities/:communityId/posts/:postId
      const communityId = req.params.communityId || req.body.communityId;

      if (!userId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      if (!communityId) {
        res.status(400).json({ message: 'Falta el ID de la comunidad en la petición' });
        return;
      }

      // Buscamos la membresía del usuario en este universo específico
      const membership = await CommunityMemberModel.findOne({
        userId,
        communityId
      });

      if (!membership) {
        res.status(403).json({ message: 'No eres miembro de esta comunidad' });
        return;
      }

      // Verificamos si el rol del usuario está en la lista de roles permitidos
      if (!allowedRoles.includes(membership.role as CommunityRole)) {
        res.status(403).json({ 
          message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
        });
        return;
      }

      // Si tiene el rol adecuado, agregamos su membresía a la request por si el controlador la necesita
      // y lo dejamos pasar a la siguiente función
      req.communityMembership = membership;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error al verificar los permisos en la comunidad' });
    }
  };
};