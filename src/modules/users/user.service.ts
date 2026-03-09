import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from './user.model';
import { config } from '../../config';

export const createUserService = async (userData: any) => {
  // 1. Verificar si el usuario o email ya existen para evitar duplicados
  const existingUser = await UserModel.findOne({
    $or: [{ email: userData.email }, { username: userData.username }]
  });

  if (existingUser) {
    throw new Error('El correo electrónico o el nombre de usuario ya están en uso');
  }

  // 2. Encriptar la contraseña
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  // 3. Guardar el nuevo usuario en la base de datos
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
  // 1. Buscar al usuario por email
  const user = await UserModel.findOne({ email: data.email });
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  // 2. Verificar la contraseña usando bcrypt
  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Credenciales inválidas'); // Usamos el mismo mensaje por seguridad
  }

  // 3. Generar el Token JWT
  // Guardamos el ID del usuario dentro del token (el payload)
  const token = jwt.sign(
      { id: user._id }, 
      config.security.jwtSecret as string, 
      { expiresIn: config.security.jwtExpiresIn as any } // <-- El cambio clave está aquí
    );

  // 4. Retornar los datos del usuario (sin el hash de la contraseña) y el token
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
  // Buscamos por username (ideal para URLs limpias como legacy.app/user/juanperez)
  // Usamos .select() para evitar enviar datos sensibles como el passwordHash o el email al público
  const user = await UserModel.findOne({ username }).select('-passwordHash -email');
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};

interface UpdateGlobalProfileDTO {
  name?: string;
  avatar?: string;
  banner?: string;
  bio?: string; // Biografía global
}

export const updateGlobalProfileService = async (userId: string, data: UpdateGlobalProfileDTO) => {
  // Usamos findByIdAndUpdate con { new: true } para que nos devuelva el documento ya actualizado
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: data }, // $set solo actualiza los campos que enviemos, ignorando los demás
    { new: true, runValidators: true }
  ).select('-passwordHash'); // Excluimos la contraseña por seguridad

  if (!updatedUser) {
    throw new Error('Usuario no encontrado');
  }

  return updatedUser;
};