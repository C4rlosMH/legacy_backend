import { Router } from 'express';
import { createPost, getCommunityFeed, getGlobalFeed, moderatePost,
  updatePost, deletePost
 } from './post.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { requireCommunityRole } from '../../middlewares/community-role.middleware';
import { requireLevel } from '../../middlewares/level-gate.middleware';
import { config } from '../../config';


const router = Router();

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


export default router;