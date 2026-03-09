import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from './user.model';
import { config } from '../../config';

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