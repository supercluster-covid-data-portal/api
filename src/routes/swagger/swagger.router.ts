import { Router } from 'express';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import manifest from '@/../package.json';

const router: Router = Router();
const specs = swaggerJsdoc({
  definition: {
    openapi: '3.0.2',
    info: {
      title: manifest?.name || '',
      version: manifest?.version || '',
      description: manifest?.description || '',
    },
  },
  apis: [path.resolve(__dirname, '../**/*.router.ts')],
});

router.use('/', swaggerUi.serve, swaggerUi.setup(specs));

export default router;
