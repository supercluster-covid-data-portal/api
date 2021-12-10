import { Router } from 'express';

const router: Router = Router();

router.get('/', (req, res) => {
  res.status(200).send({
    message: 'API Server is running...',
  });
});

export default router;
