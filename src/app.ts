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
import wikiRoutes from './modules/wikis/wiki.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import likeRoutes from './modules/likes/like.routes';
import economyRoutes from './modules/economy/economy.routes'
import insurrectionRoutes from './modules/governance/insurrection.routes';
import communityTitleRoutes from './modules/community-titles/community-title.routes';
import moderationRoutes from './modules/moderation/moderation.routes'

const app: Application = express();

app.use(cors());
app.use(express.json());

// Usamos el prefijo desde la configuración
const apiPrefix = config.api.prefix;

// Registramos los módulos con el prefijo dinámico
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/communities`, communityRoutes);
app.use(`${apiPrefix}/posts`, postRoutes);
app.use(`${apiPrefix}/comments`, commentRoutes);
app.use(`${apiPrefix}/community-members`, communityMemberRoutes);
app.use(`${apiPrefix}/chats`, chatRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/wikis`, wikiRoutes);
app.use(`${apiPrefix}/likes`, likeRoutes);
app.use(`${apiPrefix}/economy`, economyRoutes);
app.use(`${apiPrefix}/governance/insurrections`, insurrectionRoutes);
app.use(`${apiPrefix}/community-titles`, communityTitleRoutes);
app.use('${apiPrefix}/moderation', moderationRoutes);

export default app;