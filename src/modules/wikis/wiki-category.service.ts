import { WikiCategoryModel } from './wiki-category.model';
import { WikiModel } from './wiki.model';

export const createCategoryService = async (communityId: string, name: string, description?: string, parentId?: string) => {
  // Construimos el objeto evitando pasar 'undefined'
  const newCategory = await WikiCategoryModel.create({
    communityId,
    name,
    description: description || '',
    ...(parentId && { parentId }) // Solo se agrega si parentId tiene un valor
  });
  
  return newCategory;
};

export const getCategoriesService = async (communityId: string) => {
  const categories = await WikiCategoryModel.find({ communityId }).sort({ name: 1 });
  return categories;
};

export const updateCategoryService = async (categoryId: string, communityId: string, data: { name?: string, description?: string, parentId?: string }) => {
  const category = await WikiCategoryModel.findOneAndUpdate(
    { _id: categoryId, communityId },
    { $set: data },
    { new: true }
  );

  if (!category) {
    throw new Error('La categoría no existe en esta comunidad');
  }

  return category;
};

export const deleteCategoryService = async (categoryId: string, communityId: string) => {
  const category = await WikiCategoryModel.findOneAndDelete({ _id: categoryId, communityId });
  
  if (!category) {
    throw new Error('La categoría no existe');
  }

  // IMPORTANTE: Si borramos la carpeta, las wikis que estaban adentro no deben borrarse, 
  // solo las sacamos de la carpeta (dejamos su categoryId en null).
  await WikiModel.updateMany(
    { categoryId, communityId },
    { $unset: { categoryId: 1 } }
  );

  return { message: 'Categoría eliminada. Las wikis en su interior ahora no tienen categoría.' };
};