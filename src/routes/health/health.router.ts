import { Router } from 'express';

const router: Router = Router();

router.get('/', (req, res) => {
  res.status(200).send({
    status: 'API Server is running...',
  });
});
export default router;
