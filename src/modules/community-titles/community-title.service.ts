import { CommunityTitleModel } from './community-title.model';
import { CommunityMemberModel } from '../community-members/community-member.model';
import { config } from '../../config';

interface CreateTitleDTO {
  name: string;
  color?: string;
  group: string;
  isExclusive?: boolean;
  isKey?: boolean;
}

// ==========================================
// 1. GESTIÓN DEL CATÁLOGO (Solo Staff)
// ==========================================

export const createCommunityTitleService = async (communityId: string, data: CreateTitleDTO) => {
  const existingTitle = await CommunityTitleModel.findOne({ 
    communityId, 
    name: { $regex: new RegExp(`^${data.name}$`, 'i') } 
  });

  if (existingTitle) {
    throw new Error('Ya existe un título con ese nombre en esta comunidad.');
  }

  const newTitle = await CommunityTitleModel.create({
    communityId,
    name: data.name,
    color: data.color || '#FFFFFF',
    group: data.group,
    isExclusive: data.isExclusive || false,
    isKey: data.isKey || false
  });

  return newTitle;
};

export const getCommunityTitlesService = async (communityId: string) => {
  return await CommunityTitleModel.find({ communityId }).sort({ group: 1, name: 1 });
};

// ==========================================
// 2. MOTOR DE ASIGNACIÓN Y EXCLUSIVIDAD REFINADA
// ==========================================

export const assignTitleToMemberService = async (communityId: string, targetUserId: string, titleId: string) => {
  const title = await CommunityTitleModel.findOne({ _id: titleId, communityId });
  if (!title) {
    throw new Error('El título especificado no existe en el catálogo de este universo.');
  }

  const member = await CommunityMemberModel.findOne({ communityId, userId: targetUserId });
  if (!member) {
    throw new Error('El usuario no es miembro de la comunidad.');
  }

  const hasTitle = member.inventoryTitles.some(id => id.toString() === titleId);
  if (hasTitle) {
    throw new Error('El usuario ya posee este título en su inventario.');
  }

  // LÓGICA DE EXCLUSIVIDAD: Solo choca contra otros títulos que también sean exclusivos
  if (title.isExclusive) {
    const exclusiveGroupTitles = await CommunityTitleModel.find({ 
      communityId, 
      group: title.group,
      isExclusive: true // <-- LA CONDICIÓN CLAVE PARA PERMITIR PINES DECORATIVOS
    }).select('_id');
    
    const exclusiveIds = exclusiveGroupTitles.map(t => t._id.toString());

    member.inventoryTitles = member.inventoryTitles.filter(id => !exclusiveIds.includes(id.toString()));
    member.displayTitles = member.displayTitles.filter(id => !exclusiveIds.includes(id.toString()));
  }

  member.inventoryTitles.push(title._id as any);
  await member.save();

  return { 
    message: `Se ha otorgado el título '${title.name}' al usuario exitosamente.`,
    title 
  };
};

// ==========================================
// 3. REVOCACIÓN Y GESTIÓN DE PERFIL DINÁMICO
// ==========================================

export const revokeTitleFromMemberService = async (communityId: string, targetUserId: string, titleId: string) => {
  const member = await CommunityMemberModel.findOne({ communityId, userId: targetUserId });
  if (!member) {
    throw new Error('El usuario no es miembro de la comunidad.');
  }

  member.inventoryTitles = member.inventoryTitles.filter(id => id.toString() !== titleId);
  member.displayTitles = member.displayTitles.filter(id => id.toString() !== titleId);
  
  await member.save();

  return { message: 'El título ha sido revocado del inventario del usuario.' };
};

export const equipDisplayTitlesService = async (communityId: string, userId: string, titleIdsToEquip: string[]) => {
  const member = await CommunityMemberModel.findOne({ communityId, userId });
  if (!member) throw new Error('No eres miembro de la comunidad.');

  const limit = config.communityRules.maxDisplayTitles;

  if (titleIdsToEquip.length > limit) {
    throw new Error(`Solo puedes equipar un máximo de ${limit} títulos visibles en tu perfil.`);
  }

  const inventoryStrings = member.inventoryTitles.map(id => id.toString());
  for (const id of titleIdsToEquip) {
    if (!inventoryStrings.includes(id)) {
      throw new Error('Estás intentando equipar un título que no posees en tu inventario.');
    }
  }

  member.displayTitles = titleIdsToEquip as any[];
  await member.save();

  return { message: 'Títulos de perfil actualizados exitosamente.', displayTitles: member.displayTitles };
};