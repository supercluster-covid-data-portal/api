import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import config from './config';

const router: Router = Router();
const specs = swaggerJsdoc(config);

router.use('/', swaggerUi.serve, swaggerUi.setup(specs));

export default router;
