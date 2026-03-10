import { CommunityModel } from '../communities/community.model';
import { CommunityMemberModel } from './community-member.model';
import { CommunityRole } from '../../middlewares/community-role.middleware';

interface JoinCommunityDTO {
  userId: string;
  communityId: string;
  nickname: string;
}

export const joinCommunityService = async (data: JoinCommunityDTO) => {
  const community = await CommunityModel.findById(data.communityId);
  if (!community) {
    throw new Error('La comunidad a la que intentas unirte no existe');
  }

  const existingMember = await CommunityMemberModel.findOne({
    userId: data.userId,
    communityId: data.communityId
  });

  if (existingMember) {
    throw new Error('Ya eres miembro de esta comunidad');
  }

  const newMember = await CommunityMemberModel.create({
    userId: data.userId,
    communityId: data.communityId,
    nickname: data.nickname,
    role: 'member',
    roleplayData: {} 
  });

  return newMember;
};

export const getUserCommunitiesService = async (userId: string) => {
  const memberships = await CommunityMemberModel.find({ userId })
    .populate('communityId', 'name description avatar banner')
    .sort({ createdAt: -1 }); 

  return memberships;
};

interface UpdateCommunityProfileDTO {
  nickname?: string;
  avatar?: string;
  role?: string;
  bio?: string; 
}

export const updateCommunityProfileService = async (userId: string, communityId: string, data: UpdateCommunityProfileDTO) => {
  const updatedMember = await CommunityMemberModel.findOneAndUpdate(
    { userId, communityId },
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
  const targetMember = await CommunityMemberModel.findOne({ userId: targetUserId, communityId });
  
  if (!targetMember) {
    throw new Error('El usuario no es miembro de esta comunidad');
  }

  if (targetMember.role === 'owner') {
    throw new Error('No puedes modificar el rol del agente de la comunidad');
  }

  if (requesterRole === 'admin') {
    if (newRole === 'admin' || newRole === 'owner') {
      throw new Error('Los líderes solo pueden nombrar o degradar moderadores');
    }
    if (targetMember.role === 'admin') {
      throw new Error('Un líder no puede modificar el rol de otro líder');
    }
  }

  targetMember.role = newRole;
  await targetMember.save();

  return targetMember;
};

// --- FUNCIONES DE MODERACIÓN DE USUARIOS ---

export const toggleHideProfileService = async (communityId: string, targetUserId: string, hide: boolean) => {
  const member = await CommunityMemberModel.findOne({ userId: targetUserId, communityId });
  if (!member) throw new Error('El usuario no es miembro de la comunidad');
  
  if (member.role === 'owner') throw new Error('No puedes ocultar el perfil del creador');

  member.isHidden = hide;
  await member.save();
  return member;
};

export const kickMemberService = async (communityId: string, targetUserId: string) => {
  const member = await CommunityMemberModel.findOne({ userId: targetUserId, communityId });
  if (!member) throw new Error('El usuario no es miembro de la comunidad');
  
  if (member.role === 'owner') throw new Error('No puedes expulsar al creador');
  if (member.role === 'admin') throw new Error('Los líderes no pueden ser expulsados, deben ser degradados primero');

  await CommunityMemberModel.findByIdAndDelete(member._id);
  return { message: 'Usuario expulsado de la comunidad' };
};

export const leaveCommunityService = async (communityId: string, userId: string) => {
  const member = await CommunityMemberModel.findOne({ communityId, userId });
  
  if (!member) {
    throw new Error('No eres miembro de esta comunidad');
  }

  if (member.role === 'owner') {
    throw new Error('El creador no puede abandonar la comunidad. Debes transferir el liderazgo o eliminarla por completo.');
  }

  await member.deleteOne();
  return { message: 'Has abandonado la comunidad exitosamente' };
};