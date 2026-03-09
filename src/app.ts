import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config'; // Importamos la configuración

// Importamos las rutas de los módulos
import userRoutes from './modules/users/user.routes';
import communityRoutes from './modules/communities/community.routes';
import postRoutes from './modules/posts/post.routes';
import commentRoutes from './modules/comments/comment.routes';
import communityMemberRoutes from './modules/community-members/community-member.routes';
import chatRoutes from './modules/chats/chat.routes';
import notificationRoutes from './modules/notifications/notification.routes';

const app: Application = express();

app.use(cors());
app.use(express.json());

// Usamos el prefijo desde la configuración
const apiPrefix = config.api.prefix;

app.get(`${apiPrefix}/health`, (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Servidor funcionando.' });
});

// Registramos los módulos con el prefijo dinámico
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/communities`, communityRoutes);
app.use(`${apiPrefix}/posts`, postRoutes);
app.use(`${apiPrefix}/comments`, commentRoutes);
app.use(`${apiPrefix}/community-members`, communityMemberRoutes);
app.use(`${apiPrefix}/chats`, chatRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);


export default app;