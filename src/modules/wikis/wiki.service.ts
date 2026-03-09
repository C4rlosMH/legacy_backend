import { WikiModel, IWikiAttribute } from './wiki.model';
import { CommunityMemberModel } from '../community-members/community-member.model';

export interface CreateWikiDTO {
  title: string;
  content: string;
  coverImage?: string;
  backgroundImage?: string;
  isCharacterSheet?: boolean;
  attributes?: IWikiAttribute[];
}

// 1. Crear una nueva Wiki o Ficha
export const createWikiService = async (userId: string, communityId: string, data: CreateWikiDTO) => {
  const authorMember = await CommunityMemberModel.findOne({ userId, communityId });
  
  if (!authorMember) {
    throw new Error('Debes ser miembro de la comunidad para crear una Wiki');
  }

  const newWiki = await WikiModel.create({
    ...data,
    authorId: userId,
    communityId,
    authorMemberId: authorMember._id,
    catalogStatus: 'none'
  });

  return newWiki;
};

// 2. Enviar Wiki al catálogo oficial
export const submitWikiToCatalogService = async (userId: string, communityId: string, wikiId: string) => {
  const wiki = await WikiModel.findOne({ _id: wikiId, communityId, authorId: userId });
  
  if (!wiki) {
    throw new Error('La Wiki no existe o no tienes permiso para modificarla');
  }

  if (wiki.catalogStatus === 'approved') {
    throw new Error('Esta Wiki ya forma parte del catálogo oficial');
  }

  wiki.catalogStatus = 'pending';
  await wiki.save();

  return wiki;
};

// 3. Curar Wiki: Aprobar o Rechazar
export const moderateWikiCatalogService = async (
  communityId: string, 
  wikiId: string, 
  action: 'approved' | 'rejected'
) => {
  const originalWiki = await WikiModel.findOne({ _id: wikiId, communityId });
  
  if (!originalWiki) {
    throw new Error('La Wiki no existe en esta comunidad');
  }

  if (originalWiki.catalogStatus !== 'pending') {
    throw new Error('Esta Wiki no está pendiente de revisión');
  }

  if (action === 'rejected') {
    originalWiki.catalogStatus = 'rejected';
    await originalWiki.save();
    return originalWiki;
  }

  if (action === 'approved') {
    originalWiki.catalogStatus = 'approved';
    await originalWiki.save();

    let goldenWiki = await WikiModel.findOne({ originalWikiId: originalWiki._id, communityId });

    if (goldenWiki) {
      // Actualizamos la copia dorada existente (Aplicando fallback a string vacío)
      goldenWiki.title = originalWiki.title;
      goldenWiki.content = originalWiki.content;
      goldenWiki.coverImage = originalWiki.coverImage || '';
      goldenWiki.backgroundImage = originalWiki.backgroundImage || '';
      goldenWiki.attributes = originalWiki.attributes;
      await goldenWiki.save();
      
      return goldenWiki;
    } else {
      // Creamos la copia dorada por primera vez (Aplicando fallback a string vacío)
      goldenWiki = await WikiModel.create({
        title: originalWiki.title,
        content: originalWiki.content,
        coverImage: originalWiki.coverImage || '',
        backgroundImage: originalWiki.backgroundImage || '',
        isCharacterSheet: originalWiki.isCharacterSheet,
        attributes: originalWiki.attributes,
        
        catalogStatus: 'approved',
        isOfficial: true,
        originalWikiId: originalWiki._id,
        
        authorId: originalWiki.authorId,
        communityId: originalWiki.communityId,
        authorMemberId: originalWiki.authorMemberId
      });

      return goldenWiki;
    }
  }
};

// 4. Editar una Wiki
export const updateWikiService = async (
  userId: string, 
  userRole: string,
  communityId: string, 
  wikiId: string, 
  updateData: Partial<CreateWikiDTO>
) => {
  const wiki = await WikiModel.findOne({ _id: wikiId, communityId });

  if (!wiki) {
    throw new Error('La Wiki no existe');
  }

  if (wiki.isOfficial) {
    const isStaff = ['owner', 'admin', 'moderator'].includes(userRole);
    if (!isStaff) {
      throw new Error('Solo el staff puede modificar una Wiki del catálogo oficial');
    }
  } else {
    if (wiki.authorId.toString() !== userId) {
      throw new Error('No tienes permiso para editar esta Wiki personal');
    }

    if (['approved', 'pending'].includes(wiki.catalogStatus)) {
      wiki.catalogStatus = 'none';
    }
  }

  const safeUpdates = {
    title: updateData.title ?? wiki.title,
    content: updateData.content ?? wiki.content,
    coverImage: updateData.coverImage ?? wiki.coverImage,
    backgroundImage: updateData.backgroundImage ?? wiki.backgroundImage,
    attributes: updateData.attributes ?? wiki.attributes,
  };

  Object.assign(wiki, safeUpdates);
  await wiki.save();

  return wiki;
};

// 5. Obtener una Wiki (con lógica de anonimato)
export const getWikiService = async (communityId: string, wikiId: string) => {
  const wiki = await WikiModel.findOne({ _id: wikiId, communityId })
    .populate('authorMemberId', 'status displayName avatar') // Ajusta los campos según tu modelo de miembro
    .lean(); // .lean() para poder modificar el objeto antes de retornarlo

  if (!wiki) {
    throw new Error('Wiki no encontrada');
  }

  // Verificamos el estado del autor. Si fue expulsado (banned, kicked, left), ocultamos sus datos.
  const authorData: any = wiki.authorMemberId;
  if (!authorData || ['banned', 'kicked', 'left'].includes(authorData.status)) {
    wiki.authorMemberId = null as any; 
    // O puedes asignar un objeto por defecto: { displayName: 'Usuario Desconocido', avatar: 'default.png' }
  }

  return wiki;
};

// 6. Eliminar una Wiki
export const deleteWikiService = async (
  userId: string, 
  userRole: string, 
  communityId: string, 
  wikiId: string
) => {
  const wiki = await WikiModel.findOne({ _id: wikiId, communityId });

  if (!wiki) {
    throw new Error('La Wiki no existe');
  }

  // CASO A: El staff elimina una copia curada (Dorada)
  if (wiki.isOfficial) {
    const isStaff = ['owner', 'admin', 'moderator'].includes(userRole);
    if (!isStaff) {
      throw new Error('Solo el staff puede eliminar una Wiki del catálogo oficial');
    }

    // Si la wiki dorada tenía una original vinculada, le reiniciamos el estado 
    // para que el usuario sepa que ya no está en el catálogo y pueda reenviarla
    if (wiki.originalWikiId) {
      await WikiModel.updateOne(
        { _id: wiki.originalWikiId },
        { $set: { catalogStatus: 'none' } }
      );
    }

    await wiki.deleteOne();
    return { message: 'Wiki oficial eliminada del catálogo exitosamente' };
  } 
  
  // CASO B: El usuario elimina su copia original
  else {
    if (wiki.authorId.toString() !== userId) {
      throw new Error('No tienes permiso para eliminar esta Wiki personal');
    }

    // Eliminamos la original. 
    // Nota: La copia dorada (si existe) no se ve afectada, porque es un documento independiente.
    await wiki.deleteOne();
    return { message: 'Wiki personal eliminada. (Si estaba aprobada, la copia oficial en el catálogo se mantiene)' };
  }
};