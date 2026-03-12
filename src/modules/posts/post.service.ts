import { PostModel, PostType } from './post.model'; // <-- IMPORT AÑADIDO
import { CommunityModel } from '../communities/community.model';
import { CommunityMemberModel } from '../community-members/community-member.model';
import { addMemberXPService } from '../community-members/community-member.service';3
import { CommentModel } from '../comments/comment.model';

interface CreatePostDTO {
  authorId: string;
  context: 'community' | 'global_thread';
  postType: PostType; // <-- AHORA ES OBLIGATORIO Y RECONOCIDO
  content: string;
  communityId?: string;
  title?: string;
  mediaUrls?: string[];
  linkUrl?: string; // <-- AÑADIDO
  tags?: string[];  // <-- AÑADIDO
}

export const createPostService = async (data: CreatePostDTO) => {
  let authorMemberId;

  // 1. VALIDACIONES ESTRICTAS POR TIPO DE CONTENIDO
  if (data.postType === 'blog' && (!data.title || data.title.trim() === '')) {
    throw new Error('Los blogs requieren un título obligatorio.');
  }

  if (data.postType === 'link' && !data.linkUrl) {
    throw new Error('Las publicaciones de tipo enlace deben incluir una URL.');
  }

  if (data.postType === 'ad' && data.tags && data.tags.length > 5) {
    throw new Error('Los anuncios no pueden tener más de 5 etiquetas.');
  }

  // 2. VALIDACIÓN DE PERTENENCIA AL MUNDO
  if (data.context === 'community') {
    if (!data.communityId) throw new Error('Debes proporcionar el ID de la comunidad');
    
    const memberProfile = await CommunityMemberModel.findOne({
      userId: data.authorId,
      communityId: data.communityId
    });

    if (!memberProfile) {
      throw new Error('No puedes publicar aquí porque no eres miembro de esta comunidad');
    }

    if (memberProfile.hiddenUntil && new Date(memberProfile.hiddenUntil) > new Date()) {
      throw new Error(`Estás en Modo Lectura por infracciones. Podrás volver a publicar el ${new Date(memberProfile.hiddenUntil).toLocaleString()}`);
    }

    authorMemberId = memberProfile._id;
  }

  // 3. CONSTRUCCIÓN DE LOS DATOS
  const postData: any = {
    ...data,
    // Las preguntas siempre nacen sin resolver
    ...(data.postType === 'question' && { isResolved: false })
  };

  if (authorMemberId) {
    postData.authorMemberId = authorMemberId;
  }

  const newPost = await PostModel.create(postData);

  // 4. LOGICA DE GAMIFICACIÓN: Otorgar XP por publicar
  if (data.context === 'community' && data.communityId) {
    await addMemberXPService(data.authorId, data.communityId, 5);
  }

  return newPost;
};

export const getCommunityFeedService = async (communityId: string) => {
  const posts = await PostModel.find({ context: 'community', communityId })
    .sort({ createdAt: -1 })
    .limit(20)
    // AHORA POBLAMOS EL PERFIL DE LA COMUNIDAD, NO EL GLOBAL
    .populate('authorMemberId', 'nickname role roleplayData'); 
    
  return posts;
};

export const getGlobalFeedService = async () => {
  // Buscamos solo los posts que tengan el contexto de hilo global
  const posts = await PostModel.find({ context: 'global_thread' })
    .sort({ createdAt: -1 }) // Del más nuevo al más viejo
    .limit(30) // Traemos 30 para tener un buen scroll inicial
    .populate('authorId', 'name username avatar'); // Poblamos la identidad global
    
  return posts;
};

export const moderatePostService = async (
  postId: string, 
  communityId: string, 
  action: 'hide' | 'unhide' | 'pin' | 'unpin' | 'delete'
) => {
  // Verificamos que el post exista y pertenezca a este universo
  const post = await PostModel.findOne({ _id: postId, communityId });
  if (!post) throw new Error('El post no existe en esta comunidad');

  switch (action) {
    case 'hide':
      post.isHidden = true;
      break;
    case 'unhide':
      post.isHidden = false;
      break;
    case 'pin':
      post.isPinned = true;
      break;
    case 'unpin':
      post.isPinned = false;
      break;
    case 'delete':
      await PostModel.findByIdAndDelete(postId);
      return { message: 'Post eliminado permanentemente' };
  }

  await post.save();
  return post;
};

