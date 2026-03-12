import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from './user.model';
import { AuthTokenModel } from './auth-token.model';
import { config } from '../../config';
import { CommunityModel } from '../communities/community.model';
import { CommunityMemberModel } from '../community-members/community-member.model';
import { PostModel } from '../posts/post.model';
import { CommentModel } from '../comments/comment.model';
import { WikiModel } from '../wikis/wiki.model';
import { LikeModel } from '../likes/like.model';
import { MessageModel } from '../chats/messege.model';
import { ChatModel } from '../chats/chat.model';
import { NotificationModel } from '../notifications/notification.model';

export const createUserService = async (userData: any) => {
  const existingUser = await UserModel.findOne({
    $or: [{ email: userData.email }, { username: userData.username }]
  });

  if (existingUser) {
    throw new Error('El correo electrónico o el nombre de usuario ya están en uso');
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const newUser = await UserModel.create({
    name: userData.name,
    username: userData.username,
    email: userData.email,
    passwordHash: hashedPassword,
  });

  // ==========================================
  // NUEVO: Generar token de verificación de email
  // ==========================================
  // Generamos un código numérico de 6 dígitos
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // El código expirará en 24 horas
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await AuthTokenModel.create({
    userId: newUser._id,
    token: verificationCode,
    type: 'email_verification',
    expiresAt
  });

  // Aquí en el futuro conectarás SendGrid, AWS SES o Nodemailer.
  // Por ahora lo imprimimos en consola para desarrollo.
  console.log(`[MAILER SIMULATION] Enviar correo a ${newUser.email} con el código de verificación: ${verificationCode}`);

  return newUser;
};

interface LoginUserDTO {
  email: string;
  password: string;
}

export const loginUserService = async (data: LoginUserDTO) => {
  const user = await UserModel.findOne({ email: data.email });
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Credenciales inválidas'); 
  }

  const token = jwt.sign(
      { id: user._id }, 
      config.security.jwtSecret as string, 
      { expiresIn: config.security.jwtExpiresIn as any } 
    );

  return {
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    },
    token
  };
};

export const getUserProfileService = async (username: string) => {
  const user = await UserModel.findOne({ username }).select('-passwordHash -email');
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};

interface UpdateGlobalProfileDTO {
  name?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
}

export const updateGlobalProfileService = async (userId: string, data: UpdateGlobalProfileDTO) => {
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: data }, 
    { new: true, runValidators: true }
  ).select('-passwordHash'); 

  if (!updatedUser) {
    throw new Error('Usuario no encontrado');
  }

  return updatedUser;
};

export const deleteUserAccountService = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('El usuario no existe');
  }

  // 1. REGLA DE SEGURIDAD: Verificar si es dueño de alguna comunidad
  const ownedCommunities = await CommunityModel.findOne({ ownerId: userId });
  if (ownedCommunities) {
    throw new Error('No puedes eliminar tu cuenta porque eres el Líder Agente de una o más comunidades. Por favor, elimina la comunidad o transfiere el liderazgo antes de continuar.');
  }

  // 2. BORRADO EN CASCADA
  await Promise.all([
    // Borrar membresías de todas las comunidades
    CommunityMemberModel.deleteMany({ userId }),
    
    // Borrar publicaciones globales y de comunidades
    PostModel.deleteMany({ authorId: userId }),
    
    // Borrar comentarios
    CommentModel.deleteMany({ authorId: userId }),
    
    // Borrar las wikis originales del usuario (Las Copias Doradas isOfficial: true permanecen intactas en el universo)
    WikiModel.deleteMany({ authorId: userId, isOfficial: false }),
    
    // Borrar likes
    LikeModel.deleteMany({ userId }),
    
    // Borrar mensajes enviados en chats
    MessageModel.deleteMany({ senderId: userId }),
    
    // Borrar notificaciones donde sea remitente o destinatario
    NotificationModel.deleteMany({ 
      $or: [{ recipientId: userId }, { senderId: userId }] 
    }),

    // Sacar al usuario de todos los arreglos de participantes en los chats
    ChatModel.updateMany(
      { participants: userId },
      { $pull: { participants: userId } }
    ),

    // Finalmente, borrar la cuenta global
    user.deleteOne()
  ]);

  return { message: 'Tu cuenta de Legacy y todos tus datos personales han sido eliminados para siempre.' };
};

// ==========================================
// SERVICIOS DE SEGURIDAD (SPRINT 1)
// ==========================================

