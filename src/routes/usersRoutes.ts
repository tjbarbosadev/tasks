import { Router } from 'express';
import { UsersController } from '../controllers/UsersController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { verifyUserAuthorization } from '../middlewares/verifyUserAuthorization';

const usersRoutes = Router();
const usersController = new UsersController();

usersRoutes.use(ensureAuthenticated, verifyUserAuthorization(['admin']));

usersRoutes.get('/', usersController.index);
usersRoutes.post('/', usersController.create);
usersRoutes.patch('/:id', usersController.update);
usersRoutes.delete('/:id', usersController.delete);

export { usersRoutes };
