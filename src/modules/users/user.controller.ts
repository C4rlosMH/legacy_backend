import { Request, Response } from 'express';
import { createUserService, loginUserService } from './user.service';
import { config } from '../../config'; // Importamos la configuración central

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      res.status(400).json({ message: 'Todos los campos son obligatorios' });
      return;
    }

    const newUser = await createUserService({ name, username, email, password });

    res.status(201).json({
      message: `Usuario creado exitosamente en ${config.app.name}`,
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al registrar el usuario' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'El correo y la contraseña son obligatorios' });
      return;
    }

    const authData = await loginUserService({ email, password });

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      ...authData // Desestructuramos para enviar { message, user, token }
    });
  } catch (error: any) {
    // Retornamos 401 Unauthorized para errores de autenticación
    res.status(401).json({ message: error.message || 'Error al iniciar sesión' });
  }
};