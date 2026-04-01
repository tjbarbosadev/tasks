import { Router } from 'express';
import { usersRoutes } from './usersRoutes';

const routes = Router();

routes.use('/users', usersRoutes);

routes.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

export { routes };
