import { Router } from 'express';
import { joinCommunity, getUserCommunities} from './community-member.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Ruta: POST /api/v1/community-members/:communityId/join
router.post('/:communityId/join', verifyToken, joinCommunity);

// Ruta: GET /api/v1/community-members/me/communities
router.get('/my', verifyToken, getUserCommunities);

// Aquí a futuro agregaremos rutas como:
// router.put('/:communityId/role', changeMemberRole);
// router.delete('/:communityId/leave', leaveCommunity);

export default router;


