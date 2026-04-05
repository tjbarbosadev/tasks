import { Router } from 'express';
import { TasksController } from '../controllers/TasksController';
import { verifyUserAuthorization } from '../middlewares/verifyUserAuthorization';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const tasksRoutes = Router();
const tasksController = new TasksController();

tasksRoutes.use(ensureAuthenticated);

tasksRoutes.get('/', tasksController.index);

tasksRoutes.get(
  '/task/:taskId',
  verifyUserAuthorization(['admin']),
  tasksController.history,
);

tasksRoutes.get(
  '/:id',
  verifyUserAuthorization(['admin']),
  tasksController.index,
);
tasksRoutes.post(
  '/',
  verifyUserAuthorization(['admin']),
  tasksController.create,
);
tasksRoutes.patch(
  '/:id',
  verifyUserAuthorization(['admin']),
  tasksController.update,
);
tasksRoutes.delete(
  '/:id',
  verifyUserAuthorization(['admin']),
  tasksController.delete,
);

export { tasksRoutes };