interface UpdatePostDTO {
  title?: string;
  content?: string;
  linkUrl?: string;
  mediaUrls?: string[];
}

export const updatePostService = async (postId: string, userId: string, data: UpdatePostDTO) => {
  const post = await PostModel.findById(postId);
  
  if (!post) {
    throw new Error('El post no existe');
  }

  // Verificamos que el usuario sea el autor original
  if (post.authorId.toString() !== userId) {
    throw new Error('No tienes permiso para editar este post');
  }

  // Actualizamos solo los campos permitidos y que vengan en la petición
  if (data.title !== undefined) post.title = data.title;
  if (data.content !== undefined) post.content = data.content;
  if (data.linkUrl !== undefined) post.linkUrl = data.linkUrl;
  if (data.mediaUrls !== undefined) post.mediaUrls = data.mediaUrls;

  await post.save();
  return post;
};

export const deletePostService = async (postId: string, userId: string) => {
  const post = await PostModel.findById(postId);
  
  if (!post) {
    throw new Error('El post no existe');
  }

  if (post.authorId.toString() !== userId) {
    throw new Error('No tienes permiso para eliminar este post');
  }

  await post.deleteOne();
  return { message: 'Publicación eliminada exitosamente' };
};

export const resolveQuestionService = async (postId: string, userId: string, commentId: string) => {
  const post = await PostModel.findById(postId);
  
  if (!post) {
    throw new Error('La publicación no existe');
  }

  if (post.postType !== 'question') {
    throw new Error('Solo las publicaciones de tipo "question" pueden ser marcadas como resueltas');
  }

  if (post.authorId.toString() !== userId) {
    throw new Error('Solo el autor de la pregunta puede elegir la respuesta correcta');
  }

  if (post.isResolved) {
    throw new Error('Esta pregunta ya ha sido resuelta');
  }

  const comment = await CommentModel.findById(commentId);
  
  if (!comment) {
    throw new Error('La respuesta seleccionada no existe');
  }

  // CORRECCIÓN: Usamos targetId y targetType según el modelo polimórfico
  if (comment.targetId.toString() !== postId || comment.targetType !== 'post') {
    throw new Error('Ese comentario no pertenece a esta pregunta');
  }

  // Actualizamos el estado de la pregunta
  post.isResolved = true;
  post.acceptedAnswerId = comment._id as any;
  
  await post.save();

  // GAMIFICACIÓN ACTIVADA: +15 XP al usuario que dio la respuesta correcta
  if (post.context === 'community' && post.communityId) {
    await addMemberXPService(comment.authorId.toString(), post.communityId.toString(), 15);
  }

  return post;
};

export const getAdsService = async (context: 'community' | 'global_thread', communityId?: string, tags?: string[]) => {
  const query: any = { 
    postType: 'ad', 
    context 
  };

  if (context === 'community') {
    if (!communityId) throw new Error('Debes proporcionar el ID de la comunidad para este contexto');
    query.communityId = communityId;
  }

  // Si el usuario envía etiquetas, buscamos anuncios que coincidan con AL MENOS UNA de esas etiquetas
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  // Buscamos, ordenamos por los más recientes y traemos la información básica del autor
  const ads = await PostModel.find(query)
    .sort({ createdAt: -1 })
    .populate('authorId', 'name username avatar') 
    .limit(20);

  return ads;
};

export const getFeedService = async (
  context: 'community' | 'global_thread', 
  communityId?: string, 
  postType?: string, 
  page: number = 1, 
  limit: number = 20
) => {
  const query: any = { context };

  if (context === 'community') {
    if (!communityId) throw new Error('Debes proporcionar el ID de la comunidad');
    query.communityId = communityId;
  }

  // Filtrado por tipo de publicación
  if (postType) {
    query.postType = postType;
  } else {
    // Si no pide un tipo específico, mostramos todo EXCEPTO los anuncios, 
    // para no ensuciar el feed principal (los anuncios se ven en su propia sección)
    query.postType = { $ne: 'ad' };
  }

  const skip = (page - 1) * limit;

  const posts = await PostModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('authorId', 'name username avatar')
    // Traemos la info del rol y nivel dentro de la comunidad
    .populate('authorMemberId', 'nickname role level'); 

  const total = await PostModel.countDocuments(query);

  return {
    posts,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalPosts: total
  };
};