import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// 1. Extendemos la interfaz Request para que TypeScript acepte req.user
export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// 2. Creamos el middleware
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Acceso denegado. Token no proporcionado o formato inválido.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Nueva validación: Nos aseguramos de que el token exista y no sea undefined
    if (!token) {
      res.status(401).json({ message: 'Acceso denegado. El token está vacío.' });
      return;
    }

    // Al haber pasado el if anterior, TypeScript ya sabe que 'token' es 100% un string
    const decoded = jwt.verify(token, config.security.jwtSecret as string) as jwt.JwtPayload;

    req.user = { id: decoded.id as string };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado. Inicia sesión nuevamente.' });
  }
};