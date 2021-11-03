import { Router } from 'express';

const SAMPLE_ENDPOINT = '/sample';
// Export module for registering router in express app
export const router: Router = Router();

// Define your routes here
router.get(SAMPLE_ENDPOINT, (req, res) => {
  res.status(200).send({
    message: 'GET request from sample router',
  });
});

router.post(SAMPLE_ENDPOINT, (req, res) => {
  res.status(200).send({
    message: 'POST request from sample router',
  });
});

router.put(SAMPLE_ENDPOINT, (req, res) => {
  res.status(200).send({
    message: 'PUT request from sample router',
  });
});

router.delete(SAMPLE_ENDPOINT, (req, res) => {
  res.status(200).send({
    message: 'DELETE request from sample router',
  });
});
