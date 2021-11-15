import { Router } from 'express';
import { HEALTH_ENDPOINT } from '../../constants/endpoint';
import { getRoutes } from './health.service';

export const router: Router = Router();

// getStatus
router.get('/', (req, res) => {
  res.status(200).send({
    status: 'API Server is running...',
  });
});

// getRoutes
router.get('/routes', (req, res) => {
  const routes = getRoutes();

  res.status(200).send({
    numberOfRoutes: routes.length,
    routes: routes,
  });
});
