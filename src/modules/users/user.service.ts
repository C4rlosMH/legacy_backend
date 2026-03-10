import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from './user.model';
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