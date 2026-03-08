import { CommunityModel } from './community.model';
import { CommunityMemberModel } from '../community-members/community-member.model';

interface CreateCommunityDTO {
  name: string;
  description: string;
  ownerId: string;
  ownerNickname: string;
}

export const createCommunityService = async (data: CreateCommunityDTO) => {
  // 1. Validar que el nombre no exista (los nombres de universos suelen ser únicos)
  const existingCommunity = await CommunityModel.findOne({ name: data.name });
  if (existingCommunity) {
    throw new Error('Ya existe una comunidad con este nombre');
  }

  // 2. Crear la comunidad
  const newCommunity = await CommunityModel.create({
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
  });

  // 3. Crear automáticamente el perfil del Líder Agente (Owner) dentro de este universo
  await CommunityMemberModel.create({
    userId: data.ownerId,
    communityId: newCommunity._id,
    nickname: data.ownerNickname,
    role: 'owner',
    roleplayData: {} // Inicializamos vacío
  });

  return newCommunity;
};