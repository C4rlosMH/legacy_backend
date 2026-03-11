import { Router } from 'express';
import { triggerInsurrection, castVote, getActiveInsurrection, acceptRole, rejectRole,
} from './insurrection.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// GET: Revisar si hay una votación activa en un mundo
// Ejemplo: GET /api/v1/governance/insurrections/community/12345/active
router.get('/community/:communityId/active', getActiveInsurrection);

// POST: Iniciar una insurrección en un mundo
// Ejemplo: POST /api/v1/governance/insurrections/community/12345
router.post('/community/:communityId', verifyToken, triggerInsurrection);

// POST: Emitir un voto en una insurrección activa
// Ejemplo: POST /api/v1/governance/insurrections/67890/vote
// Body: { "vote": "for" }
router.post('/:insurrectionId/vote', verifyToken, castVote);

// POST: El candidato acepta convertirse en el nuevo Agente
// Ejemplo: POST /api/v1/governance/insurrections/67890/accept-role
router.post('/:insurrectionId/accept-role', verifyToken, acceptRole);

// POST: El candidato rechaza el cargo
// Ejemplo: POST /api/v1/governance/insurrections/67890/reject-role
router.post('/:insurrectionId/reject-role', verifyToken, rejectRole);

export default router;