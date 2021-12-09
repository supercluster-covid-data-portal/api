import { AUTH_ENDPOINT, HEALTH_ENDPOINT, STORAGE_ENDPOINT } from '@/constants/endpoint';
import { Router } from 'express';

import AuthRouter from './auth/auth.router';
import HealthRouter from './health/health.router';
import StorageRouter from './storage/storage.router';

const Routes = (): Router => {
  const router = Router();

  // Put health router at both /health and / to cover bases when checking for server health
  router.use('/', HealthRouter);

  router.use(AUTH_ENDPOINT, AuthRouter);
  router.use(HEALTH_ENDPOINT, HealthRouter);
  router.use(STORAGE_ENDPOINT, StorageRouter);

  return router;
};
export default Routes;
