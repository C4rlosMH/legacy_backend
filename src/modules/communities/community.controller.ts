import { Response } from 'express';
import { createCommunityService } from './community.service';
import { config } from '../../config';
import { AuthRequest } from '../../middlewares/auth.middleware'; // Importamos la interfaz extendida

// Nota que cambiamos Request por AuthRequest para que TypeScript reconozca req.user
export const createCommunity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Ya no extraemos el ownerId del body, porque un usuario malicioso podría falsificarlo.
    const { name, description, ownerNickname } = req.body;
    
    // 2. Lo tomamos directamente del token de seguridad (garantizado por el middleware)
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
      ownerNickname
    });

    res.status(201).json({
      message: `Comunidad creada exitosamente en ${config.app.name}`,
      community: newCommunity
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al crear la comunidad' });
  }
};