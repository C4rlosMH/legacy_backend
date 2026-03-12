import { CommunityModel } from '../communities/community.model';
import { CommunityMemberModel } from './community-member.model';
import { CommunityRole } from '../../middlewares/community-role.middleware';
import { CommunityRequestModel } from './community-request.model';
import { getLevelFromXP } from '../../utils/level.util';
import { createModLogService } from '../moderation/mod-log.service';

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
    if (existingMember.status === 'active') {
      throw new Error('Ya eres miembro de esta comunidad');
    }
    if (existingMember.status === 'banned') {
      throw new Error('Has sido vetado de este universo y no puedes volver a unirte.');
    }

    // Si el estado es 'left', el usuario está regresando por voluntad propia
    if (existingMember.status === 'left') {
      if (community.visibility === 'private') {
        const pendingRequest = await CommunityRequestModel.findOne({
          userId: data.userId,
          communityId: data.communityId,
          status: 'pending'
        });

        if (pendingRequest) throw new Error('Ya tienes una solicitud pendiente para entrar a esta comunidad');

        const newRequest = await CommunityRequestModel.create({
          userId: data.userId,
          communityId: data.communityId,
          nickname: data.nickname,
          message: data.message || '',
          status: 'pending'
        });

        return { type: 'request', data: newRequest, message: 'Solicitud enviada al staff para su revisión' };
      }

      // Si es pública, lo reactivamos instantáneamente
      existingMember.status = 'active';
      existingMember.nickname = data.nickname;
      await existingMember.save();

      return { type: 'member', data: existingMember, message: 'Bienvenido de vuelta. Has recuperado todo tu progreso en la comunidad.' };
    }
  }

  // LÓGICA DE PRIVACIDAD PARA USUARIOS NUEVOS
  if (community.visibility === 'private') {
    const pendingRequest = await CommunityRequestModel.findOne({
      userId: data.userId,
      communityId: data.communityId,
      status: 'pending'
    });

    if (pendingRequest) {
      throw new Error('Ya tienes una solicitud pendiente para entrar a esta comunidad');
    }

    const newRequest = await CommunityRequestModel.create({
      userId: data.userId,
      communityId: data.communityId,
      nickname: data.nickname,
      message: data.message || '',
      status: 'pending'
    });

    return { type: 'request', data: newRequest, message: 'Solicitud enviada al staff para su revisión' };
  }

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
  const memberships = await CommunityMemberModel.find({ userId, status: 'active' }) // <-- SOLO ACTIVOS
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

export const toggleHideProfileService = async (
  communityId: string, 
  targetUserId: string, 
  moderatorId: string, 
  hide: boolean,
  hours?: number // <-- Opcional: El staff decide cuánto dura el castigo
) => {
  const member = await CommunityMemberModel.findOne({ userId: targetUserId, communityId });
  if (!member) throw new Error('El usuario no es miembro de la comunidad');
  if (member.role === 'owner') throw new Error('No puedes ocultar el perfil del creador');

  member.isHidden = hide;
  let reasonMsg = `Perfil ${hide ? 'ocultado (Modo Lectura)' : 'restaurado'} manualmente.`;

  if (hide && hours) {
    const muteEnd = new Date();
    muteEnd.setHours(muteEnd.getHours() + hours);
    member.hiddenUntil = muteEnd;
    reasonMsg += ` Duración: ${hours} horas.`;
  } else if (!hide) {
    // Si el staff decide quitarle el castigo antes de tiempo, limpiamos la fecha
    member.hiddenUntil = undefined; 
  }

  await member.save();

  // Dejamos el rastro en el historial
  await createModLogService({
    communityId,
    moderatorId,
    action: 'hide_profile',
    targetUserId,
    reason: reasonMsg
  });

  return member;
};

export const kickMemberService = async (communityId: string, targetUserId: string, moderatorId: string, reason?: string) => {
  const member = await CommunityMemberModel.findOne({ userId: targetUserId, communityId });
  if (!member) throw new Error('El usuario no es miembro de la comunidad');
  
  if (member.status === 'banned') throw new Error('El usuario ya está vetado de la comunidad');
  if (member.role === 'owner') throw new Error('No puedes expulsar al creador');
  if (member.role === 'admin') throw new Error('Los líderes no pueden ser expulsados, deben ser degradados primero');

  member.status = 'banned';
  await member.save();

  // Dejar rastro en el Mod Log
  await createModLogService({
    communityId,
    moderatorId,
    action: 'ban',
    targetUserId,
    reason: reason || 'Violación a las normas de la comunidad'
  });

  return { message: 'Usuario vetado de la comunidad exitosamente.' };
};

export const leaveCommunityService = async (communityId: string, userId: string) => {
  const member = await CommunityMemberModel.findOne({ communityId, userId, status: 'active' });
  
  if (!member) {
    throw new Error('No eres miembro activo de esta comunidad');
  }

  if (member.role === 'owner') {
    throw new Error('El creador no puede abandonar la comunidad. Debes transferir el liderazgo o eliminarla por completo.');
  }

  member.status = 'left';
  await member.save();
  return { message: 'Has abandonado la comunidad exitosamente. Tu progreso ha sido guardado por si decides volver.' };
};

export const unbanMemberService = async (communityId: string, targetUserId: string, moderatorId: string) => {
  const member = await CommunityMemberModel.findOne({ userId: targetUserId, communityId });
  
  if (!member) throw new Error('Registro de usuario no encontrado en esta comunidad');
  if (member.status !== 'banned') throw new Error('Este usuario no se encuentra vetado');

  member.status = 'active';
  await member.save();
  
  // Dejar rastro en el Mod Log
  await createModLogService({
    communityId,
    moderatorId,
    action: 'unban',
    targetUserId,
    reason: 'Sanción levantada por el equipo de moderación'
  });
  
  return { message: 'El usuario ha sido desbaneado y reincorporado a la comunidad con todo su progreso intacto.' };
};

export const issueStrikeService = async (communityId: string, targetUserId: string, moderatorId: string, reason: string) => {
  const member = await CommunityMemberModel.findOne({ userId: targetUserId, communityId });
  
  if (!member) throw new Error('El usuario no es miembro de la comunidad');
  if (['owner', 'admin'].includes(member.role)) throw new Error('No puedes sancionar a un líder');

  member.strikeCount += 1;
  await member.save();

  // Registro para auditoría del staff
  await createModLogService({
    communityId,
    moderatorId,
    action: 'strike',
    targetUserId,
    reason: `Falta #${member.strikeCount}: ${reason}`
  });

  return { 
    message: `Falta registrada exitosamente. El usuario ahora acumula ${member.strikeCount} advertencia(s).`, 
    strikeCount: member.strikeCount 
  };
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

