import { CommunityModel } from '../communities/community.model';
import { CommunityMemberModel } from './community-member.model';
import { CommunityRole } from '../../middlewares/community-role.middleware';

interface JoinCommunityDTO {
  userId: string;
  communityId: string;
  nickname: string;
}

export const joinCommunityService = async (data: JoinCommunityDTO) => {
  // 1. Verificar si la comunidad realmente existe
  const community = await CommunityModel.findById(data.communityId);
  if (!community) {
    throw new Error('La comunidad a la que intentas unirte no existe');
  }

  // 2. Verificar si el usuario ya es miembro
  const existingMember = await CommunityMemberModel.findOne({
    userId: data.userId,
    communityId: data.communityId
  });

  if (existingMember) {
    throw new Error('Ya eres miembro de esta comunidad');
  }

  // 3. Crear el perfil del usuario en este universo
  const newMember = await CommunityMemberModel.create({
    userId: data.userId,
    communityId: data.communityId,
    nickname: data.nickname,
    role: 'member', // Por defecto, todos entran como miembros base
    roleplayData: {} 
  });

  return newMember;
};

export const getUserCommunitiesService = async (userId: string) => {
  // Buscamos todas las membresías de este usuario
  const memberships = await CommunityMemberModel.find({ userId })
    // Poblamos el campo communityId para traer los datos reales de la comunidad
    .populate('communityId', 'name description avatar banner')
    // Ordenamos para mostrar primero a las que se unió más recientemente
    .sort({ joinedAt: -1 }); 

  return memberships;
};

interface UpdateCommunityProfileDTO {
  nickname?: string;
  avatar?: string;
  role?: string; // Por si a futuro quieres manejar rangos o roles de roleplay
  bio?: string; // Biografía específica para este universo
}

export const updateCommunityProfileService = async (userId: string, communityId: string, data: UpdateCommunityProfileDTO) => {
  const updatedMember = await CommunityMemberModel.findOneAndUpdate(
    { userId, communityId }, // Buscamos el perfil exacto de este usuario en este universo
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!updatedMember) {
    throw new Error('No eres miembro de esta comunidad o el perfil no existe');
  }

  return updatedMember;
};

export const updateMemberRoleService = async (
  communityId: string, 
  targetUserId: string, 
  newRole: CommunityRole, 
  requesterRole: CommunityRole
) => {
  // 1. Buscamos al usuario al que se le va a cambiar el rol
  const targetMember = await CommunityMemberModel.findOne({ userId: targetUserId, communityId });
  
  if (!targetMember) {
    throw new Error('El usuario no es miembro de esta comunidad');
  }

  // 2. Regla intocable: Nadie puede modificar el rol del Agente Creador por esta vía
  if (targetMember.role === 'owner') {
    throw new Error('No puedes modificar el rol del agente de la comunidad');
  }

  // 3. Reglas específicas para el Admin (Líder)
  if (requesterRole === 'admin') {
    // Un admin no puede ascender a alguien a admin ni a owner
    if (newRole === 'admin' || newRole === 'owner') {
      throw new Error('Los líderes solo pueden nombrar o degradar moderadores');
    }
    // Un admin no puede degradar a otro admin
    if (targetMember.role === 'admin') {
      throw new Error('Un líder no puede modificar el rol de otro líder');
    }
  }

  // 4. Si pasó todas las validaciones de seguridad, aplicamos el nuevo rol
  targetMember.role = newRole;
  await targetMember.save();

  return targetMember;
};