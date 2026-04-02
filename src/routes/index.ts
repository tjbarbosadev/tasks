import { Router } from 'express';
import { usersRoutes } from './usersRoutes';
import { sessionsRoutes } from './sessionsRoutes';
import { teamsRoutes } from './teamsRoutes';

const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

routes.use('/users', usersRoutes);
routes.use('/sessions', sessionsRoutes);
routes.use('/teams', teamsRoutes);

export { routes };
