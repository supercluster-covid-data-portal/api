import { Router } from 'express';

import { SWAGGER_ENDPOINT } from '@/constants/endpoint';

import authRouter from './auth/auth.router';
import sequenceDownloadRouter from './download/download.router';
import storageRouter from './storage/storage.router';

const routes = (): Router => {
  const router = Router();

  router.use('/auth', authRouter);
  router.use('/download/sequences', sequenceDownloadRouter);
  router.use('/storage', storageRouter);

  router.get('/docs', (req, res) => {
    res.status(302).redirect(SWAGGER_ENDPOINT);
  });

  return router;
};

export default routes;

export { default as healthRouter } from './health/health.router';
export { default as swaggerRouter } from './swagger/swagger.router';
