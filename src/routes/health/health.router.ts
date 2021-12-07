import { Router } from 'express';
import { HEALTH_ENDPOINT } from '../../constants/endpoint';
import { getRoutes } from './health.service';

const router: Router = Router();

router.get('/', (req, res) => {
  res.status(200).send({
    status: 'API Server is running...',
  });
});
