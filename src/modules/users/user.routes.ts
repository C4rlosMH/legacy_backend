import { Router } from 'express';
import { registerUser, loginUser } from './user.controller';

const router = Router();

// Ruta: POST /api/users/register
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;