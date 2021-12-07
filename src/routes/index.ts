import { Router } from 'express';

import AuthRouter from './auth/auth.router';
import HealthRouter from './health/health.router';
import StorageRouter from './storage/storage.router';

const Routes = (): Router => {
  const router = Router();

  router.use('/auth', AuthRouter);
  router.use('/health', HealthRouter);
  router.use('/storage', StorageRouter);

  return router;
};
export default Routes;
