import { CommunityModel } from '../communities/community.model';
import { CommunityMemberModel } from './community-member.model';
import { CommunityRole } from '../../middlewares/community-role.middleware';
import { CommunityRequestModel } from './community-request.model';
import { getLevelFromXP } from '../../utils/level.util';

interface JoinCommunityDTO {
  userId: string;
  communityId: string;
  nickname: string;
  message?: string; 
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

  // LÓGICA DE PRIVACIDAD
  if (community.visibility === 'private') {
    // Verificamos si ya tiene una solicitud pendiente
    const pendingRequest = await CommunityRequestModel.findOne({
      userId: data.userId,
      communityId: data.communityId,
      status: 'pending'
    });

    if (pendingRequest) {
      throw new Error('Ya tienes una solicitud pendiente para entrar a esta comunidad');
    }

    // Creamos la solicitud en lugar del perfil de miembro
    const newRequest = await CommunityRequestModel.create({
      userId: data.userId,
      communityId: data.communityId,
      nickname: data.nickname,
      message: data.message || '',
      status: 'pending'
    });

    return { type: 'request', data: newRequest, message: 'Solicitud enviada al staff para su revisión' };
  }

  // Si es pública o no listada, entra directo
  const newMember = await CommunityMemberModel.create({
    userId: data.userId,
    communityId: data.communityId,
    nickname: data.nickname,
    role: 'member',
    roleplayData: {} 
  });

  return { type: 'member', data: newMember, message: 'Te has unido a la comunidad exitosamente' };
};

export const getPendingRequestsService = async (communityId: string) => {
  const requests = await CommunityRequestModel.find({ communityId, status: 'pending' })
    .populate('userId', 'name username avatar') // Para que el staff vea quién es
    .sort({ createdAt: 1 }); // Las más antiguas primero

  return requests;
};

export const processJoinRequestService = async (requestId: string, communityId: string, action: 'approved' | 'rejected') => {
  const request = await CommunityRequestModel.findOne({ _id: requestId, communityId, status: 'pending' });
  
  if (!request) {
    throw new Error('La solicitud no existe o ya fue procesada');
  }

  request.status = action;
  await request.save();

  if (action === 'approved') {
    // Si aprueban, creamos el perfil de miembro usando los datos de la solicitud
    const newMember = await CommunityMemberModel.create({
      userId: request.userId,
      communityId: request.communityId,
      nickname: request.nickname,
      role: 'member',
      roleplayData: {}
    });

    return { message: 'Solicitud aprobada, el usuario ha sido añadido a la comunidad', member: newMember };
  }

  return { message: 'Solicitud rechazada' };
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

export const communityCheckInService = async (userId: string, communityId: string) => {
  const member = await CommunityMemberModel.findOne({ userId, communityId });
  
  if (!member) throw new Error('No eres miembro de este mundo.');

  const now = new Date();
  const lastCheckIn = member.lastCheckIn;

  if (lastCheckIn) {
    const isSameDay = lastCheckIn.toDateString() === now.toDateString();
    if (isSameDay) throw new Error('Ya hiciste check-in en este mundo hoy.');
  }

  // Lógica de racha (Streak)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const maintainedStreak = lastCheckIn && lastCheckIn.toDateString() === yesterday.toDateString();
  
  member.checkInStreak = maintainedStreak ? member.checkInStreak + 1 : 1;
  
  // Recompensas: 20 XP base + (Racha * 2)
  const xpGain = 20 + (member.checkInStreak * 2);
  member.experience += xpGain;
  member.lastCheckIn = now;

  // Calcular si subió de nivel
  const newLevel = getLevelFromXP(member.experience);
  const leveledUp = newLevel > member.level;
  member.level = newLevel;

  await member.save();

  return {
    xpGained: xpGain,
    currentLevel: member.level,
    streak: member.checkInStreak,
    leveledUp
  };
};

export const addMemberXPService = async (userId: string, communityId: string, amount: number) => {
  const member = await CommunityMemberModel.findOne({ userId, communityId });
  if (!member) return;

  member.experience += amount;
  
  const nextLevel = getLevelFromXP(member.experience);
  
  if (nextLevel > member.level) {
    member.level = nextLevel;
    // Aquí podrías disparar una notificación de "¡Subiste de nivel!"
  }

  await member.save();
};
