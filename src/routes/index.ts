import { Router } from 'express';

import authRouter from './auth/auth.router';
import storageRouter from './storage/storage.router';

const routes = (): Router => {
  const router = Router();

  router.use('/auth', authRouter);
  router.use('/storage', storageRouter);

  return router;
};

export default routes;

export { default as healthRouter } from './health/health.router';
