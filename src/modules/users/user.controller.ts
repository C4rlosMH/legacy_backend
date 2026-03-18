import { Request, Response } from 'express';
import { 
  createUserService, loginUserService, getUserProfileService, forgotPasswordService,
  updateGlobalProfileService, deleteUserAccountService, resetPasswordService, verifyEmailService,
  blockUserService, unblockUserService, banGlobalUserService, unbanGlobalUserService, getMyProfileService, searchUsersService
} from './user.service';
import { config } from '../../config'; 
import { AuthRequest } from '../../middlewares/auth.middleware';

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
      ...authData 
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Error al iniciar sesión' });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = req.params.username as string;
    const profile = await getUserProfileService(username);
    res.status(200).json({ profile });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateGlobalProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, avatar, banner, bio } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const updatedProfile = await updateGlobalProfileService(userId, { name, avatar, banner, bio });
    
    res.status(200).json({
      message: 'Perfil global actualizado exitosamente',
      profile: updatedProfile
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al actualizar el perfil global' });
  }
};

export const deleteUserAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await deleteUserAccountService(userId);
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al eliminar la cuenta' });
  }
};

// ==========================================
// CONTROLADORES DE SEGURIDAD (SPRINT 1)
// ==========================================

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      res.status(400).json({ message: 'El correo electrónico y el código de verificación son obligatorios.' });
      return;
    }

    const result = await verifyEmailService(email, token);
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al verificar el correo electrónico.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'El correo electrónico es obligatorio.' });
      return;
    }

    const result = await forgotPasswordService(email);
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al procesar la solicitud de recuperación.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      res.status(400).json({ message: 'Faltan datos obligatorios (correo, código o nueva contraseña).' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const result = await resetPasswordService(email, token, newPassword);
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al restablecer la contraseña.' });
  }
};

export const blockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const targetUserId = req.params.targetUserId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await blockUserService(userId, targetUserId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al bloquear al usuario' });
  }
};

export const unblockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const targetUserId = req.params.targetUserId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await unblockUserService(userId, targetUserId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al desbloquear al usuario' });
  }
};

export const banGlobalUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const targetUserId = req.params.targetUserId as string;
    const { reason } = req.body;

    if (!adminId) { res.status(401).json({ message: 'No autenticado' }); return; }
    if (!reason) { res.status(400).json({ message: 'Debe proveer una razón para el baneo global' }); return; }

    const result = await banGlobalUserService(adminId, targetUserId, reason);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(403).json({ message: error.message || 'Error al ejecutar el baneo global' });
  }
};

export const unbanGlobalUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const targetUserId = req.params.targetUserId as string;

    if (!adminId) { res.status(401).json({ message: 'No autenticado' }); return; }

    const result = await unbanGlobalUserService(adminId, targetUserId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(403).json({ message: error.message || 'Error al revertir el baneo global' });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const profile = await getMyProfileService(userId);
    res.status(200).json({ profile });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    const users = await searchUsersService(query);
    res.status(200).json({ users });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};