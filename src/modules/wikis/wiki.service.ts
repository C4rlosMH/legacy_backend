import { WikiModel, IWikiAttribute } from './wiki.model';
import { CommunityMemberModel } from '../community-members/community-member.model';
import { addMemberXPService } from '../community-members/community-member.service';

export interface CreateWikiDTO {
  title: string;
  content: string;
  coverImage?: string;
  backgroundImage?: string;
  isCharacterSheet?: boolean;
  attributes?: IWikiAttribute[];
  categoryId?: string; // <-- NUEVO
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
  
  // LOGICA DE GAMIFICACIÓN: Otorgar +5 XP por crear una ficha
  await addMemberXPService(userId, communityId, 5);
  
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
      goldenWiki.title = originalWiki.title;
      goldenWiki.content = originalWiki.content;
      goldenWiki.coverImage = originalWiki.coverImage || '';
      goldenWiki.backgroundImage = originalWiki.backgroundImage || '';
      goldenWiki.attributes = originalWiki.attributes;
      await goldenWiki.save();
      
      return goldenWiki;
    } else {
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
        // Nota: No heredamos categoryId de la original, el staff se lo asignará luego
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
    categoryId: updateData.categoryId !== undefined ? updateData.categoryId : wiki.categoryId, // <-- NUEVO
  };

  Object.assign(wiki, safeUpdates);
  await wiki.save();

  return wiki;
};

// 5. Obtener una Wiki
export const getWikiService = async (communityId: string, wikiId: string) => {
  const wiki = await WikiModel.findOne({ _id: wikiId, communityId })
    .populate('authorMemberId', 'status displayName avatar') 
    .populate('categoryId', 'name') // <-- NUEVO: Para que devuelva el nombre de la carpeta
    .lean(); 

  if (!wiki) {
    throw new Error('Wiki no encontrada');
  }

  const authorData: any = wiki.authorMemberId;
  if (!authorData || ['banned', 'kicked', 'left'].includes(authorData.status)) {
    wiki.authorMemberId = null as any; 
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

  if (wiki.isOfficial) {
    const isStaff = ['owner', 'admin', 'moderator'].includes(userRole);
    if (!isStaff) {
      throw new Error('Solo el staff puede eliminar una Wiki del catálogo oficial');
    }

    if (wiki.originalWikiId) {
      await WikiModel.updateOne(
        { _id: wiki.originalWikiId },
        { $set: { catalogStatus: 'none' } }
      );
    }

    await wiki.deleteOne();
    return { message: 'Wiki oficial eliminada del catálogo exitosamente' };
  } else {
    if (wiki.authorId.toString() !== userId) {
      throw new Error('No tienes permiso para eliminar esta Wiki personal');
    }

    await wiki.deleteOne();
    return { message: 'Wiki personal eliminada. (Si estaba aprobada, la copia oficial en el catálogo se mantiene)' };
  }
};

// 7. Explorador del Catálogo (Listar Wikis Oficiales con filtros)
export const getCatalogWikisService = async (
  communityId: string,
  filters: { categoryId?: string; isCharacterSheet?: boolean; search?: string },
  page: number = 1,
  limit: number = 20
) => {
  // Construimos la consulta base: Solo contenido oficial aprobado de esta comunidad
  const query: any = {
    communityId,
    isOfficial: true,
    catalogStatus: 'approved'
  };

  // Aplicamos filtros opcionales si vienen en la petición
  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  if (filters.isCharacterSheet !== undefined) {
    query.isCharacterSheet = filters.isCharacterSheet;
  }

  if (filters.search) {
    // Búsqueda insensible a mayúsculas/minúsculas en el título
    query.title = new RegExp(filters.search, 'i');
  }

  const skip = (page - 1) * limit;

  // Ejecutamos la búsqueda con paginación y población de datos
  const wikis = await WikiModel.find(query)
    .populate('authorMemberId', 'status displayName avatar')
    .populate('categoryId', 'name')
    .sort({ updatedAt: -1 }) // Los más recientemente actualizados primero
    .skip(skip)
    .limit(limit)
    .lean();

  // Procesamos el anonimato para autores expulsados
  const processedWikis = wikis.map(wiki => {
    const authorData: any = wiki.authorMemberId;
    if (!authorData || ['banned', 'kicked', 'left'].includes(authorData.status)) {
      wiki.authorMemberId = null as any;
    }
    return wiki;
  });

  // Contamos el total para que el frontend pueda armar su paginación
  const total = await WikiModel.countDocuments(query);

  return {
    wikis: processedWikis,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};