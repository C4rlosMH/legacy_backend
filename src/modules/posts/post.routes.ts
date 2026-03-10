import { Router } from 'express';
import { createPost, getCommunityFeed, getGlobalFeed, moderatePost,
  updatePost, deletePost, resolveQuestion, getAds, getFeed,
 } from './post.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireCommunityRole } from '../../middlewares/community-role.middleware';
import { requireLevel } from '../../middlewares/level-gate.middleware';
import { config } from '../../config';


const router = Router();

// Ejemplo general: GET /api/v1/posts/feed?context=community&communityId=123
// Ejemplo filtrado: GET /api/v1/posts/feed?context=community&communityId=123&postType=blog
router.get('/feed', getFeed);

// Ejemplo: GET /api/v1/posts/ads/search?context=global_thread&tags=programador
router.get('/ads/search', getAds);

// Ruta: POST /api/v1/posts
router.post('/',  verifyToken, requireLevel(config.permissions.minLevelToPost), createPost);

// Ruta: PUT /api/v1/posts/:postId
router.put('/:postId', verifyToken, updatePost);

// Ruta: DELETE /api/v1/posts/:postId
router.delete('/:postId', verifyToken, deletePost);

// Ruta: GET /api/v1/posts/global
router.get('/global', getGlobalFeed);

// Ruta: GET /api/v1/posts/community/:communityId
router.get('/community/:communityId', getCommunityFeed);

router.put(
  '/:communityId/:postId/moderate',
  verifyToken,
  requireCommunityRole(['owner', 'admin', 'moderator']), 
  moderatePost
);

// Ejemplo de uso: PATCH /api/v1/posts/12345/resolve/67890
router.patch('/:postId/resolve/:commentId', verifyToken, resolveQuestion);


export default router;