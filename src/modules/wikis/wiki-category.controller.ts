import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { 
  createCategoryService, 
  getCategoriesService, 
  updateCategoryService, 
  deleteCategoryService 
} from './wiki-category.service';

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const { name, description, parentId } = req.body;

    if (!name) {
      res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
      return;
    }

    const category = await createCategoryService(communityId, name, description, parentId);
    res.status(201).json({ message: 'Categoría creada', category });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al crear la categoría' });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const categories = await getCategoriesService(communityId);
    res.status(200).json({ categories });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al obtener categorías' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const categoryId = req.params.categoryId as string;
    
    const category = await updateCategoryService(categoryId, communityId, req.body);
    res.status(200).json({ message: 'Categoría actualizada', category });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al actualizar la categoría' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const communityId = req.params.communityId as string;
    const categoryId = req.params.categoryId as string;

    const result = await deleteCategoryService(categoryId, communityId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al eliminar la categoría' });
  }
};