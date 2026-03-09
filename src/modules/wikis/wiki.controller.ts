import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { 
  createWikiService, 
  submitWikiToCatalogService, getCatalogWikisService,
  moderateWikiCatalogService,
  updateWikiService,
  getWikiService, deleteWikiService
} from './wiki.service';

// 1. Crear una nueva Wiki o Ficha
export const createWiki = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const communityId = req.params.communityId as string;
    const data = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const newWiki = await createWikiService(userId, communityId, data);
    
    res.status(201).json({ 
      message: 'Wiki creada exitosamente', 
      wiki: newWiki 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al crear la Wiki' });
  }
};

// 2. Enviar Wiki al catálogo oficial
export const submitWiki = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const communityId = req.params.communityId as string;
    const wikiId = req.params.wikiId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const wiki = await submitWikiToCatalogService(userId, communityId, wikiId);
    
    res.status(200).json({ 
      message: 'Wiki enviada al catálogo para revisión', 
      wiki 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al enviar la Wiki' });
  }
};

// 3. Aprobar o Rechazar Wiki (Solo Staff)
export const moderateWiki = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const wikiId = req.params.wikiId as string;
    const { action } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      res.status(400).json({ message: 'Acción no válida. Debe ser approved o rejected' });
      return;
    }

    const wiki = await moderateWikiCatalogService(communityId, wikiId, action as 'approved' | 'rejected');
    
    res.status(200).json({ 
      message: `Wiki ${action === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`, 
      wiki 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al moderar la Wiki' });
  }
};

// 4. Actualizar Wiki
export const updateWiki = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    // Asumiendo que el middleware inyecta el rol en req.communityRole. Ajústalo a tu implementación.
    const userRole = (req as any).communityRole || 'member'; 
    const communityId = req.params.communityId as string;
    const wikiId = req.params.wikiId as string;
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const updatedWiki = await updateWikiService(userId, userRole, communityId, wikiId, updateData);
    
    res.status(200).json({ 
      message: 'Wiki actualizada exitosamente', 
      wiki: updatedWiki 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al actualizar la Wiki' });
  }
};

// 5. Obtener una Wiki
export const getWiki = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const wikiId = req.params.wikiId as string;

    const wiki = await getWikiService(communityId, wikiId);
    
    res.status(200).json({ wiki });
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Error al obtener la Wiki' });
  }
};

// 6. Eliminar Wiki
export const deleteWiki = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = (req as any).communityRole || 'member'; 
    const communityId = req.params.communityId as string;
    const wikiId = req.params.wikiId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await deleteWikiService(userId, userRole, communityId, wikiId);
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al eliminar la Wiki' });
  }
};

// 7. Explorar el Catálogo Oficial
export const getCatalogWikis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    
    // Extraer parámetros de la URL (Query Params)
    const categoryId = req.query.categoryId as string | undefined;
    const type = req.query.type as string | undefined; // Puede ser 'character' o 'general'
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Convertir el string de tipo a booleano para el servicio
    const filters: any = { categoryId, search };
    if (type === 'character') filters.isCharacterSheet = true;
    if (type === 'general') filters.isCharacterSheet = false;

    const result = await getCatalogWikisService(communityId, filters, page, limit);

    res.status(200).json({
      message: 'Catálogo obtenido exitosamente',
      ...result
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener el catálogo' });
  }
};