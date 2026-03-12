import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UserModel } from '../modules/users/user.model';

export const requireGlobalRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      // Consultamos súper rápido solo el rol del usuario
      const user = await UserModel.findById(userId).select('globalRole').lean();

      if (!user) {
        res.status(403).json({ message: 'Usuario no encontrado' });
        return;
      }

      if (!allowedRoles.includes(user.globalRole)) {
        res.status(403).json({ 
          message: 'ACCESO DENEGADO: Se requieren privilegios de administración global (Team Legacy) para esta acción.' 
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error al verificar los permisos globales' });
    }
  };
};