export const verifyEmailService = async (email: string, token: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error('Usuario no encontrado');

  if (user.isEmailVerified) throw new Error('El correo ya ha sido verificado');

  const authToken = await AuthTokenModel.findOne({
    userId: user._id,
    token,
    type: 'email_verification'
  });

  if (!authToken) throw new Error('Código de verificación inválido o expirado');

  user.isEmailVerified = true;
  await user.save();

  // Borramos el token para que no se pueda reusar
  await authToken.deleteOne();

  return { message: 'Correo electrónico verificado exitosamente. Ya puedes acceder a todas las funciones de Legacy.' };
};

export const forgotPasswordService = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    // Por seguridad, no revelamos si el correo existe o no a un posible atacante
    return { message: 'Si el correo está registrado, recibirás un código de recuperación pronto.' };
  }

  // Generamos un código de 6 dígitos
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Este token es crítico, expira en solo 15 minutos
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  // Borramos cualquier token previo de recuperación para este usuario
  await AuthTokenModel.deleteMany({ userId: user._id, type: 'password_reset' });

  await AuthTokenModel.create({
    userId: user._id,
    token: resetToken,
    type: 'password_reset',
    expiresAt
  });

  console.log(`[MAILER SIMULATION] Enviar correo de recuperación a ${user.email} con el código: ${resetToken}`);

  return { message: 'Si el correo está registrado, recibirás un código de recuperación pronto.' };
};

export const resetPasswordService = async (email: string, token: string, newPassword: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error('Usuario no encontrado');

  const authToken = await AuthTokenModel.findOne({
    userId: user._id,
    token,
    type: 'password_reset'
  });

  if (!authToken) throw new Error('Código de recuperación inválido o expirado');

  // Encriptamos la nueva contraseña
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.passwordHash = hashedPassword;
  await user.save();

  await authToken.deleteOne();

  return { message: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.' };
};

// ==========================================
// SISTEMA DE BLOQUEO (SPRINT 1)
// ==========================================

export const blockUserService = async (userId: string, targetUserId: string) => {
  if (userId === targetUserId) {
    throw new Error('No puedes bloquearte a ti mismo.');
  }

  const user = await UserModel.findById(userId);
  const targetUser = await UserModel.findById(targetUserId);

  if (!user || !targetUser) {
    throw new Error('Usuario no encontrado.');
  }

  // Verificamos si ya está bloqueado
  if (user.blockedUsers && user.blockedUsers.includes(targetUser._id as any)) {
    throw new Error('Este usuario ya se encuentra bloqueado.');
  }

  // Agregamos el ID al arreglo de bloqueados
  user.blockedUsers.push(targetUser._id as any);
  await user.save();

  return { message: `Has bloqueado a ${targetUser.username}. Ya no podrá enviarte mensajes ni comentar en tu muro.` };
};

export const unblockUserService = async (userId: string, targetUserId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error('Usuario no encontrado.');

  // Filtramos el arreglo para remover el ID del usuario objetivo
  user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetUserId);
  await user.save();

  return { message: 'Usuario desbloqueado exitosamente.' };
};

// ==========================================
// MODERACIÓN GLOBAL (TEAM LEGACY / SENTINEL)
// ==========================================

export const banGlobalUserService = async (adminId: string, targetUserId: string, reason: string) => {
  const admin = await UserModel.findById(adminId);
  if (!admin || admin.globalRole !== 'system') {
    throw new Error('No tienes autorización de nivel Sistema para ejecutar esta acción.');
  }

  const targetUser = await UserModel.findById(targetUserId);
  if (!targetUser) throw new Error('El usuario objetivo no existe.');

  if (targetUser.globalRole === 'system') {
    throw new Error('Protocolo denegado: No se puede suspender una cuenta del sistema.');
  }

  targetUser.accountStatus = 'banned';
  targetUser.banReason = reason;
  await targetUser.save();

  // Opcional en el futuro: Aquí podrías disparar un email al usuario informando de su baneo.

  return { message: `La cuenta de ${targetUser.username} ha sido suspendida permanentemente de Legacy.` };
};

export const unbanGlobalUserService = async (adminId: string, targetUserId: string) => {
  const admin = await UserModel.findById(adminId);
  if (!admin || admin.globalRole !== 'system') {
    throw new Error('No tienes autorización de nivel Sistema para ejecutar esta acción.');
  }

  const targetUser = await UserModel.findById(targetUserId);
  if (!targetUser) throw new Error('El usuario objetivo no existe.');

  targetUser.accountStatus = 'active';
  targetUser.banReason = undefined;
  await targetUser.save();

  return { message: `La cuenta de ${targetUser.username} ha sido restaurada.` };
};