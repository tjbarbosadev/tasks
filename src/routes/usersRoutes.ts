import { Router } from 'express';
import { UsersController } from '../controllers/UsersController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { verifyUserAuthorization } from '../middlewares/verifyUserAuthorization';

const usersRoutes = Router();
const usersController = new UsersController();

usersRoutes.get('/', usersController.index);
usersRoutes.post('/', usersController.create);
usersRoutes.patch(
  '/:id',
  ensureAuthenticated,
  verifyUserAuthorization(['admin']),
  usersController.update,
);
usersRoutes.delete(
  '/:id',
  ensureAuthenticated,
  verifyUserAuthorization(['admin']),
  usersController.delete,
);

export { usersRoutes };
