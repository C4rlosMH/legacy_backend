import { Router } from 'express';
import { createPost, getCommunityFeed } from './post.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Ruta: POST /api/v1/posts
router.post('/', verifyToken, createPost);

// Ruta: GET /api/v1/posts/community/:communityId
router.get('/community/:communityId', getCommunityFeed);

export default router;