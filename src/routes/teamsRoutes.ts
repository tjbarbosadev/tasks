import { Router } from 'express';

import { TeamsController } from '../controllers/TeamsController';
import { TeamMembersController } from '../controllers/TeamMembersControllers';

import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { verifyUserAuthorization } from '../middlewares/verifyUserAuthorization';

const teamsRoutes = Router();
const teamsController = new TeamsController();
const teamMembersController = new TeamMembersController();

teamsRoutes.use(ensureAuthenticated, verifyUserAuthorization(['admin']));

teamsRoutes.get('/', teamsController.index);
teamsRoutes.post('/', teamsController.create);
teamsRoutes.get('/:id', teamsController.show);
teamsRoutes.patch('/:id', teamsController.update);
teamsRoutes.delete('/:id', teamsController.delete);

teamsRoutes.get('/:teamId/members', teamMembersController.index);
teamsRoutes.post('/:teamId/members/:memberId', teamMembersController.create);
teamsRoutes.delete('/:teamId/members/:memberId', teamMembersController.delete);

export { teamsRoutes };
