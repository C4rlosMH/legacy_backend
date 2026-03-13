import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { CommunityMemberModel } from '../modules/community-members/community-member.model';

/**
 * Middleware para restringir acciones según el nivel del miembro en el mundo.
 * @param minLevel Nivel mínimo requerido.
 */
export const requireLevel = (minLevel: number) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      // Extraemos el contexto (puede venir en el body al crear, o en query al buscar)
      const context = req.body.context || req.query.context;

      // CORRECCIÓN: Si el usuario está publicando en el Global (Threads), 
      // ignoramos la barrera de nivel, ya que los niveles son solo para los universos.
      if (context === 'global_thread') {
        next();
        return;
      }

      // El communityId puede venir en params (rutas de mundo) o en body (creación de posts)
      const communityId = req.params.communityId || req.body.communityId;

      if (!userId || !communityId) {
        res.status(400).json({ message: 'Falta información de usuario o comunidad para validar nivel' });
        return;
      }

      const member = await CommunityMemberModel.findOne({ userId, communityId });

      if (!member) {
        res.status(403).json({ message: 'No eres miembro de este mundo' });
        return;
      }

      if (member.level < minLevel) {
        res.status(403).json({ 
          message: `Nivel insuficiente. Esta acción requiere nivel ${minLevel}, tu nivel actual es ${member.level}.` 
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error al validar nivel de membresía' });
    }
  };
};