import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../modules/users/user.model';
import { config } from '../config';

// 1. Extendemos la interfaz Request para que TypeScript acepte req.user
export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
  communityMembership?: any; // ESTA ES LA LÍNEA NUEVA
}

// 2. Creamos el middleware
export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Acceso denegado. El token está vacío.' });
      return;
    }

    const decoded = jwt.verify(token, config.security.jwtSecret as string) as jwt.JwtPayload;

    // VERIFICACIÓN DE BANEO GLOBAL
    // Usamos lean() y select() para que la consulta a la BD sea extremadamente rápida
    const userStatus = await UserModel.findById(decoded.id).select('accountStatus').lean();

    if (!userStatus) {
      res.status(401).json({ message: 'La cuenta asociada a este token ya no existe.' });
      return;
    }

    if (userStatus.accountStatus === 'banned') {
      res.status(403).json({ 
        message: 'ACCESO DENEGADO: Tu cuenta de Legacy ha sido suspendida permanentemente por violar los Términos de Servicio.' 
      });
      return;
    }

    req.user = { id: decoded.id as string };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado. Inicia sesión nuevamente.' });
  }
};