import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
  createCommunityTitleService, getCommunityTitlesService, assignTitleToMemberService,
  revokeTitleFromMemberService, equipDisplayTitlesService,
} from './community-title.service';

export const createCommunityTitle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const { name, color, group, isExclusive, isKey } = req.body;

    if (!name || !group) {
      res.status(400).json({ message: 'El nombre del título y el grupo son obligatorios.' });
      return;
    }

    const newTitle = await createCommunityTitleService(communityId, {
      name, color, group, isExclusive, isKey
    });

    res.status(201).json({ message: 'Título creado exitosamente.', title: newTitle });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al crear el título.' });
  }
};

export const getCommunityTitles = async (req: Request, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const titles = await getCommunityTitlesService(communityId);
    
    res.status(200).json({ titles });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener el catálogo de títulos.' });
  }
};

export const assignTitleToMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const targetUserId = req.params.targetUserId as string;
    const { titleId } = req.body;

    if (!titleId) {
      res.status(400).json({ message: 'El ID del título es obligatorio.' });
      return;
    }

    const result = await assignTitleToMemberService(communityId, targetUserId, titleId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al asignar el título.' });
  }
};

export const revokeTitleFromMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const targetUserId = req.params.targetUserId as string;
    const titleId = req.params.titleId as string;

    const result = await revokeTitleFromMemberService(communityId, targetUserId, titleId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al revocar el título.' });
  }
};

export const equipDisplayTitles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const communityId = req.params.communityId as string;
    const { titleIdsToEquip } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    if (!Array.isArray(titleIdsToEquip)) {
      res.status(400).json({ message: 'Debes enviar un arreglo de IDs de títulos.' });
      return;
    }

    const result = await equipDisplayTitlesService(communityId, userId, titleIdsToEquip);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al equipar los títulos.' });
  }
};