import { Request, Response } from 'express';
import { createCommunityService, getCommunityDetailsService, searchCommunitiesService,
  updateCommunitySettingsService, deleteCommunityService, requestCommunityListingService,
  approveCommunityListingService, rejectCommunityListingService,
 } from './community.service';
import { config } from '../../config';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const createCommunity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Extraemos visibility desde el payload que envía el frontend
    const { name, description, ownerNickname, visibility } = req.body;
    
    const ownerId = req.user?.id;

    if (!ownerId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!name || !ownerNickname) {
      res.status(400).json({ message: 'El nombre de la comunidad y tu apodo son obligatorios' });
      return;
    }

    const newCommunity = await createCommunityService({
      name,
      description: description || '',
      ownerId,
      ownerNickname,
      visibility // Pasamos el dato al servicio
    });

    res.status(201).json({
      message: `Comunidad creada exitosamente en ${config.app.name}`,
      community: newCommunity
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al crear la comunidad' });
  }
};

export const getCommunityDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const communityId = req.params.id as string;
    const community = await getCommunityDetailsService(communityId);
    res.status(200).json({ community });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const searchCommunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;

    if (!query) {
      res.status(400).json({ message: 'Debes proporcionar un término de búsqueda' });
      return;
    }

    const results = await searchCommunitiesService(query);

    res.status(200).json({
      message: 'Búsqueda completada',
      results
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al realizar la búsqueda' });
  }
};

export const updateCommunitySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const { name, description, avatar, banner } = req.body;

    const updatedCommunity = await updateCommunitySettingsService(communityId, {
      name,
      description,
      avatar,
      banner
    });

    res.status(200).json({
      message: 'Configuración de la comunidad actualizada exitosamente',
      community: updatedCommunity
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al actualizar la comunidad' });
  }
};

export const deleteCommunity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const communityId = req.params.communityId as string;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const result = await deleteCommunityService(communityId, userId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al eliminar la comunidad' });
  }
};

export const requestListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const userId = req.user?.id;

    if (!userId) { res.status(401).json({ message: 'No autenticado' }); return; }

    const result = await requestCommunityListingService(communityId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const approveListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    if (!communityId) { res.status(400).json({ message: 'ID obligatorio.' }); return; }

    const result = await approveCommunityListingService(communityId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const rejectListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const { reason } = req.body;
    
    if (!communityId) { res.status(400).json({ message: 'ID obligatorio.' }); return; }

    const result = await rejectCommunityListingService(communityId, reason);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};